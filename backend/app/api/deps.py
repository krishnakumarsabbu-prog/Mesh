from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db
from app.services.auth_service import auth_service
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer()

ADMIN_ROLES = {UserRole.SUPER_ADMIN, UserRole.LOB_ADMIN, UserRole.PROJECT_ADMIN, UserRole.ADMIN}
SUPER_ADMIN_ROLES = {UserRole.SUPER_ADMIN}
LOB_ADMIN_ROLES = {UserRole.SUPER_ADMIN, UserRole.LOB_ADMIN, UserRole.ADMIN}
PROJECT_ADMIN_ROLES = {UserRole.SUPER_ADMIN, UserRole.LOB_ADMIN, UserRole.PROJECT_ADMIN, UserRole.ADMIN}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    user = await auth_service.get_current_user(db, token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


async def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in SUPER_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return current_user


async def require_lob_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in LOB_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="LOB admin access required")
    return current_user


async def require_project_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in PROJECT_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project admin access required")
    return current_user


def check_permission(user: User, allowed_roles: set) -> bool:
    return user.role in allowed_roles
