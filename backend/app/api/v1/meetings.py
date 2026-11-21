"""
EduVerse AI - Meetings API Router (Phase 6)
Endpoints for viewing and updating Parent–Teacher consultation meetings.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.intelligence import MeetingRequestResponse, MeetingStatusUpdateRequest
from app.services.meeting_service import meeting_service

router = APIRouter()


@router.get("", response_model=List[MeetingRequestResponse], summary="List consultation meetings for current user")
@router.get("/", response_model=List[MeetingRequestResponse], include_in_schema=False)
async def get_my_meetings(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await meeting_service.list_meetings_for_user(db, current_user, status_filter)
    return res


@router.put("/{meeting_id}/status", response_model=MeetingRequestResponse, summary="Confirm, reschedule, or update meeting status")
async def update_meeting_status(
    meeting_id: str,
    req: MeetingStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await meeting_service.update_meeting_status(
        db=db,
        user=current_user,
        meeting_id=meeting_id,
        status=req.status,
        teacher_notes=req.teacher_notes,
        meeting_link=req.meeting_link,
        new_date=req.new_date,
        new_time_slot=req.new_time_slot,
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res
