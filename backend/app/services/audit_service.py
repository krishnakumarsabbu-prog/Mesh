from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.models.audit import AuditLog
import uuid
import json


class AuditService:
    async def log(
        self,
        db: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[str] = None,
        changes: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> AuditLog:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=json.dumps(changes) if changes else None,
            ip_address=ip_address,
            user_agent=user_agent,
            tenant_id=tenant_id,
        )
        db.add(entry)
        await db.flush()
        return entry

    async def get_logs(
        self,
        db: AsyncSession,
        tenant_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditLog]:
        q = select(AuditLog).order_by(AuditLog.created_at.desc())
        if tenant_id:
            q = q.where(AuditLog.tenant_id == tenant_id)
        if resource_type:
            q = q.where(AuditLog.resource_type == resource_type)
        if user_id:
            q = q.where(AuditLog.user_id == user_id)
        q = q.limit(limit).offset(offset)
        result = await db.execute(q)
        return result.scalars().all()


audit_service = AuditService()
