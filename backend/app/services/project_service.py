from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.models.project import Project
from app.models.connector import Connector, ConnectorStatus
from app.schemas.project import ProjectCreate, ProjectUpdate
import uuid


class ProjectService:
    async def create(self, db: AsyncSession, data: ProjectCreate, user_id: str) -> Project:
        project = Project(
            id=str(uuid.uuid4()),
            name=data.name,
            slug=data.slug,
            description=data.description,
            lob_id=data.lob_id,
            environment=data.environment,
            tags=data.tags,
            color=data.color,
            created_by=user_id,
        )
        db.add(project)
        await db.flush()
        return project

    async def get_all(self, db: AsyncSession, lob_id: Optional[str] = None) -> List[dict]:
        q = select(Project)
        if lob_id:
            q = q.where(Project.lob_id == lob_id)
        result = await db.execute(q)
        projects = result.scalars().all()
        output = []
        for p in projects:
            conn_count = await db.execute(select(func.count(Connector.id)).where(Connector.project_id == p.id))
            healthy = await db.execute(select(func.count(Connector.id)).where(
                Connector.project_id == p.id, Connector.status == ConnectorStatus.HEALTHY))
            degraded = await db.execute(select(func.count(Connector.id)).where(
                Connector.project_id == p.id, Connector.status == ConnectorStatus.DEGRADED))
            down = await db.execute(select(func.count(Connector.id)).where(
                Connector.project_id == p.id, Connector.status == ConnectorStatus.DOWN))
            d = {**p.__dict__}
            d["connector_count"] = conn_count.scalar()
            d["healthy_count"] = healthy.scalar()
            d["degraded_count"] = degraded.scalar()
            d["down_count"] = down.scalar()
            output.append(d)
        return output

    async def get_by_id(self, db: AsyncSession, project_id: str) -> Optional[Project]:
        result = await db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def update(self, db: AsyncSession, project_id: str, data: ProjectUpdate) -> Optional[Project]:
        project = await self.get_by_id(db, project_id)
        if not project:
            return None
        for key, val in data.model_dump(exclude_none=True).items():
            setattr(project, key, val)
        await db.flush()
        return project

    async def delete(self, db: AsyncSession, project_id: str) -> bool:
        project = await self.get_by_id(db, project_id)
        if not project:
            return False
        await db.delete(project)
        await db.flush()
        return True


project_service = ProjectService()
