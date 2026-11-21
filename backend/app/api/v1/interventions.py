"""
EduVerse AI - Intelligent Early-Warning and Intervention Endpoints (Phase 6.5)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.innovation import (
    EarlyWarningAlertResponse,
    CreateInterventionActionRequest,
    UpdateInterventionStatusRequest,
    InterventionRecordResponse,
    StudentEarlyWarningSummary,
)
from app.services.intervention_service import intervention_service

router = APIRouter(prefix="/interventions", tags=["Early-Warning & Interventions"])


@router.get("/alerts", response_model=List[EarlyWarningAlertResponse])
@router.get("/alerts/", include_in_schema=False)
async def list_early_warning_alerts(
    student_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT])),
    db: AsyncSession = Depends(get_db)
):
    """
    List early-warning alerts for teachers, administrators, and authorized parents.
    """
    inst_id = current_user.institution_id or "inst-default"
    target_student_id = student_id
    if current_user.role == UserRole.STUDENT:
        target_student_id = current_user.id

    alerts = await intervention_service.list_alerts(
        db=db,
        institution_id=inst_id,
        student_id=target_student_id,
        risk_level=risk_level
    )
    return alerts


@router.post("/actions/create", response_model=InterventionRecordResponse)
async def create_intervention_action(
    req: CreateInterventionActionRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Schedule an academic intervention action (Remedial Session, Parent Conference, etc.).
    """
    try:
        record = await intervention_service.create_intervention(
            db=db,
            alert_id=req.alert_id,
            teacher_id=current_user.id,
            student_id=req.student_id,
            action_type=req.action_type,
            notes=req.notes,
            scheduled_for=req.scheduled_for
        )
        return record
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/actions/{action_id}/status", response_model=InterventionRecordResponse)
async def update_intervention_status(
    action_id: str,
    req: UpdateInterventionStatusRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update intervention execution status and record student progress evaluation.
    """
    try:
        record = await intervention_service.update_intervention_status(
            db=db,
            action_id=action_id,
            status=req.status,
            outcome_evaluation=req.outcome_evaluation,
            notes=req.notes
        )
        return record
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/student/{student_id}/summary", response_model=StudentEarlyWarningSummary)
async def get_student_early_warning_summary(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve supportive early-warning summary with personalized parent guidance in EN, TE, and HI.
    """
    try:
        summary = await intervention_service.get_student_summary(db, student_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
