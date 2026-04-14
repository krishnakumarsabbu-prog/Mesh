from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from app.db.base import get_db
from app.schemas.user import UserResponse, UserUpdate, UserAdminCreate, RoleAssignmentCreate, RoleAssignmentResponse
from app.models.user import User, UserRole, UserRoleAssignment
from app.api.deps import get_current_user, require_admin, require_super_admin, ADMIN_ROLES
from app.core.security import get_password_hash
import uuid

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
async def list_users(
    search: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = select(User).where(User.tenant_id == current_user.tenant_id)

    if search:
        query = query.where(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserAdminCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if data.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super admins can create super admins")

    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        tenant_id=current_user.tenant_id or "default",
    )
    db.add(user)
    await db.flush()
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_self = current_user.id == user_id
    is_admin = current_user.role in ADMIN_ROLES

    if not is_self and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.role is not None and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change own role")

    if data.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super admins can assign super admin role")

    if data.is_active is not None and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change account status")

    if data.is_active is False and user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own account")

    update_data = data.model_dump(exclude_none=True)
    if "password" in update_data:
        user.hashed_password = get_password_hash(update_data.pop("password"))

    for key, val in update_data.items():
        setattr(user, key, val)

    await db.flush()
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    await db.flush()


@router.post("/{user_id}/roles", response_model=RoleAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def assign_role(
    user_id: str,
    data: RoleAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super admins can assign super admin role")

    assignment = UserRoleAssignment(
        id=str(uuid.uuid4()),
        user_id=user_id,
        role=data.role,
        resource_type=data.resource_type,
        resource_id=data.resource_id,
        granted_by=current_user.id,
    )
    db.add(assignment)
    await db.flush()
    return assignment


@router.delete("/{user_id}/roles/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role(
    user_id: str,
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(
        select(UserRoleAssignment).where(
            UserRoleAssignment.id == assignment_id,
            UserRoleAssignment.user_id == user_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role assignment not found")

    await db.delete(assignment)
    await db.flush()
