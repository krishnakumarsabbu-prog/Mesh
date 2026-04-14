from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, lobs, projects, connectors, health, chatbot, audit, connector_catalog

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(lobs.router)
api_router.include_router(projects.router)
api_router.include_router(connectors.router)
api_router.include_router(health.router)
api_router.include_router(chatbot.router)
api_router.include_router(audit.router)
api_router.include_router(connector_catalog.router)
