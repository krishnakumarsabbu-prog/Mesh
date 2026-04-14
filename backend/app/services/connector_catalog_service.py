from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import httpx
import uuid
import re

from app.models.connector_catalog import ConnectorCatalogEntry, CatalogConnectorCategory, CatalogConnectorStatus
from app.schemas.connector_catalog import (
    ConnectorCatalogCreate,
    ConnectorCatalogUpdate,
    ConnectorCatalogTestRequest,
    ConnectorCatalogTestResult,
)


def _slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


class ConnectorCatalogService:
    async def get_all(
        self,
        db: AsyncSession,
        category: Optional[str] = None,
        enabled_only: bool = False,
    ) -> List[ConnectorCatalogEntry]:
        q = select(ConnectorCatalogEntry)
        if category:
            q = q.where(ConnectorCatalogEntry.category == category)
        if enabled_only:
            q = q.where(ConnectorCatalogEntry.is_enabled == True)
        q = q.order_by(ConnectorCatalogEntry.is_system.desc(), ConnectorCatalogEntry.name)
        result = await db.execute(q)
        return result.scalars().all()

    async def get_by_id(self, db: AsyncSession, entry_id: str) -> Optional[ConnectorCatalogEntry]:
        result = await db.execute(
            select(ConnectorCatalogEntry).where(ConnectorCatalogEntry.id == entry_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[ConnectorCatalogEntry]:
        result = await db.execute(
            select(ConnectorCatalogEntry).where(ConnectorCatalogEntry.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        data: ConnectorCatalogCreate,
        user_id: str,
    ) -> ConnectorCatalogEntry:
        slug = data.slug or _slugify(data.name)
        existing = await self.get_by_slug(db, slug)
        if existing:
            slug = f"{slug}-{str(uuid.uuid4())[:8]}"

        entry = ConnectorCatalogEntry(
            id=str(uuid.uuid4()),
            slug=slug,
            name=data.name,
            description=data.description,
            vendor=data.vendor,
            category=data.category,
            icon=data.icon,
            color=data.color,
            tags=data.tags,
            config_schema=data.config_schema,
            default_config=data.default_config,
            test_definition=data.test_definition,
            docs_url=data.docs_url,
            version=data.version,
            is_system=False,
            is_enabled=True,
            created_by=user_id,
        )
        db.add(entry)
        await db.flush()
        return entry

    async def update(
        self,
        db: AsyncSession,
        entry_id: str,
        data: ConnectorCatalogUpdate,
    ) -> Optional[ConnectorCatalogEntry]:
        entry = await self.get_by_id(db, entry_id)
        if not entry:
            return None
        for key, val in data.model_dump(exclude_none=True).items():
            setattr(entry, key, val)
        entry.updated_at = datetime.utcnow()
        await db.flush()
        return entry

    async def toggle_enabled(
        self,
        db: AsyncSession,
        entry_id: str,
        enabled: bool,
    ) -> Optional[ConnectorCatalogEntry]:
        entry = await self.get_by_id(db, entry_id)
        if not entry:
            return None
        entry.is_enabled = enabled
        entry.updated_at = datetime.utcnow()
        await db.flush()
        return entry

    async def delete(self, db: AsyncSession, entry_id: str) -> bool:
        entry = await self.get_by_id(db, entry_id)
        if not entry or entry.is_system:
            return False
        await db.delete(entry)
        await db.flush()
        return True

    async def test_connector(
        self,
        db: AsyncSession,
        entry_id: str,
        test_req: ConnectorCatalogTestRequest,
    ) -> ConnectorCatalogTestResult:
        entry = await self.get_by_id(db, entry_id)
        if not entry:
            return ConnectorCatalogTestResult(success=False, error="Connector not found")

        try:
            timeout = test_req.timeout_seconds or 10
            start = datetime.utcnow()
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(test_req.endpoint_url)
            elapsed = (datetime.utcnow() - start).total_seconds() * 1000

            success = response.status_code < 400
            return ConnectorCatalogTestResult(
                success=success,
                status_code=response.status_code,
                response_time_ms=round(elapsed, 2),
                details={"url": test_req.endpoint_url, "content_type": response.headers.get("content-type")},
            )
        except httpx.TimeoutException:
            return ConnectorCatalogTestResult(success=False, error="Connection timed out")
        except Exception as e:
            return ConnectorCatalogTestResult(success=False, error=str(e))


connector_catalog_service = ConnectorCatalogService()
