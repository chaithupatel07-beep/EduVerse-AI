"""
EduVerse AI - Progress and Analytics API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_student
from app.models.user import User, UserRole
from app.schemas.progress import StudentProgressSummary, InstitutionDashboardStats
from app.services.progress_service import progress_service
from app.services.relationship_service import relationship_service

router = APIRouter(prefix="/progress", tags=["Academic Progress"])


@router.get("/my-progress", response_model=StudentProgressSummary)
async def get_my_progress(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    return await progress_service.get_student_progress(db, current_user.id)


@router.get("/student/{student_id}", response_model=StudentProgressSummary)
async def get_student_progress(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Authorization checks
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access another student's progress.")

    if current_user.role == UserRole.PARENT:
        children = await relationship_service.get_verified_children(db, current_user.id)
        if not any(c.id == student_id for c in children):
            raise HTTPException(status_code=403, detail="Access denied: Student is not your verified child.")

    return await progress_service.get_student_progress(db, student_id)


@router.get("/institution-stats", response_model=InstitutionDashboardStats)
async def get_institution_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or "inst-default"
    return await progress_service.get_institution_stats(db, inst_id)
