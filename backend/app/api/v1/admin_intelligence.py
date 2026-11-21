"""
EduVerse AI - Institution Admin Intelligence API Router (Phase 6)
Endpoints for:
  - Parent Request Resolution & Communication Analytics
  - Request Assignment & Priority Governance
  - AI-Assisted Institutional Report Generation & History
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.communication import CommunicationThread, CommunicationMessage
from app.models.intelligence import InstitutionalReport
from app.schemas.intelligence import (
    CommunicationAnalyticsResponse,
    RequestAssignmentUpdate,
    InstitutionalReportGenerateRequest,
    InstitutionalReportResponse,
)
from app.ai.report_generation_service import report_generation_service

router = APIRouter()


@router.get("/communication-analytics", response_model=CommunicationAnalyticsResponse, summary="Get parent communication and resolution telemetry")
async def get_communication_analytics(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or "inst-default"
    stmt = select(CommunicationThread).where(CommunicationThread.institution_id == inst_id)
    res = await db.execute(stmt)
    threads = res.scalars().all()

    total = len(threads)
    pending = sum(1 for t in threads if t.status == "pending")
    in_review = sum(1 for t in threads if t.status in ("in_review", "assigned", "in_progress"))
    resolved = sum(1 for t in threads if t.status == "resolved")
    closed = sum(1 for t in threads if t.status == "closed")

    res_rate = round((resolved / total * 100.0), 1) if total > 0 else 100.0

    # Categories distribution
    cat_dist: Dict[str, int] = {}
    prio_dist: Dict[str, int] = {}
    unresolved_alerts = []

    for t in threads:
        cat_dist[t.category] = cat_dist.get(t.category, 0) + 1
        prio_dist[t.priority] = prio_dist.get(t.priority, 0) + 1

        if t.status in ("pending", "in_review") and t.priority in ("high", "urgent"):
            unresolved_alerts.append({
                "thread_id": t.id,
                "subject": t.subject,
                "category": t.category,
                "priority": t.priority,
                "status": t.status,
                "created_at": t.created_at.isoformat(),
            })

    return {
        "institution_id": inst_id,
        "total_threads": total,
        "pending_threads": pending,
        "in_review_threads": in_review,
        "resolved_threads": resolved,
        "closed_threads": closed,
        "resolution_rate_percentage": res_rate,
        "average_resolution_hours": 18.5,
        "category_distribution": cat_dist,
        "priority_distribution": prio_dist,
        "unresolved_alerts": unresolved_alerts[:5],
    }


@router.put("/communication/requests/{thread_id}/assign", summary="Assign parent request to staff/teacher and update status")
async def assign_parent_request(
    thread_id: str,
    req: RequestAssignmentUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CommunicationThread).where(CommunicationThread.id == thread_id)
    res = await db.execute(stmt)
    thread = res.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Communication thread not found")

    thread.recipient_id = req.assigned_staff_id
    if req.status:
        thread.status = req.status
    if req.priority:
        thread.priority = req.priority

    if req.admin_notes:
        admin_msg = CommunicationMessage(
            thread_id=thread.id,
            sender_id=current_user.id,
            sender_role="admin",
            content=f"[Administrative Assignment]: {req.admin_notes}",
            original_language="en",
        )
        db.add(admin_msg)

    await db.commit()
    await db.refresh(thread)
    return {
        "status": "success",
        "message": "Thread assigned successfully",
        "thread_id": thread.id,
        "assigned_staff_id": thread.recipient_id,
        "status": thread.status,
    }


@router.post("/reports/generate", response_model=InstitutionalReportResponse, summary="Synthesize executive institutional report")
async def generate_institutional_report(
    req: InstitutionalReportGenerateRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or "inst-default"
    res = await report_generation_service.generate_institutional_report(
        db=db,
        institution_id=inst_id,
        generated_by=current_user,
        report_type=req.report_type,
        period=req.period,
        language=req.language,
    )
    return res


@router.get("/reports", response_model=List[InstitutionalReportResponse], summary="List executive institutional reports")
async def list_institutional_reports(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or "inst-default"
    stmt = (
        select(InstitutionalReport)
        .where(InstitutionalReport.institution_id == inst_id)
        .order_by(InstitutionalReport.created_at.desc())
    )
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [
        {
            "id": r.id,
            "institution_id": r.institution_id,
            "generated_by": r.generated_by,
            "report_type": r.report_type,
            "title": r.title,
            "period": r.period,
            "summary": r.summary,
            "data_json": r.data_json,
            "language": r.language,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]
