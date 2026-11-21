"""
EduVerse AI - Parent Intelligence API Router (Phase 6)
Endpoints for:
  - Generating verified, parent-friendly weekly & monthly academic progress summaries (EN, TE, HI)
  - Retrieving child reports
  - Parent-Teacher meeting requests
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole, ParentStudentLink
from app.models.intelligence import ParentProgressReport
from app.schemas.intelligence import (
    ParentReportGenerateRequest,
    ParentReportResponse,
    MeetingRequestCreate,
    MeetingRequestResponse,
)
from app.ai.report_generation_service import report_generation_service
from app.services.meeting_service import meeting_service

router = APIRouter()


@router.post("/reports/generate", response_model=ParentReportResponse, summary="Generate parent-friendly academic report")
async def generate_parent_report(
    req: ParentReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Authorization: parent linked to student, or student themselves, or teacher/admin
    if current_user.role == UserRole.PARENT:
        stmt_link = select(ParentStudentLink).where(
            and_(ParentStudentLink.parent_id == current_user.id, ParentStudentLink.student_id == req.student_id)
        )
        res_link = await db.execute(stmt_link)
        if not res_link.scalars().first():
            raise HTTPException(status_code=403, detail="Unauthorized: Not linked to this student")

    res = await report_generation_service.generate_parent_progress_report(
        db=db,
        student_id=req.student_id,
        parent=current_user if current_user.role == UserRole.PARENT else None,
        report_type=req.report_type,
        language=req.language,
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/reports/{student_id}", response_model=List[ParentReportResponse], summary="List progress reports for student")
async def list_parent_reports(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.PARENT:
        stmt_link = select(ParentStudentLink).where(
            and_(ParentStudentLink.parent_id == current_user.id, ParentStudentLink.student_id == student_id)
        )
        res_link = await db.execute(stmt_link)
        if not res_link.scalars().first():
            raise HTTPException(status_code=403, detail="Unauthorized")

    stmt = (
        select(ParentProgressReport)
        .where(ParentProgressReport.student_id == student_id)
        .order_by(ParentProgressReport.created_at.desc())
    )
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [
        {
            "id": r.id,
            "student_id": r.student_id,
            "student_name": r.student.full_name if r.student else "Student",
            "report_type": r.report_type,
            "language": r.language,
            "summary_text": r.summary_text,
            "strengths": r.strengths_json,
            "improvements_needed": r.improvements_needed_json,
            "parental_support_recommendations": r.parental_support_recommendations,
            "metrics_snapshot": r.metrics_snapshot_json,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.post("/meetings/request", response_model=MeetingRequestResponse, summary="Parent requests consultation meeting with teacher")
async def request_parent_teacher_meeting(
    req: MeetingRequestCreate,
    current_user: User = Depends(require_roles([UserRole.PARENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await meeting_service.request_meeting(
        db=db,
        parent=current_user,
        teacher_id=req.teacher_id,
        student_id=req.student_id,
        requested_date=req.requested_date,
        preferred_time_slot=req.preferred_time_slot,
        subject=req.subject,
        reason=req.reason,
        meeting_type=req.meeting_type,
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/meetings", response_model=List[MeetingRequestResponse], summary="List parent's meeting requests")
async def list_parent_meetings(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.PARENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await meeting_service.list_meetings_for_user(db, current_user, status_filter)
    return res
