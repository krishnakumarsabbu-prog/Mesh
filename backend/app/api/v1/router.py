from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, lobs, projects, connectors, health, chatbot, audit, connector_catalog, project_connectors, connector_agents, health_runs, project_dashboard, health_rules, analytics, search

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(lobs.router)
api_router.include_router(projects.router)
api_router.include_router(connectors.router)
api_router.include_router(health.router)
api_router.include_router(health_runs.router)
api_router.include_router(chatbot.router)
api_router.include_router(audit.router)
api_router.include_router(connector_catalog.router)
api_router.include_router(project_connectors.router)
api_router.include_router(connector_agents.router)
api_router.include_router(project_dashboard.router)
api_router.include_router(health_rules.router)
api_router.include_router(analytics.router)
api_router.include_router(search.router)
