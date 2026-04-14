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
    await _seed_default_users()


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
    import uuid

    async with AsyncSessionLocal() as session:
        for entry in _DEFAULT_USERS:
            result = await session.execute(select(User).where(User.email == entry["email"]))
            if result.scalar_one_or_none():
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
        await session.commit()
