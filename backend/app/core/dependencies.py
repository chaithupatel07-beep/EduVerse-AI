from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.services.firebase_service import firebase_service

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Authenticates the Bearer token (Firebase ID Token or Internal JWT).
    Authoritatively queries PostgreSQL for the user identity, role, and institution.
    Never trusts client-supplied roles.
    """
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.credentials
    user: Optional[User] = None

    # 1. Try Firebase ID Token Verification (Live Firebase Admin or dev mock token)
    firebase_claims = firebase_service.verify_firebase_id_token(token)
    if firebase_claims:
        uid = firebase_claims.get("uid")
        email = firebase_claims.get("email")

        # Query authoritative PostgreSQL record by firebase_uid or verified email
        query = (
            select(User)
            .options(
                selectinload(User.institution),
                selectinload(User.student_profile),
                selectinload(User.teacher_profile),
                selectinload(User.parent_profile),
            )
            .where((User.firebase_uid == uid) | (User.email == email))
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user and not user.firebase_uid and uid:
            # Sync firebase_uid to existing user account
            user.firebase_uid = uid
            await db.commit()
            await db.refresh(user)

    # 2. Fallback to Internal HS256 JWT Token (for Phase 1 compatibility / internal sessions)
    if not user:
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                query = (
                    select(User)
                    .options(
                        selectinload(User.institution),
                        selectinload(User.student_profile),
                        selectinload(User.teacher_profile),
                        selectinload(User.parent_profile),
                    )
                    .where(User.id == user_id)
                )
                result = await db.execute(query)
                user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or malformed authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated or suspended. Contact institution administrator.",
        )

    return user


def require_role(*allowed_roles: UserRole):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Verifies that the user's authoritative PostgreSQL role matches allowed roles.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {[r.value for r in allowed_roles]}. Current role: '{current_user.role.value}'.",
            )
        return current_user

    return role_checker


def require_roles(allowed_roles: List[UserRole]):
    return require_role(*allowed_roles)


# Role-specific dependency instances
require_student = require_role(UserRole.STUDENT, UserRole.ADMIN)
require_teacher = require_role(UserRole.TEACHER, UserRole.ADMIN)
require_parent = require_role(UserRole.PARENT, UserRole.ADMIN)
require_admin = require_role(UserRole.ADMIN)

require_teacher_or_admin = require_role(UserRole.TEACHER, UserRole.ADMIN)
require_student_or_admin = require_role(UserRole.STUDENT, UserRole.ADMIN)
require_parent_or_admin = require_role(UserRole.PARENT, UserRole.ADMIN)
