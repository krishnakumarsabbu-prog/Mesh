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
            from app.models import user, lob, project, connector, health_check, audit  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified")
    except Exception as exc:
        logger.error(f"Failed to initialize database tables: {exc}")
        raise

    if settings.SEED_DB:
        await _seed_default_users()
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
