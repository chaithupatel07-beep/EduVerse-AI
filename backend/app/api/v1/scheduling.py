"""
EduVerse AI - AI Smart Timetable & Study Scheduler Endpoints (Phase 6.5)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.innovation import (
    StudyTimetableGenerateRequest,
    StudyTimetableResponse,
    StudySessionResponse,
)
from app.services.study_scheduler_service import study_scheduler_service

router = APIRouter(prefix="/scheduling", tags=["Smart Timetable & Scheduler"])


@router.post("/generate", response_model=StudyTimetableResponse)
async def generate_smart_timetable(
    req: StudyTimetableGenerateRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate an intelligent, personalized weekly study schedule targeting student knowledge gaps.
    """
    inst_id = current_user.institution_id or "inst-default"
    timetable = await study_scheduler_service.generate_timetable(
        db=db,
        student_id=current_user.id,
        institution_id=inst_id,
        req=req
    )
    return timetable


@router.get("/timetable", response_model=Optional[StudyTimetableResponse])
@router.get("/timetable/", include_in_schema=False)
async def get_active_timetable(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the current active study schedule and session progress.
    """
    timetable = await study_scheduler_service.get_active_timetable(db, current_user.id)
    if not timetable:
        # Auto-generate a starter schedule if none exists
        inst_id = current_user.institution_id or "inst-default"
        timetable = await study_scheduler_service.generate_timetable(
            db=db,
            student_id=current_user.id,
            institution_id=inst_id,
            req=StudyTimetableGenerateRequest(daily_available_hours=3.0, optimization_goal="exam_prep")
        )
    return timetable


@router.patch("/sessions/{session_id}/complete", response_model=StudySessionResponse)
async def toggle_session_completion(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a study session as completed or in-progress, awarding gamification XP.
    """
    try:
        session = await study_scheduler_service.complete_session(db, session_id, current_user.id)
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reschedule-missed")
async def reschedule_missed_study_sessions(
    timetable_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Finds past uncompleted sessions, marks them as rescheduled, and rolls them forward into future available slots.
    """
    try:
        count = await study_scheduler_service.reschedule_missed(db, timetable_id, current_user.id)
        return {
            "status": "success",
            "timetable_id": timetable_id,
            "rescheduled_sessions_count": count,
            "message": f"Successfully rescheduled {count} missed study sessions into upcoming open slots."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
