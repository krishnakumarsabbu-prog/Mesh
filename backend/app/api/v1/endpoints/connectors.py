from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.base import get_db
from app.schemas.connector import ConnectorCreate, ConnectorUpdate, ConnectorResponse
from app.services.connector_service import connector_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("", response_model=List[dict])
async def list_connectors(
    project_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    connectors = await connector_service.get_all(db, project_id=project_id)
    return [c.__dict__ for c in connectors]


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_connector(data: ConnectorCreate, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        connector = await connector_service.create(db, data, current_user.id)
        await audit_service.log(
            db, action="connector.create", resource_type="connector", resource_id=connector.id,
            user_id=current_user.id, tenant_id=current_user.tenant_id,
            ip_address=request.client.host if request.client else None,
            changes={"name": connector.name, "type": str(connector.type), "project_id": connector.project_id},
        )
        return connector.__dict__
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{connector_id}", response_model=dict)
async def get_connector(connector_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    connector = await connector_service.get_by_id(db, connector_id)
    if not connector:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connector not found")
    return connector.__dict__


@router.patch("/{connector_id}", response_model=dict)
async def update_connector(connector_id: str, data: ConnectorUpdate, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    connector = await connector_service.update(db, connector_id, data)
    if not connector:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connector not found")
    await audit_service.log(
        db, action="connector.update", resource_type="connector", resource_id=connector_id,
        user_id=current_user.id, tenant_id=current_user.tenant_id,
        ip_address=request.client.host if request.client else None,
        changes=data.model_dump(exclude_none=True),
    )
    return connector.__dict__


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connector(connector_id: str, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not await connector_service.delete(db, connector_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connector not found")
    await audit_service.log(
        db, action="connector.delete", resource_type="connector", resource_id=connector_id,
        user_id=current_user.id, tenant_id=current_user.tenant_id,
        ip_address=request.client.host if request.client else None,
    )


@router.post("/{connector_id}/health-check", response_model=dict)
async def run_health_check(connector_id: str, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = await connector_service.run_health_check(db, connector_id)
        await audit_service.log(
            db, action="connector.health_check", resource_type="connector", resource_id=connector_id,
            user_id=current_user.id, tenant_id=current_user.tenant_id,
            ip_address=request.client.host if request.client else None,
            changes={"status": str(result.status)},
        )
        return result.__dict__
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
