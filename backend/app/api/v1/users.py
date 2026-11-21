from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
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
from app.models.profiles import (
    StudentProfile,
    TeacherProfile,
    ParentProfile,
    ParentStudentRelationship,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserProfileUpdate, UserResponse
from app.schemas.profiles import UserProfileDetailResponse
from app.services.auth_service import auth_service
from app.services.relationship_service import relationship_service

router = APIRouter(prefix="/users", tags=["Users & RBAC"])


@router.get("/me", response_model=ApiResponse[UserProfileDetailResponse])
@router.get("/profile", response_model=ApiResponse[UserProfileDetailResponse])
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full profile with authoritative role and role-specific profile details."""
    detail = await auth_service.build_user_detail_response(db, current_user)
    return ApiResponse(
        success=True,
        message="Profile retrieved successfully.",
        data=detail,
    )


@router.patch("/me", response_model=ApiResponse[UserProfileDetailResponse])
@router.put("/me", response_model=ApiResponse[UserProfileDetailResponse])
@router.put("/profile", response_model=ApiResponse[UserProfileDetailResponse])
async def update_my_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update personal profile information for currently authenticated user.
    Security: Users CANNOT change their own role or promote themselves.
    """
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name.strip()
    if update_data.phone is not None:
        current_user.phone = update_data.phone.strip()
    if update_data.bio is not None:
        current_user.bio = update_data.bio.strip()
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url.strip()

    # Role specific attribute updates
    if current_user.role == UserRole.STUDENT and update_data.grade_level is not None:
        current_user.grade_level = update_data.grade_level.strip()
        if current_user.student_profile:
            current_user.student_profile.academic_year = update_data.grade_level.strip()
        else:
            db.add(
                StudentProfile(
                    user_id=current_user.id,
                    institution_id=current_user.institution_id,
                    academic_year=update_data.grade_level.strip(),
                )
            )

    if current_user.role == UserRole.TEACHER and update_data.subject_specialization is not None:
        current_user.subject_specialization = update_data.subject_specialization.strip()
        if current_user.teacher_profile:
            current_user.teacher_profile.specialization = update_data.subject_specialization.strip()
        else:
            db.add(
                TeacherProfile(
                    user_id=current_user.id,
                    institution_id=current_user.institution_id,
                    specialization=update_data.subject_specialization.strip(),
                )
            )

    await db.commit()
    await db.refresh(current_user)

    detail = await auth_service.build_user_detail_response(db, current_user)
    return ApiResponse(
        success=True,
        message="Profile updated successfully.",
        data=detail,
    )


# --- Role-Based Portal Data Endpoints (Must be registered before /{user_id}) ---

@router.get("/student-data", response_model=ApiResponse[dict])
@router.get("/role-test/student", response_model=ApiResponse[dict])
async def get_student_portal_data(
    current_user: User = Depends(require_student),
):
    """Protected endpoint: Accessible strictly by Students (or Admins)."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Student portal for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value, "module": "student_portal"},
    )


@router.get("/teacher-data", response_model=ApiResponse[dict])
@router.get("/role-test/teacher", response_model=ApiResponse[dict])
async def get_teacher_portal_data(
    current_user: User = Depends(require_teacher),
):
    """Protected endpoint: Accessible strictly by Teachers (or Admins)."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Teacher portal for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value, "module": "teacher_portal"},
    )


@router.get("/parent-data", response_model=ApiResponse[dict])
@router.get("/role-test/parent", response_model=ApiResponse[dict])
async def get_parent_portal_data(
    current_user: User = Depends(require_parent),
):
    """Protected endpoint: Accessible strictly by Parents (or Admins)."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Parent portal for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value, "module": "parent_portal"},
    )


@router.get("/admin-data", response_model=ApiResponse[dict])
@router.get("/role-test/admin", response_model=ApiResponse[dict])
async def get_admin_portal_data(
    current_user: User = Depends(require_admin),
):
    """Protected endpoint: Accessible exclusively by Institution Administrators."""
    return ApiResponse(
        success=True,
        message=f"Access granted to Institution Administration for {current_user.full_name}.",
        data={"user_id": current_user.id, "role": current_user.role.value, "module": "admin_portal"},
    )


@router.get("/{user_id}", response_model=ApiResponse[UserProfileDetailResponse])
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve user profile by ID with strict relationship and institution authorization:
    - User inspecting self: allowed.
    - Admin: allowed for users in same institution (or system admin).
    - Parent: allowed ONLY for verified linked student children.
    - Others: 403 Forbidden.
    """
    if current_user.id == user_id:
        detail = await auth_service.build_user_detail_response(db, current_user)
        return ApiResponse(success=True, data=detail)

    target_user = await auth_service.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found.",
        )

    # 1. Admin authorization check
    if current_user.role == UserRole.ADMIN:
        if current_user.institution_id and target_user.institution_id:
            if current_user.institution_id != target_user.institution_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Institution Administrators can only access users within their own institution.",
                )
        detail = await auth_service.build_user_detail_response(db, target_user)
        return ApiResponse(success=True, data=detail)

    # 2. Parent authorization check
    if current_user.role == UserRole.PARENT:
        has_access = await relationship_service.has_verified_access(
            parent_user_id=current_user.id,
            student_user_id=target_user.id,
            db=db,
        )
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have a verified guardian relationship with this student.",
            )
        detail = await auth_service.build_user_detail_response(db, target_user)
        return ApiResponse(success=True, data=detail)

    # 3. Teacher authorization check
    if current_user.role == UserRole.TEACHER:
        if current_user.institution_id and target_user.institution_id:
            if current_user.institution_id != target_user.institution_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. User is outside your institution.",
                )
        detail = await auth_service.build_user_detail_response(db, target_user)
        return ApiResponse(success=True, data=detail)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized to access another user's profile.",
    )
