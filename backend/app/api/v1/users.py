from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_parent,
    require_role,
    require_student,
    require_teacher,
)
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.schemas.user import UserProfileUpdate, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/users", tags=["Users & RBAC"])


@router.get("/profile", response_model=ApiResponse[UserResponse])
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full profile of currently authenticated user."""
    res = await auth_service.build_user_response(db, current_user)
    return ApiResponse(success=True, data=res)


@router.put("/profile", response_model=ApiResponse[UserResponse])
async def update_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile information for the current user."""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name.strip()
    if update_data.phone is not None:
        current_user.phone = update_data.phone.strip()
    if update_data.bio is not None:
        current_user.bio = update_data.bio.strip()
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url.strip()
    if update_data.grade_level is not None and current_user.role == UserRole.STUDENT:
        current_user.grade_level = update_data.grade_level.strip()
    if update_data.subject_specialization is not None and current_user.role == UserRole.TEACHER:
        current_user.subject_specialization = update_data.subject_specialization.strip()

    await db.commit()
    await db.refresh(current_user)

    res = await auth_service.build_user_response(db, current_user)
    return ApiResponse(success=True, message="Profile updated successfully.", data=res)


# --- RBAC Test / Verification Endpoints ---

@router.get("/role-test/student", response_model=ApiResponse[dict])
async def test_student_access(
    current_user: User = Depends(require_role(UserRole.STUDENT, UserRole.ADMIN)),
):
    """Protected endpoint: Accessible only by Students (or Admins)."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Student portal for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value},
    )


@router.get("/role-test/teacher", response_model=ApiResponse[dict])
async def test_teacher_access(
    current_user: User = Depends(require_role(UserRole.TEACHER, UserRole.ADMIN)),
):
    """Protected endpoint: Accessible only by Teachers (or Admins)."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Teacher portal for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value},
    )


@router.get("/role-test/parent", response_model=ApiResponse[dict])
async def test_parent_access(
    current_user: User = Depends(require_role(UserRole.PARENT, UserRole.ADMIN)),
):
    """Protected endpoint: Accessible only by Parents (or Admins)."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Parent portal for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value},
    )


@router.get("/role-test/admin", response_model=ApiResponse[dict])
async def test_admin_access(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Protected endpoint: Accessible exclusively by Institution Administrators."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Institution Administration for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value},
    )
