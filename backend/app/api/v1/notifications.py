"""
EduVerse AI - Notification API Router (Phase 6)
Endpoints for in-app notification center, read/unread status, unread counts,
and role-specific notification preferences.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.intelligence import (
    NotificationResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdateRequest,
)
from app.services.notification_service import notification_service

router = APIRouter()


@router.get("", response_model=List[NotificationResponse], summary="Get notifications for current user")
@router.get("/", response_model=List[NotificationResponse], include_in_schema=False)
async def get_notifications(
    unread_only: bool = False,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
    )
    return notifs


@router.get("/unread-count", summary="Get number of unread notifications for badge counter")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cnt = await notification_service.get_unread_count(db, current_user.id)
    return {"unread_count": cnt}


@router.put("/{notification_id}/read", summary="Mark specific notification as read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await notification_service.mark_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "message": "Notification marked as read"}


@router.put("/read-all", summary="Mark all notifications as read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cnt = await notification_service.mark_all_as_read(db, current_user.id)
    return {"status": "success", "marked_read_count": cnt}


@router.get("/preferences", response_model=NotificationPreferenceResponse, summary="Get user notification preferences")
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await notification_service.get_or_create_preferences(db, current_user.id)
    return res


@router.put("/preferences", response_model=NotificationPreferenceResponse, summary="Update notification preferences")
async def update_notification_preferences(
    req: NotificationPreferenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await notification_service.update_preferences(
        db,
        current_user.id,
        req.model_dump(exclude_unset=True),
    )
    return res
