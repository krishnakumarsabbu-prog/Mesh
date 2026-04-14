"""
Splunk Connector Agent.

Connects to Splunk Enterprise or Splunk Cloud via the REST API (port 8089).
Authenticates using a Splunk session token (Bearer Splunk <token>).
Health check validates server info endpoint and index availability.
Metrics: number of healthy indexes, search head cluster status.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.connectors.base.http_client import (
    ConnectorAuthError,
    ConnectorHTTPClient,
    ConnectorHTTPError,
    ConnectorTimeoutError,
)
from app.connectors.base.interface import (
    BaseConnector,
    ConnectorAuthStrategy,
    ConnectorConfig,
    ConnectorCredentials,
    ConnectorHealthResult,
    ConnectorHealthStatus,
    ConnectorTestResult,
    HealthMetric,
)
from app.connectors.base.normalizer import (
    make_error_health,
    make_ok_health,
    make_test_result,
    make_timeout_health,
    metric,
)
from app.connectors.base.registry import ConnectorRegistry

logger = logging.getLogger(__name__)


@ConnectorRegistry.register("splunk")
class SplunkConnector(BaseConnector):
    """
    Splunk Enterprise / Cloud connector agent.

    Required config: base_url (https://splunk-host:8089)
    Required credentials: token (Splunk auth token)
    Optional config: index (default index to check), verify_ssl
    """

    CONNECTOR_NAME = "Splunk"
    CONNECTOR_VERSION = "9.x"

    def __init__(self, config: ConnectorConfig, credentials: ConnectorCredentials) -> None:
        super().__init__(config, credentials)
        self._client = ConnectorHTTPClient(config, credentials)

    def validate_config(self) -> List[str]:
        errors = super().validate_config()
        if not self._credentials.token:
            errors.append("Splunk auth token is required")
        return errors

    async def authenticate(self) -> bool:
        """Verify token validity by hitting /services/authentication/current-context."""
        try:
            resp, _ = await self._client.get(
                "/services/authentication/current-context",
                params={"output_mode": "json"},
                timeout_override=10,
            )
            return resp.status_code == 200
        except ConnectorAuthError:
            return False
        except Exception as exc:
            self._logger.warning("Splunk auth check failed: %s", exc)
            return False

    async def test_connection(self) -> ConnectorTestResult:
        """Test Splunk connectivity via /services/server/info."""
        try:
            resp, elapsed = await self._client.get(
                "/services/server/info",
                params={"output_mode": "json"},
                timeout_override=15,
            )
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    entry = data.get("entry", [{}])[0]
                    content = entry.get("content", {})
                    version = content.get("version", "unknown")
                    build = content.get("build", "unknown")
                    server_name = content.get("serverName", "unknown")
                    return make_test_result(
                        success=True,
                        response_time_ms=elapsed,
                        status_code=200,
                        authenticated=True,
                        details={
                            "version": version,
                            "build": build,
                            "server_name": server_name,
                            "product_type": content.get("product_type", ""),
                        },
                    )
                except Exception:
                    return make_test_result(
                        success=True,
                        response_time_ms=elapsed,
                        status_code=resp.status_code,
                        authenticated=True,
                        details={"note": "Connected but response parsing failed"},
                    )
            return make_test_result(
                success=False,
                response_time_ms=elapsed,
                status_code=resp.status_code,
                error=f"Unexpected HTTP {resp.status_code}",
            )
        except ConnectorAuthError as exc:
            return make_test_result(success=False, error=str(exc), authenticated=False)
        except ConnectorTimeoutError as exc:
            return make_test_result(success=False, error=str(exc))
        except ConnectorHTTPError as exc:
            return make_test_result(
                success=False,
                status_code=exc.status_code,
                error=str(exc),
            )
        except Exception as exc:
            self._logger.exception("Unexpected error in Splunk test_connection")
            return make_test_result(success=False, error=f"Unexpected error: {exc}")

    async def fetch_health(self) -> ConnectorHealthResult:
        """Fetch Splunk server health from /services/server/health/splunkd."""
        try:
            resp, elapsed = await self._client.get(
                "/services/server/health/splunkd",
                params={"output_mode": "json"},
            )
            if resp.status_code >= 400:
                return make_error_health(
                    f"Splunk health endpoint returned HTTP {resp.status_code}",
                    response_time_ms=elapsed,
                )
            return self.normalize_response({**resp.json(), "_elapsed_ms": elapsed})
        except ConnectorAuthError as exc:
            return make_error_health(str(exc), status=ConnectorHealthStatus.DOWN)
        except ConnectorTimeoutError:
            return make_timeout_health()
        except ConnectorHTTPError as exc:
            return make_error_health(str(exc), status=ConnectorHealthStatus.ERROR)
        except Exception as exc:
            self._logger.exception("Unexpected error in Splunk fetch_health")
            return make_error_health(f"Unexpected error: {exc}", status=ConnectorHealthStatus.ERROR)

    async def fetch_metrics(self) -> List[HealthMetric]:
        """Fetch Splunk index metrics and search performance."""
        metrics: List[HealthMetric] = []
        try:
            resp, elapsed = await self._client.get(
                "/services/data/indexes",
                params={"output_mode": "json", "count": 50},
                timeout_override=20,
            )
            if resp.status_code == 200:
                data = resp.json()
                entries = data.get("entry", [])
                healthy_indexes = sum(
                    1 for e in entries
                    if e.get("content", {}).get("health", "") in ("", "green")
                )
                metrics.append(metric(
                    name="splunk.indexes.total",
                    value=len(entries),
                    unit="count",
                    description="Total number of Splunk indexes",
                ))
                metrics.append(metric(
                    name="splunk.indexes.healthy",
                    value=healthy_indexes,
                    unit="count",
                    description="Number of healthy Splunk indexes",
                ))
        except Exception as exc:
            self._logger.warning("Failed to fetch Splunk index metrics: %s", exc)

        try:
            resp2, _ = await self._client.get(
                "/services/search/jobs",
                params={"output_mode": "json", "count": 1},
                timeout_override=10,
            )
            if resp2.status_code == 200:
                data2 = resp2.json()
                total_jobs = data2.get("paging", {}).get("total", 0)
                metrics.append(metric(
                    name="splunk.search_jobs.total",
                    value=total_jobs,
                    unit="count",
                    description="Total active/recent search jobs",
                ))
        except Exception as exc:
            self._logger.warning("Failed to fetch Splunk search job metrics: %s", exc)

        return metrics

    def normalize_response(self, raw: Dict[str, Any]) -> ConnectorHealthResult:
        """Map Splunk /services/server/health/splunkd response to ConnectorHealthResult."""
        elapsed_ms: int = raw.get("_elapsed_ms", 0)
        try:
            entry = raw.get("entry", [{}])[0]
            content = entry.get("content", {})
            health = content.get("health", "green")
            status_map = {
                "green": ConnectorHealthStatus.HEALTHY,
                "yellow": ConnectorHealthStatus.DEGRADED,
                "red": ConnectorHealthStatus.DOWN,
            }
            status = status_map.get(health.lower(), ConnectorHealthStatus.UNKNOWN)
            messages = [
                f"{k}: {v.get('health', '?')}"
                for k, v in content.get("feature_flags", {}).items()
                if isinstance(v, dict)
            ]
            message = ", ".join(messages) if messages else f"Splunk health: {health}"
            return ConnectorHealthResult(
                status=status,
                response_time_ms=elapsed_ms,
                message=message,
                raw_response=raw,
            )
        except (KeyError, IndexError, TypeError) as exc:
            self._logger.warning("Failed to parse Splunk health response: %s", exc)
            return make_ok_health(elapsed_ms, message="Splunk reachable (response unparseable)")
