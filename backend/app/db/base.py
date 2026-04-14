import logging
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    try:
        async with engine.begin() as conn:
            from app.models import user, lob, project, connector, health_check, audit, connector_catalog, project_connector, connector_execution_log, health_run, health_rule, chat, team  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified")
    except Exception as exc:
        logger.error(f"Failed to initialize database tables: {exc}")
        raise

    if settings.SEED_DB:
        await _seed_default_users()
        await _seed_connector_catalog()
    else:
        logger.info("Database seeding skipped (SEED_DB=false)")


_DEFAULT_USERS = [
    {
        "email": "superadmin@healthmesh.ai",
        "full_name": "Super Admin",
        "password": "superadmin123",
        "role": "super_admin",
    },
    {
        "email": "admin@healthmesh.ai",
        "full_name": "Platform Admin",
        "password": "admin123",
        "role": "admin",
    },
    {
        "email": "lobadmin@healthmesh.ai",
        "full_name": "LOB Admin",
        "password": "lobadmin123",
        "role": "lob_admin",
    },
    {
        "email": "projectadmin@healthmesh.ai",
        "full_name": "Project Admin",
        "password": "projectadmin123",
        "role": "project_admin",
    },
    {
        "email": "analyst@healthmesh.ai",
        "full_name": "Data Analyst",
        "password": "analyst123",
        "role": "analyst",
    },
    {
        "email": "viewer@healthmesh.ai",
        "full_name": "Read-only Viewer",
        "password": "viewer123",
        "role": "viewer",
    },
    {
        "email": "user@healthmesh.ai",
        "full_name": "Project User",
        "password": "user123",
        "role": "project_user",
    },
]


async def _seed_default_users():
    from sqlalchemy import select
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash

    logger.info("Checking database for seed users...")
    seeded = 0
    skipped = 0

    try:
        async with AsyncSessionLocal() as session:
            for entry in _DEFAULT_USERS:
                try:
                    result = await session.execute(select(User).where(User.email == entry["email"]))
                    if result.scalar_one_or_none():
                        logger.debug(f"  [skip] {entry['email']} already exists")
                        skipped += 1
                        continue

                    user = User(
                        id=str(uuid.uuid4()),
                        email=entry["email"],
                        full_name=entry["full_name"],
                        hashed_password=get_password_hash(entry["password"]),
                        role=UserRole(entry["role"]),
                        tenant_id="default",
                        is_active=True,
                    )
                    session.add(user)
                    logger.info(f"  [seed] {entry['email']} ({entry['role']})")
                    seeded += 1
                except Exception as exc:
                    logger.error(f"  [error] Failed to seed {entry['email']}: {exc}")

            await session.commit()

        if seeded:
            logger.info(f"Seeding complete: {seeded} users created, {skipped} already existed")
        else:
            logger.info(f"Seeding: all {skipped} users already exist, nothing to do")

    except Exception as exc:
        logger.error(f"Database seeding failed: {exc}")


_DEFAULT_CATALOG_CONNECTORS = [
    {
        "slug": "splunk",
        "name": "Splunk",
        "description": "Splunk Enterprise and Splunk Cloud monitoring and log aggregation platform. Connect to Splunk's REST API for health checks, index monitoring, and alert management.",
        "vendor": "Splunk Inc.",
        "category": "observability",
        "icon": "bar-chart-2",
        "color": "#FF6B35",
        "tags": "logs,observability,siem,search",
        "version": "9.x",
        "docs_url": "https://docs.splunk.com/Documentation/Splunk/latest/RESTREF",
        "config_schema": {
            "type": "object",
            "properties": {
                "base_url": {"type": "string", "title": "Base URL", "description": "Splunk server base URL (e.g. https://splunk.example.com:8089)"},
                "token": {"type": "string", "title": "API Token", "description": "Splunk authentication token", "secret": True},
                "index": {"type": "string", "title": "Default Index", "description": "Default index to query"},
                "verify_ssl": {"type": "boolean", "title": "Verify SSL", "default": True},
            },
            "required": ["base_url", "token"],
        },
        "default_config": {"verify_ssl": True},
        "test_definition": {
            "method": "GET",
            "path": "/services/server/info",
            "auth_header": "Bearer {token}",
            "expected_status": [200],
            "description": "Verify Splunk server is reachable and token is valid",
        },
    },
    {
        "slug": "grafana",
        "name": "Grafana",
        "description": "Open-source analytics and monitoring platform. Connect to Grafana's HTTP API to check dashboard availability, datasource health, and alert states.",
        "vendor": "Grafana Labs",
        "category": "observability",
        "icon": "activity",
        "color": "#F46800",
        "tags": "dashboards,metrics,visualization,alerting",
        "version": "10.x",
        "docs_url": "https://grafana.com/docs/grafana/latest/developers/http_api/",
        "config_schema": {
            "type": "object",
            "properties": {
                "base_url": {"type": "string", "title": "Base URL", "description": "Grafana instance URL"},
                "api_key": {"type": "string", "title": "API Key", "description": "Grafana service account token", "secret": True},
                "org_id": {"type": "string", "title": "Organization ID", "default": "1"},
            },
            "required": ["base_url", "api_key"],
        },
        "default_config": {"org_id": "1"},
        "test_definition": {
            "method": "GET",
            "path": "/api/health",
            "auth_header": "Bearer {api_key}",
            "expected_status": [200],
            "description": "Check Grafana health endpoint",
        },
    },
    {
        "slug": "appdynamics",
        "name": "AppDynamics",
        "description": "Full-stack application performance monitoring (APM) solution by Cisco. Monitor application performance, business transactions, and infrastructure health.",
        "vendor": "Cisco Systems",
        "category": "apm",
        "icon": "cpu",
        "color": "#00C0D1",
        "tags": "apm,performance,tracing,business-intelligence",
        "version": "23.x",
        "docs_url": "https://docs.appdynamics.com/appd/23.x/en/appdynamics-apis",
        "config_schema": {
            "type": "object",
            "properties": {
                "controller_url": {"type": "string", "title": "Controller URL"},
                "account_name": {"type": "string", "title": "Account Name"},
                "username": {"type": "string", "title": "Username"},
                "password": {"type": "string", "title": "Password", "secret": True},
                "client_id": {"type": "string", "title": "Client ID"},
                "client_secret": {"type": "string", "title": "Client Secret", "secret": True},
            },
            "required": ["controller_url", "account_name"],
        },
        "default_config": {},
        "test_definition": {
            "method": "GET",
            "path": "/controller/rest/applications?output=JSON",
            "auth": "basic",
            "expected_status": [200],
            "description": "List applications to verify AppDynamics connectivity",
        },
    },
    {
        "slug": "linborg",
        "name": "Linborg",
        "description": "Enterprise integration and data orchestration platform. Connect Linborg pipelines for data flow monitoring and integration health checks.",
        "vendor": "Linborg Technologies",
        "category": "messaging",
        "icon": "git-merge",
        "color": "#5B6EF5",
        "tags": "integration,orchestration,data-pipeline,etl",
        "version": "4.x",
        "docs_url": "https://linborg.io/docs/api",
        "config_schema": {
            "type": "object",
            "properties": {
                "base_url": {"type": "string", "title": "API Base URL"},
                "api_key": {"type": "string", "title": "API Key", "secret": True},
                "workspace_id": {"type": "string", "title": "Workspace ID"},
            },
            "required": ["base_url", "api_key"],
        },
        "default_config": {},
        "test_definition": {
            "method": "GET",
            "path": "/api/v1/status",
            "auth_header": "X-API-Key {api_key}",
            "expected_status": [200],
            "description": "Check Linborg platform status",
        },
    },
    {
        "slug": "servicenow",
        "name": "ServiceNow",
        "description": "Enterprise ITSM and workflow automation platform. Monitor incidents, change requests, and service desk metrics via the ServiceNow REST API.",
        "vendor": "ServiceNow",
        "category": "itsm",
        "icon": "clipboard-list",
        "color": "#62D84E",
        "tags": "itsm,incidents,change-management,workflow",
        "version": "Vancouver+",
        "docs_url": "https://developer.servicenow.com/dev.do#!/reference/api",
        "config_schema": {
            "type": "object",
            "properties": {
                "instance_url": {"type": "string", "title": "Instance URL", "description": "e.g. https://company.service-now.com"},
                "username": {"type": "string", "title": "Username"},
                "password": {"type": "string", "title": "Password", "secret": True},
                "client_id": {"type": "string", "title": "OAuth Client ID"},
                "client_secret": {"type": "string", "title": "OAuth Client Secret", "secret": True},
            },
            "required": ["instance_url", "username", "password"],
        },
        "default_config": {},
        "test_definition": {
            "method": "GET",
            "path": "/api/now/table/sys_db_object?sysparm_limit=1",
            "auth": "basic",
            "expected_status": [200],
            "description": "Verify ServiceNow REST API connectivity",
        },
    },
    {
        "slug": "universal-rest",
        "name": "Universal REST Connector",
        "description": "Generic HTTP/REST connector for any web service. Supports custom headers, authentication methods, and flexible health check endpoint configuration.",
        "vendor": "HealthMesh",
        "category": "custom",
        "icon": "globe",
        "color": "#2563EB",
        "tags": "rest,http,generic,custom,api",
        "version": "1.0",
        "docs_url": None,
        "config_schema": {
            "type": "object",
            "properties": {
                "base_url": {"type": "string", "title": "Base URL"},
                "health_path": {"type": "string", "title": "Health Check Path", "default": "/health"},
                "auth_type": {"type": "string", "title": "Auth Type", "enum": ["none", "bearer", "basic", "api_key"], "default": "none"},
                "token": {"type": "string", "title": "Token / API Key", "secret": True},
                "username": {"type": "string", "title": "Username"},
                "password": {"type": "string", "title": "Password", "secret": True},
                "custom_headers": {"type": "object", "title": "Custom Headers"},
                "timeout_seconds": {"type": "integer", "title": "Timeout (seconds)", "default": 30},
            },
            "required": ["base_url"],
        },
        "default_config": {"auth_type": "none", "health_path": "/health", "timeout_seconds": 30},
        "test_definition": {
            "method": "GET",
            "path": "{health_path}",
            "expected_status": [200, 201, 204],
            "description": "Perform HTTP GET against the configured health endpoint",
        },
    },
    {
        "slug": "universal-sql",
        "name": "Universal SQL Connector",
        "description": "Generic database connector supporting PostgreSQL, MySQL, MSSQL, and SQLite. Executes configurable health check queries to verify database availability.",
        "vendor": "HealthMesh",
        "category": "database",
        "icon": "database",
        "color": "#059669",
        "tags": "database,sql,postgres,mysql,mssql",
        "version": "1.0",
        "docs_url": None,
        "config_schema": {
            "type": "object",
            "properties": {
                "db_type": {"type": "string", "title": "Database Type", "enum": ["postgresql", "mysql", "mssql", "sqlite"], "default": "postgresql"},
                "host": {"type": "string", "title": "Host"},
                "port": {"type": "integer", "title": "Port"},
                "database": {"type": "string", "title": "Database Name"},
                "username": {"type": "string", "title": "Username"},
                "password": {"type": "string", "title": "Password", "secret": True},
                "ssl_mode": {"type": "string", "title": "SSL Mode", "enum": ["disable", "require", "verify-full"], "default": "require"},
                "health_query": {"type": "string", "title": "Health Check Query", "default": "SELECT 1"},
            },
            "required": ["host", "database", "username"],
        },
        "default_config": {"db_type": "postgresql", "port": 5432, "ssl_mode": "require", "health_query": "SELECT 1"},
        "test_definition": {
            "type": "sql",
            "query": "{health_query}",
            "expected_result": "non-empty",
            "description": "Execute health query to verify database connectivity",
        },
    },
]


async def _seed_connector_catalog():
    from sqlalchemy import select
    from app.models.connector_catalog import ConnectorCatalogEntry, CatalogConnectorCategory, CatalogConnectorStatus

    logger.info("Checking connector catalog for seed entries...")
    seeded = 0
    skipped = 0

    try:
        async with AsyncSessionLocal() as session:
            for entry_data in _DEFAULT_CATALOG_CONNECTORS:
                try:
                    result = await session.execute(
                        select(ConnectorCatalogEntry).where(ConnectorCatalogEntry.slug == entry_data["slug"])
                    )
                    if result.scalar_one_or_none():
                        skipped += 1
                        continue

                    entry = ConnectorCatalogEntry(
                        id=str(uuid.uuid4()),
                        slug=entry_data["slug"],
                        name=entry_data["name"],
                        description=entry_data["description"],
                        vendor=entry_data["vendor"],
                        category=CatalogConnectorCategory(entry_data["category"]),
                        status=CatalogConnectorStatus.ACTIVE,
                        icon=entry_data["icon"],
                        color=entry_data["color"],
                        tags=entry_data["tags"],
                        is_system=True,
                        is_enabled=True,
                        config_schema=entry_data.get("config_schema"),
                        default_config=entry_data.get("default_config"),
                        test_definition=entry_data.get("test_definition"),
                        docs_url=entry_data.get("docs_url"),
                        version=entry_data.get("version"),
                        created_by=None,
                    )
                    session.add(entry)
                    logger.info(f"  [seed] connector catalog: {entry_data['name']}")
                    seeded += 1
                except Exception as exc:
                    logger.error(f"  [error] Failed to seed catalog entry {entry_data['name']}: {exc}")

            await session.commit()

        if seeded:
            logger.info(f"Connector catalog seeding complete: {seeded} entries created, {skipped} already existed")
        else:
            logger.info(f"Connector catalog: all {skipped} entries already exist")

    except Exception as exc:
        logger.error(f"Connector catalog seeding failed: {exc}")
