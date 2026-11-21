"""
EduVerse AI - Attendance Management API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher_or_admin
from app.models.user import User, UserRole
from app.schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceSessionResponse,
    StudentAttendanceSummary,
)
from app.services.attendance_service import attendance_service
from app.services.relationship_service import relationship_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_attendance_session(
    session_in: AttendanceSessionCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    session = await attendance_service.create_or_update_session(db, session_in, current_user)
    return await attendance_service.get_session_details(db, session.id)


@router.get("/sessions/class/{class_id}")
async def list_class_sessions(
    class_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await attendance_service.list_class_sessions(db, class_id)


@router.get("/sessions/{session_id}")
async def get_session_details(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await attendance_service.get_session_details(db, session_id)


@router.get("/student/{student_id}")
async def get_student_attendance(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check authorization: student themself, teacher, admin, or parent of verified linked student
    if current_user.role == UserRole.STUDENT and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access another student's attendance records.")

    if current_user.role == UserRole.PARENT:
        # Verify parent-student linkage
        children = await relationship_service.get_verified_children(db, current_user.id)
        if not any(c.id == student_id for c in children):
            raise HTTPException(status_code=403, detail="Access denied: Student is not a verified linked child.")

    return await attendance_service.get_student_attendance_summary(db, student_id)


@router.get("/my-summary")
async def get_my_attendance_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Only students have a direct personal attendance summary.")
    return await attendance_service.get_student_attendance_summary(db, current_user.id)
