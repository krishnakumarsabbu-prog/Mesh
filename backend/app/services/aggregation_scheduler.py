"""
Aggregation Scheduler.

Provides three triggering mechanisms for recomputing Team/LOB aggregate metrics:

1. after_project_run(project_id)
   Called by HealthOrchestrator after a health run completes.
   Recomputes all teams that own the project, then all LOBs those teams belong to.

2. after_metric_update(project_id)
   Called when a ProjectConnectorMetric is updated.
   Same fan-out as after_project_run.

3. run_scheduled_refresh()
   Background coroutine that runs on a configurable interval and
   recomputes all teams then all LOBs.  Designed to be launched with
   asyncio as a long-lived background task.

The scheduler is intentionally fire-and-forget when called from the
orchestrator to avoid blocking the main execution path.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import List, Optional

from app.db.base import AsyncSessionLocal
from app.models.lob import Lob
from app.models.project import Project
from app.models.team import Team, TeamProject
from app.services.lob_aggregation_service import lob_aggregation_service
from app.services.team_aggregation_service import team_aggregation_service
from sqlalchemy import select, and_

logger = logging.getLogger("healthmesh.aggregation.scheduler")

_BACKGROUND_INTERVAL_SECONDS = 300


class AggregationScheduler:

    def __init__(self) -> None:
        self._running = False
        self._last_full_refresh: Optional[datetime] = None

    async def after_project_run(self, project_id: str) -> None:
        """
        Triggered after a health run completes for a project.
        Runs asynchronously so it never blocks the caller.
        """
        asyncio.ensure_future(self._recompute_for_project(project_id))

    async def after_metric_update(self, project_id: str) -> None:
        """
        Triggered after a ProjectConnectorMetric is created or updated.
        """
        asyncio.ensure_future(self._recompute_for_project(project_id))

    async def _recompute_for_project(self, project_id: str) -> None:
        try:
            async with AsyncSessionLocal() as db:
                team_ids = await self._get_team_ids_for_project(db, project_id)
                lob_ids = await self._get_lob_ids_for_project(db, project_id, team_ids)

                for team_id in team_ids:
                    try:
                        await team_aggregation_service.recompute_team(db, team_id)
                    except Exception as exc:
                        logger.error(f"[scheduler] team recompute failed team={team_id}: {exc}")

                for lob_id in lob_ids:
                    try:
                        await lob_aggregation_service.recompute_lob(db, lob_id)
                    except Exception as exc:
                        logger.error(f"[scheduler] lob recompute failed lob={lob_id}: {exc}")

                await db.commit()
        except Exception as exc:
            logger.error(f"[scheduler] _recompute_for_project failed project={project_id}: {exc}")

    async def run_scheduled_refresh(self) -> None:
        """
        Background loop.  Recomputes all teams then all LOBs every
        _BACKGROUND_INTERVAL_SECONDS seconds.  Survives individual errors.
        """
        self._running = True
        logger.info(f"[scheduler] background refresh started (interval={_BACKGROUND_INTERVAL_SECONDS}s)")
        while self._running:
            try:
                await asyncio.sleep(_BACKGROUND_INTERVAL_SECONDS)
                await self._full_refresh()
            except asyncio.CancelledError:
                logger.info("[scheduler] background refresh cancelled")
                break
            except Exception as exc:
                logger.error(f"[scheduler] background refresh error: {exc}")

    async def _full_refresh(self) -> None:
        logger.info("[scheduler] running full aggregate refresh")
        try:
            async with AsyncSessionLocal() as db:
                await team_aggregation_service.recompute_all_teams(db)
                await lob_aggregation_service.recompute_all_lobs(db)
                await db.commit()
            self._last_full_refresh = datetime.utcnow()
            logger.info("[scheduler] full aggregate refresh complete")
        except Exception as exc:
            logger.error(f"[scheduler] full refresh failed: {exc}")

    def stop(self) -> None:
        self._running = False

    async def _get_team_ids_for_project(self, db, project_id: str) -> List[str]:
        result = await db.execute(
            select(TeamProject.team_id).where(TeamProject.project_id == project_id)
        )
        return [row[0] for row in result.all()]

    async def _get_lob_ids_for_project(
        self, db, project_id: str, team_ids: List[str]
    ) -> List[str]:
        lob_ids = set()
        project_result = await db.execute(
            select(Project.lob_id).where(Project.id == project_id)
        )
        project_row = project_result.scalar_one_or_none()
        if project_row:
            lob_ids.add(project_row)

        if team_ids:
            team_result = await db.execute(
                select(Team.lob_id).where(Team.id.in_(team_ids))
            )
            for row in team_result.all():
                if row[0]:
                    lob_ids.add(row[0])

        return list(lob_ids)


aggregation_scheduler = AggregationScheduler()
