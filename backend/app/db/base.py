from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

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
    async with engine.begin() as conn:
        from app.models import user, lob, project, connector, health_check, audit  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    await _seed_default_admin()


async def _seed_default_admin():
    from sqlalchemy import select
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    import uuid

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@healthmesh.ai"))
        if result.scalar_one_or_none():
            return
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@healthmesh.ai",
            full_name="Super Admin",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.SUPER_ADMIN,
            tenant_id="default",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
