"""
AppDynamics Connector Agent.

Connects to the AppDynamics Controller REST API.
Supports Basic Auth (username@account:password) and OAuth2 client credentials.
Health check verifies controller reachability and lists applications.
Metrics: application count, agent status distribution.
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


def _build_appdynamics_credentials(
    raw_config: Dict[str, Any],
    raw_credentials: Dict[str, Any],
) -> ConnectorCredentials:
    """
    AppDynamics Basic Auth requires the format:
        username@account_name:password
    This factory merges config and credentials into the proper format.
    """
    account = raw_config.get("account_name", "")
    username = raw_credentials.get("username") or raw_config.get("username", "")
    password = raw_credentials.get("password") or raw_config.get("password", "")
    composite_user = f"{username}@{account}" if account and username else username

    return ConnectorCredentials(
        strategy=ConnectorAuthStrategy.BASIC_AUTH,
        username=composite_user,
        password=password,
    )


@ConnectorRegistry.register("appdynamics")
class AppDynamicsConnector(BaseConnector):
    """
    AppDynamics Controller REST API connector agent.

    Required config: controller_url, account_name
    Required credentials: username, password
    Optional credentials: client_id, client_secret (for OAuth2)
    """

    CONNECTOR_NAME = "AppDynamics"
    CONNECTOR_VERSION = "23.x"

    def __init__(self, config: ConnectorConfig, credentials: ConnectorCredentials) -> None:
        super().__init__(config, credentials)
        self._client = ConnectorHTTPClient(config, credentials)
        self._account_name: str = config.extra.get("account_name", "")

    @classmethod
    def from_raw(
        cls,
        config: ConnectorConfig,
        raw_config: Dict[str, Any],
        raw_credentials: Dict[str, Any],
    ) -> "AppDynamicsConnector":
        """Convenience factory that handles AppDynamics-specific credential composition."""
        credentials = _build_appdynamics_credentials(raw_config, raw_credentials)
        return cls(config, credentials)

    def validate_config(self) -> List[str]:
        errors = super().validate_config()
        if not self._credentials.username:
            errors.append("AppDynamics username is required")
        if not self._credentials.password:
            errors.append("AppDynamics password is required")
        if not self._account_name:
            errors.append("AppDynamics account_name is required")
        return errors

    async def authenticate(self) -> bool:
        """Verify credentials by listing applications (minimal permission required)."""
        try:
            resp, _ = await self._client.get(
                "/controller/rest/applications",
                params={"output": "JSON"},
                timeout_override=15,
            )
            return resp.status_code == 200
        except ConnectorAuthError:
            return False
        except Exception as exc:
            self._logger.warning("AppDynamics auth check failed: %s", exc)
            return False

    async def test_connection(self) -> ConnectorTestResult:
        """Test AppDynamics connectivity by listing applications."""
        try:
            resp, elapsed = await self._client.get(
                "/controller/rest/applications",
                params={"output": "JSON"},
                timeout_override=20,
            )
            if resp.status_code == 200:
                try:
                    apps = resp.json()
                    app_count = len(apps) if isinstance(apps, list) else 0
                    return make_test_result(
                        success=True,
                        response_time_ms=elapsed,
                        status_code=200,
                        authenticated=True,
                        details={
                            "application_count": app_count,
                            "account_name": self._account_name,
                            "controller_url": self._config.base_url,
                        },
                    )
                except Exception:
                    return make_test_result(
                        success=True,
                        response_time_ms=elapsed,
                        status_code=200,
                        authenticated=True,
                        details={"note": "Connected; response could not be parsed as JSON"},
                    )
            return make_test_result(
                success=False,
                response_time_ms=elapsed,
                status_code=resp.status_code,
                error=f"AppDynamics controller returned HTTP {resp.status_code}",
            )
        except ConnectorAuthError as exc:
            return make_test_result(success=False, error=str(exc), authenticated=False)
        except ConnectorTimeoutError as exc:
            return make_test_result(success=False, error=str(exc))
        except ConnectorHTTPError as exc:
            return make_test_result(success=False, status_code=exc.status_code, error=str(exc))
        except Exception as exc:
            self._logger.exception("Unexpected error in AppDynamics test_connection")
            return make_test_result(success=False, error=f"Unexpected error: {exc}")

    async def fetch_health(self) -> ConnectorHealthResult:
        """Health check: verify controller REST API is responding."""
        try:
            resp, elapsed = await self._client.get(
                "/controller/rest/applications",
                params={"output": "JSON"},
            )
            if resp.status_code >= 400:
                return make_error_health(
                    f"AppDynamics controller returned HTTP {resp.status_code}",
                    response_time_ms=elapsed,
                )
            return self.normalize_response({"_apps": resp.json(), "_elapsed_ms": elapsed})
        except ConnectorAuthError as exc:
            return make_error_health(str(exc), status=ConnectorHealthStatus.DOWN)
        except ConnectorTimeoutError:
            return make_timeout_health()
        except ConnectorHTTPError as exc:
            return make_error_health(str(exc), status=ConnectorHealthStatus.ERROR)
        except Exception as exc:
            self._logger.exception("Unexpected error in AppDynamics fetch_health")
            return make_error_health(f"Unexpected error: {exc}", status=ConnectorHealthStatus.ERROR)

    async def fetch_metrics(self) -> List[HealthMetric]:
        """Fetch application and tier counts from AppDynamics."""
        metrics_list: List[HealthMetric] = []
        try:
            resp, _ = await self._client.get(
                "/controller/rest/applications",
                params={"output": "JSON"},
                timeout_override=20,
            )
            if resp.status_code == 200:
                apps = resp.json()
                if isinstance(apps, list):
                    metrics_list.append(metric(
                        name="appdynamics.applications.total",
                        value=len(apps),
                        unit="count",
                        description="Total number of AppDynamics applications",
                    ))
        except Exception as exc:
            self._logger.warning("Failed to fetch AppDynamics application metrics: %s", exc)

        return metrics_list

    def normalize_response(self, raw: Dict[str, Any]) -> ConnectorHealthResult:
        """Map AppDynamics applications list to ConnectorHealthResult."""
        elapsed_ms: int = raw.get("_elapsed_ms", 0)
        apps: list = raw.get("_apps", [])
        app_count = len(apps) if isinstance(apps, list) else 0
        return make_ok_health(
            elapsed_ms,
            message=f"AppDynamics controller OK — {app_count} application(s) visible",
            raw_response=raw,
        )
