"""
Connector Agent Service.

Orchestrates connector execution by:
1. Loading project connector configuration and credentials
2. Resolving the correct connector implementation via the registry
3. Running test/health/metrics operations
4. Persisting execution logs and updating agent status records
5. Returning structured results to API endpoints

This service is the single point of contact between the API layer
and the connector agent implementations.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.connectors.base.interface import (
    ConnectorAuthStrategy,
    ConnectorConfig,
    ConnectorCredentials,
    ConnectorHealthResult,
    ConnectorHealthStatus,
    ConnectorTestResult,
)
from app.connectors.base.registry import ConnectorRegistry
from app.models.connector_execution_log import (
    AgentHealthStatus,
    ConnectorAgentStatus,
    ConnectorExecutionLog,
    ExecutionOutcome,
    ExecutionTrigger,
)
from app.models.project_connector import ProjectConnector, ProjectConnectorStatus

logger = logging.getLogger(__name__)

_OUTCOME_MAP: Dict[str, ExecutionOutcome] = {
    ConnectorHealthStatus.HEALTHY: ExecutionOutcome.SUCCESS,
    ConnectorHealthStatus.DEGRADED: ExecutionOutcome.SUCCESS,
    ConnectorHealthStatus.DOWN: ExecutionOutcome.FAILURE,
    ConnectorHealthStatus.TIMEOUT: ExecutionOutcome.TIMEOUT,
    ConnectorHealthStatus.ERROR: ExecutionOutcome.FAILURE,
    ConnectorHealthStatus.UNKNOWN: ExecutionOutcome.FAILURE,
}

_STATUS_MAP: Dict[str, AgentHealthStatus] = {
    ConnectorHealthStatus.HEALTHY: AgentHealthStatus.HEALTHY,
    ConnectorHealthStatus.DEGRADED: AgentHealthStatus.DEGRADED,
    ConnectorHealthStatus.DOWN: AgentHealthStatus.DOWN,
    ConnectorHealthStatus.TIMEOUT: AgentHealthStatus.TIMEOUT,
    ConnectorHealthStatus.ERROR: AgentHealthStatus.ERROR,
    ConnectorHealthStatus.UNKNOWN: AgentHealthStatus.UNKNOWN,
}


def _resolve_connector_slug(catalog_slug: str, catalog_category: str) -> str:
    """
    Map catalog slug to registered connector slug.

    Falls back to 'custom' if no exact match is registered.
    """
    slug = catalog_slug.lower()
    if ConnectorRegistry.is_registered(slug):
        return slug
    category_fallback = {
        "observability": "custom",
        "apm": "custom",
        "itsm": "custom",
        "database": "custom",
        "messaging": "custom",
        "custom": "custom",
    }
    return category_fallback.get(catalog_category.lower(), "custom")


def _build_config_and_credentials(
    pc: ProjectConnector,
    override_config: Optional[Dict[str, Any]] = None,
    override_credentials: Optional[Dict[str, Any]] = None,
) -> tuple[ConnectorConfig, ConnectorCredentials, Dict[str, Any], Dict[str, Any]]:
    """
    Build ConnectorConfig and ConnectorCredentials from a ProjectConnector record.

    Merges stored config/credentials with any overrides, resolves auth strategy,
    and builds the structured objects the connector implementations expect.
    """
    catalog = pc.catalog_entry

    raw_config: Dict[str, Any] = {}
    if pc.config:
        try:
            raw_config = json.loads(pc.config)
        except json.JSONDecodeError:
            pass

    raw_creds: Dict[str, Any] = {}
    if pc.credentials:
        try:
            raw_creds = json.loads(pc.credentials)
        except json.JSONDecodeError:
            pass

    if catalog and catalog.default_config:
        default = catalog.default_config
        merged_config = {**default, **raw_config}
    else:
        merged_config = dict(raw_config)

    if override_config:
        merged_config.update(override_config)
    if override_credentials:
        raw_creds.update(override_credentials)

    merged_all = {**merged_config, **raw_creds}

    base_url = (
        merged_all.get("base_url")
        or merged_all.get("controller_url")
        or merged_all.get("instance_url")
        or ""
    )
    timeout = int(merged_all.get("timeout_seconds", 30))
    verify_ssl = bool(merged_all.get("verify_ssl", True))

    connector_config = ConnectorConfig(
        base_url=base_url,
        timeout_seconds=timeout,
        max_retries=3,
        retry_backoff_factor=1.5,
        verify_ssl=verify_ssl,
        extra=merged_config,
    )

    auth_type: str = merged_config.get("auth_type", "").lower()
    token = raw_creds.get("token") or raw_creds.get("api_key") or merged_config.get("token")
    api_key = raw_creds.get("api_key") or raw_creds.get("token") or merged_config.get("api_key")
    username = raw_creds.get("username") or merged_config.get("username", "")
    password = raw_creds.get("password") or merged_config.get("password", "")

    catalog_slug = catalog.slug if catalog else ""
    if catalog_slug == "splunk":
        strategy = ConnectorAuthStrategy.SPLUNK_TOKEN
        token = raw_creds.get("token") or merged_config.get("token")
    elif catalog_slug in ("grafana",):
        strategy = ConnectorAuthStrategy.BEARER_TOKEN
    elif catalog_slug in ("appdynamics", "servicenow"):
        strategy = ConnectorAuthStrategy.BASIC_AUTH
        account = merged_config.get("account_name", "")
        if account and username and catalog_slug == "appdynamics":
            username = f"{username}@{account}"
    elif catalog_slug == "linborg":
        strategy = ConnectorAuthStrategy.API_KEY_HEADER
        api_key = token or api_key
    elif auth_type in ("bearer", "bearer_token"):
        strategy = ConnectorAuthStrategy.BEARER_TOKEN
    elif auth_type in ("basic", "basic_auth"):
        strategy = ConnectorAuthStrategy.BASIC_AUTH
    elif auth_type in ("api_key", "api_key_header"):
        strategy = ConnectorAuthStrategy.API_KEY_HEADER
    elif auth_type == "api_key_query":
        strategy = ConnectorAuthStrategy.API_KEY_QUERY
    else:
        strategy = ConnectorAuthStrategy.NONE

    credentials = ConnectorCredentials(
        strategy=strategy,
        token=token,
        api_key=api_key,
        api_key_header_name=merged_config.get("api_key_header_name", "X-API-Key"),
        username=username,
        password=password,
        client_id=raw_creds.get("client_id"),
        client_secret=raw_creds.get("client_secret"),
        extra=merged_config,
    )

    return connector_config, credentials, merged_config, raw_creds


class ConnectorAgentService:
    """Service that runs connector agents and records results."""

    async def test_connection(
        self,
        db: AsyncSession,
        pc_id: str,
        override_config: Optional[Dict[str, Any]] = None,
        override_credentials: Optional[Dict[str, Any]] = None,
        triggered_by: ExecutionTrigger = ExecutionTrigger.API,
        executor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run a connector test_connection and persist the execution log.

        Returns a dict with: success, response_time_ms, error, details,
        authenticated, connector_slug, executed_at.
        """
        pc = await self._load_pc(db, pc_id)
        if not pc:
            return {"success": False, "error": "Project connector not found"}

        if not pc.catalog_entry:
            return {"success": False, "error": "Catalog entry not found for this connector"}

        connector_config, credentials, merged_config, _ = _build_config_and_credentials(
            pc, override_config, override_credentials
        )

        if not connector_config.base_url:
            return {
                "success": False,
                "error": "No base URL configured. Please configure the connector first.",
                "details": {},
            }

        catalog_slug = pc.catalog_entry.slug if pc.catalog_entry else ""
        catalog_category = (
            pc.catalog_entry.category.value
            if pc.catalog_entry and hasattr(pc.catalog_entry.category, "value")
            else str(pc.catalog_entry.category if pc.catalog_entry else "custom")
        )
        resolved_slug = _resolve_connector_slug(catalog_slug, catalog_category)
        connector_instance = ConnectorRegistry.build(resolved_slug, connector_config, credentials)

        if not connector_instance:
            return {"success": False, "error": f"No connector implementation for slug '{resolved_slug}'"}

        validation_errors = connector_instance.validate_config()
        if validation_errors:
            return {
                "success": False,
                "error": "Configuration validation failed: " + "; ".join(validation_errors),
                "details": {"validation_errors": validation_errors},
            }

        try:
            result: ConnectorTestResult = await connector_instance.test_connection()
        except Exception as exc:
            logger.exception("Unhandled exception in connector test_connection for %s", pc_id)
            result = ConnectorTestResult(
                success=False,
                error=f"Internal error: {exc}",
            )

        outcome = ExecutionOutcome.SUCCESS if result.success else ExecutionOutcome.FAILURE
        if result.error and "timed out" in (result.error or "").lower():
            outcome = ExecutionOutcome.TIMEOUT
        elif result.error and "auth" in (result.error or "").lower():
            outcome = ExecutionOutcome.AUTH_ERROR

        log = ConnectorExecutionLog(
            id=str(uuid.uuid4()),
            project_connector_id=pc_id,
            triggered_by=triggered_by,
            outcome=outcome,
            response_time_ms=result.response_time_ms,
            error_message=result.error,
            raw_response_snippet=json.dumps(result.details)[:2000] if result.details else None,
            executed_by=executor_id,
            executed_at=datetime.utcnow(),
        )
        db.add(log)

        pc.last_test_at = datetime.utcnow()
        pc.last_test_success = result.success
        pc.last_test_error = result.error
        pc.last_test_response_ms = result.response_time_ms
        pc.status = (
            ProjectConnectorStatus.CONFIGURED if result.success
            else ProjectConnectorStatus.ERROR
        )

        await self._upsert_agent_status(
            db,
            pc_id,
            health_status=AgentHealthStatus.HEALTHY if result.success else AgentHealthStatus.DOWN,
            outcome=outcome,
            response_ms=result.response_time_ms,
            error=result.error,
        )

        await db.flush()
        return {
            "success": result.success,
            "response_time_ms": result.response_time_ms,
            "status_code": result.status_code,
            "error": result.error,
            "details": result.details,
            "authenticated": result.authenticated,
            "connector_slug": resolved_slug,
            "executed_at": log.executed_at.isoformat(),
        }

    async def sync_health(
        self,
        db: AsyncSession,
        pc_id: str,
        triggered_by: ExecutionTrigger = ExecutionTrigger.API,
        executor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run a full health sync for a project connector.

        Returns normalized health result and persists execution log + status.
        """
        pc = await self._load_pc(db, pc_id)
        if not pc:
            return {"success": False, "error": "Project connector not found"}

        if not pc.catalog_entry:
            return {"success": False, "error": "Catalog entry not found"}

        if not pc.is_enabled:
            return {"success": False, "error": "Connector is disabled", "skipped": True}

        connector_config, credentials, _, _ = _build_config_and_credentials(pc)
        if not connector_config.base_url:
            return {
                "success": False,
                "error": "No base URL configured",
                "health_status": AgentHealthStatus.UNCONFIGURED.value,
            }

        catalog_slug = pc.catalog_entry.slug if pc.catalog_entry else ""
        catalog_category = (
            pc.catalog_entry.category.value
            if pc.catalog_entry and hasattr(pc.catalog_entry.category, "value")
            else str(pc.catalog_entry.category if pc.catalog_entry else "custom")
        )
        resolved_slug = _resolve_connector_slug(catalog_slug, catalog_category)
        connector_instance = ConnectorRegistry.build(resolved_slug, connector_config, credentials)

        if not connector_instance:
            return {"success": False, "error": f"No connector implementation for '{resolved_slug}'"}

        try:
            health_result: ConnectorHealthResult = await connector_instance.fetch_health()
        except Exception as exc:
            logger.exception("Unhandled exception in connector fetch_health for %s", pc_id)
            health_result = ConnectorHealthResult(
                status=ConnectorHealthStatus.ERROR,
                response_time_ms=0,
                error=f"Internal error: {exc}",
            )

        outcome = _OUTCOME_MAP.get(health_result.status.value, ExecutionOutcome.FAILURE)
        agent_status = _STATUS_MAP.get(health_result.status.value, AgentHealthStatus.UNKNOWN)

        metrics_list: List[Any] = []
        try:
            metrics_list = await connector_instance.fetch_metrics()
        except Exception as exc:
            logger.warning("Failed to fetch metrics for %s: %s", pc_id, exc)

        metrics_snapshot = None
        if metrics_list:
            metrics_snapshot = json.dumps([
                {
                    "name": m.name,
                    "value": m.value,
                    "unit": m.unit,
                    "description": m.description,
                }
                for m in metrics_list
            ])

        raw_snippet = None
        if health_result.raw_response:
            try:
                raw_snippet = json.dumps(health_result.raw_response)[:2000]
            except Exception:
                pass

        log = ConnectorExecutionLog(
            id=str(uuid.uuid4()),
            project_connector_id=pc_id,
            triggered_by=triggered_by,
            outcome=outcome,
            response_time_ms=health_result.response_time_ms,
            error_message=health_result.error,
            raw_response_snippet=raw_snippet,
            metrics_snapshot=metrics_snapshot,
            executed_by=executor_id,
            executed_at=datetime.utcnow(),
        )
        db.add(log)

        await self._upsert_agent_status(
            db,
            pc_id,
            health_status=agent_status,
            outcome=outcome,
            response_ms=health_result.response_time_ms,
            error=health_result.error,
            metrics_snapshot=metrics_snapshot,
        )

        await db.flush()

        return {
            "success": health_result.status in (
                ConnectorHealthStatus.HEALTHY, ConnectorHealthStatus.DEGRADED
            ),
            "health_status": health_result.status.value,
            "response_time_ms": health_result.response_time_ms,
            "message": health_result.message,
            "error": health_result.error,
            "metrics": [
                {"name": m.name, "value": m.value, "unit": m.unit}
                for m in metrics_list
            ],
            "connector_slug": resolved_slug,
            "executed_at": log.executed_at.isoformat(),
        }

    async def get_status(
        self, db: AsyncSession, pc_id: str
    ) -> Optional[Dict[str, Any]]:
        """Return the latest agent status record for a project connector."""
        result = await db.execute(
            select(ConnectorAgentStatus).where(
                ConnectorAgentStatus.project_connector_id == pc_id
            )
        )
        status_record = result.scalar_one_or_none()
        if not status_record:
            return None
        return {
            "project_connector_id": pc_id,
            "health_status": status_record.health_status.value,
            "last_sync_at": status_record.last_sync_at.isoformat() if status_record.last_sync_at else None,
            "last_sync_outcome": status_record.last_sync_outcome.value if status_record.last_sync_outcome else None,
            "last_sync_response_ms": status_record.last_sync_response_ms,
            "last_error": status_record.last_error,
            "last_error_at": status_record.last_error_at.isoformat() if status_record.last_error_at else None,
            "consecutive_failures": status_record.consecutive_failures,
            "total_executions": status_record.total_executions,
            "total_failures": status_record.total_failures,
            "uptime_percentage": status_record.uptime_percentage,
            "updated_at": status_record.updated_at.isoformat() if status_record.updated_at else None,
        }

    async def get_execution_logs(
        self,
        db: AsyncSession,
        pc_id: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Return recent execution logs for a project connector."""
        from sqlalchemy import desc
        result = await db.execute(
            select(ConnectorExecutionLog)
            .where(ConnectorExecutionLog.project_connector_id == pc_id)
            .order_by(desc(ConnectorExecutionLog.executed_at))
            .limit(limit)
        )
        logs = result.scalars().all()
        return [
            {
                "id": log.id,
                "triggered_by": log.triggered_by.value,
                "outcome": log.outcome.value,
                "response_time_ms": log.response_time_ms,
                "http_status_code": log.http_status_code,
                "error_message": log.error_message,
                "executed_at": log.executed_at.isoformat() if log.executed_at else None,
            }
            for log in logs
        ]

    async def get_project_statuses(
        self, db: AsyncSession, project_id: str
    ) -> List[Dict[str, Any]]:
        """Return agent status for all connectors in a project."""
        result = await db.execute(
            select(ConnectorAgentStatus)
            .join(
                ProjectConnector,
                ConnectorAgentStatus.project_connector_id == ProjectConnector.id,
            )
            .where(ProjectConnector.project_id == project_id)
        )
        statuses = result.scalars().all()
        return [
            {
                "project_connector_id": s.project_connector_id,
                "health_status": s.health_status.value,
                "last_sync_at": s.last_sync_at.isoformat() if s.last_sync_at else None,
                "last_sync_outcome": s.last_sync_outcome.value if s.last_sync_outcome else None,
                "last_sync_response_ms": s.last_sync_response_ms,
                "last_error": s.last_error,
                "consecutive_failures": s.consecutive_failures,
                "uptime_percentage": s.uptime_percentage,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in statuses
        ]

    async def _load_pc(self, db: AsyncSession, pc_id: str) -> Optional[ProjectConnector]:
        result = await db.execute(
            select(ProjectConnector)
            .options(selectinload(ProjectConnector.catalog_entry))
            .where(ProjectConnector.id == pc_id)
        )
        return result.scalar_one_or_none()

    async def _upsert_agent_status(
        self,
        db: AsyncSession,
        pc_id: str,
        health_status: AgentHealthStatus,
        outcome: ExecutionOutcome,
        response_ms: Optional[int],
        error: Optional[str],
        metrics_snapshot: Optional[str] = None,
    ) -> None:
        result = await db.execute(
            select(ConnectorAgentStatus).where(
                ConnectorAgentStatus.project_connector_id == pc_id
            )
        )
        status_record = result.scalar_one_or_none()
        now = datetime.utcnow()

        if status_record is None:
            status_record = ConnectorAgentStatus(
                id=str(uuid.uuid4()),
                project_connector_id=pc_id,
                health_status=health_status,
                last_sync_at=now,
                last_sync_outcome=outcome,
                last_sync_response_ms=response_ms,
                last_error=error if outcome != ExecutionOutcome.SUCCESS else None,
                last_error_at=now if outcome != ExecutionOutcome.SUCCESS else None,
                consecutive_failures=0 if outcome == ExecutionOutcome.SUCCESS else 1,
                total_executions=1,
                total_failures=0 if outcome == ExecutionOutcome.SUCCESS else 1,
                uptime_percentage=100 if outcome == ExecutionOutcome.SUCCESS else 0,
                last_metrics_snapshot=metrics_snapshot,
                updated_at=now,
            )
            db.add(status_record)
        else:
            total = (status_record.total_executions or 0) + 1
            total_fail = (status_record.total_failures or 0) + (
                0 if outcome == ExecutionOutcome.SUCCESS else 1
            )
            consec_fail = (
                0 if outcome == ExecutionOutcome.SUCCESS
                else (status_record.consecutive_failures or 0) + 1
            )
            uptime = int(((total - total_fail) / total) * 100) if total > 0 else 0

            status_record.health_status = health_status
            status_record.last_sync_at = now
            status_record.last_sync_outcome = outcome
            status_record.last_sync_response_ms = response_ms
            status_record.consecutive_failures = consec_fail
            status_record.total_executions = total
            status_record.total_failures = total_fail
            status_record.uptime_percentage = uptime
            status_record.updated_at = now
            if outcome != ExecutionOutcome.SUCCESS:
                status_record.last_error = error
                status_record.last_error_at = now
            if metrics_snapshot:
                status_record.last_metrics_snapshot = metrics_snapshot

        await db.flush()


connector_agent_service = ConnectorAgentService()
