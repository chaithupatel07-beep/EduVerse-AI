"""
EduVerse AI - Announcements, Notifications, and Communications API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher_or_admin, require_parent
from app.models.user import User
from app.schemas.communication import (
    AnnouncementCreate,
    AnnouncementResponse,
    NotificationResponse,
    CommunicationRequestCreate,
    CommunicationRequestRespond,
    CommunicationRequestResponse,
)
from app.services.communication_service import communication_service

router = APIRouter(tags=["Communications & Announcements"])


# ---------------- Announcements ----------------
@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    ann_in: AnnouncementCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    return await communication_service.create_announcement(db, ann_in, current_user)


@router.get("/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(
    target_role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await communication_service.list_announcements(db, current_user, target_role)


# ---------------- Notifications ----------------
@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await communication_service.list_user_notifications(db, current_user.id, unread_only)


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await communication_service.mark_notification_read(db, notification_id, current_user.id)


# ---------------- Communication Requests ----------------
@router.post("/communication-requests", response_model=CommunicationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_communication_request(
    req_in: CommunicationRequestCreate,
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    req = await communication_service.create_communication_request(db, req_in, current_user)
    # Return formatted response
    return {
        "id": req.id,
        "parent_id": req.parent_id,
        "parent_name": current_user.full_name,
        "teacher_id": req.teacher_id,
        "student_id": req.student_id,
        "subject": req.subject,
        "message": req.message,
        "status": req.status,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
    }


@router.get("/communication-requests", response_model=List[CommunicationRequestResponse])
async def list_communication_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await communication_service.list_communication_requests(db, current_user)


@router.put("/communication-requests/{request_id}/respond", response_model=CommunicationRequestResponse)
async def respond_to_communication_request(
    request_id: str,
    resp_in: CommunicationRequestRespond,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req = await communication_service.respond_to_communication_request(
        db, request_id, resp_in, current_user
    )
    return {
        "id": req.id,
        "parent_id": req.parent_id,
        "teacher_id": req.teacher_id,
        "student_id": req.student_id,
        "subject": req.subject,
        "message": req.message,
        "status": req.status,
        "response_notes": req.response_notes,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
    }
