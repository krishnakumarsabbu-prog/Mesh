from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.db.base import get_db
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import audit_service
from app.api.deps import get_current_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=List[dict])
async def get_audit_logs(
    resource_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    logs = await audit_service.get_logs(
        db,
        tenant_id=current_user.tenant_id or "default",
        resource_type=resource_type,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    return [log.__dict__ for log in logs]
