from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
from app.models.user import User
from app.schemas.user import UserCreate, UserAdminCreate, LoginRequest, TokenResponse
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
import uuid


class AuthService:
    async def register(self, db: AsyncSession, data: UserCreate) -> User:
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            id=str(uuid.uuid4()),
            email=data.email,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password),
            role=data.role,
            tenant_id="default",
        )
        db.add(user)
        await db.flush()
        return user

    async def create_user_by_admin(self, db: AsyncSession, data: UserAdminCreate, created_by: User) -> User:
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            id=str(uuid.uuid4()),
            email=data.email,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password),
            role=data.role,
            tenant_id=created_by.tenant_id or "default",
        )
        db.add(user)
        await db.flush()
        return user

    async def login(self, db: AsyncSession, data: LoginRequest) -> TokenResponse:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        user.last_login = datetime.utcnow()

        access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "tenant": user.tenant_id})
        refresh_token = create_refresh_token({"sub": user.id})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user,
        )

    async def get_current_user(self, db: AsyncSession, token: str) -> Optional[User]:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def refresh_tokens(self, db: AsyncSession, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "tenant": user.tenant_id})
        new_refresh_token = create_refresh_token({"sub": user.id})

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=user,
        )

    async def change_password(self, db: AsyncSession, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")
        user.hashed_password = get_password_hash(new_password)
        await db.flush()


auth_service = AuthService()
