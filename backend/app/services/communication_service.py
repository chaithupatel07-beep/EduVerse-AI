"""
EduVerse AI - Communication Service
Handles institutional announcements, notification delivery/tracking, and parent-teacher communication requests.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import Announcement, Notification, CommunicationRequest
from app.models.user import User, UserRole
from app.schemas.communication import (
    AnnouncementCreate,
    CommunicationRequestCreate,
    CommunicationRequestRespond,
)


class CommunicationService:
    # ---------------- Announcement Operations ----------------
    async def create_announcement(
        self, db: AsyncSession, announcement_in: AnnouncementCreate, author: User
    ) -> Announcement:
        if author.role not in [UserRole.ADMIN, UserRole.TEACHER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only teachers and institution administrators can publish announcements.",
            )

        if not author.institution_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Author must belong to an institution.",
            )

        announcement = Announcement(
            institution_id=author.institution_id,
            author_id=author.id,
            title=announcement_in.title,
            content=announcement_in.content,
            target_role=announcement_in.target_role,
            priority=announcement_in.priority,
            is_published=announcement_in.is_published,
            attachment_url=announcement_in.attachment_url,
        )
        db.add(announcement)
        await db.commit()
        await db.refresh(announcement)
        return announcement

    async def list_announcements(
        self, db: AsyncSession, user: User, target_role: Optional[str] = None
    ) -> List[dict]:
        query = (
            select(Announcement, User)
            .join(User, Announcement.author_id == User.id)
            .where(Announcement.institution_id == user.institution_id)
            .where(Announcement.is_published == True)
        )

        if user.role != UserRole.ADMIN:
            # Filter by audience: 'all' or user's specific role
            query = query.where(
                or_(Announcement.target_role == "all", Announcement.target_role == user.role.value)
            )

        query = query.order_by(Announcement.created_at.desc())
        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": ann.id,
                "institution_id": ann.institution_id,
                "author_id": ann.author_id,
                "author_name": author.full_name,
                "title": ann.title,
                "content": ann.content,
                "target_role": ann.target_role,
                "priority": ann.priority,
                "is_published": ann.is_published,
                "attachment_url": ann.attachment_url,
                "created_at": ann.created_at,
                "updated_at": ann.updated_at,
            }
            for ann, author in rows
        ]

    # ---------------- Notification Operations ----------------
    async def create_notification(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "general",
        link_url: Optional[str] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link_url=link_url,
            is_read=False,
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return notif

    async def list_user_notifications(
        self, db: AsyncSession, user_id: str, unread_only: bool = False
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(Notification.created_at.desc()).limit(50)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def mark_notification_read(
        self, db: AsyncSession, notification_id: str, user_id: str
    ) -> Notification:
        res = await db.execute(
            select(Notification).where(
                and_(Notification.id == notification_id, Notification.user_id == user_id)
            )
        )
        notif = res.scalar_one_or_none()
        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

        notif.is_read = True
        await db.commit()
        await db.refresh(notif)
        return notif

    # ---------------- Communication Requests ----------------
    async def create_communication_request(
        self, db: AsyncSession, req_in: CommunicationRequestCreate, parent: User
    ) -> CommunicationRequest:
        if parent.role != UserRole.PARENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parents can initiate communication requests.",
            )

        # Verify teacher exists
        t_res = await db.execute(select(User).where(User.id == req_in.teacher_id))
        teacher = t_res.scalar_one_or_none()
        if not teacher or teacher.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specified recipient is not a valid teacher.",
            )

        req = CommunicationRequest(
            parent_id=parent.id,
            teacher_id=req_in.teacher_id,
            student_id=req_in.student_id,
            subject=req_in.subject,
            message=req_in.message,
            status="pending",
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)

        # Notify teacher
        await self.create_notification(
            db=db,
            user_id=teacher.id,
            title="New Parent Inquiry",
            message=f"Parent {parent.full_name} submitted inquiry: '{req_in.subject}'",
            notification_type="communication",
        )

        return req

    async def list_communication_requests(
        self, db: AsyncSession, user: User
    ) -> List[dict]:
        query = (
            select(CommunicationRequest)
            .options(
                selectinload(CommunicationRequest.parent),
                selectinload(CommunicationRequest.teacher),
                selectinload(CommunicationRequest.student),
            )
        )

        if user.role == UserRole.PARENT:
            query = query.where(CommunicationRequest.parent_id == user.id)
        elif user.role == UserRole.TEACHER:
            query = query.where(CommunicationRequest.teacher_id == user.id)

        query = query.order_by(CommunicationRequest.created_at.desc())
        result = await db.execute(query)
        requests = list(result.scalars().all())

        return [
            {
                "id": r.id,
                "parent_id": r.parent_id,
                "parent_name": r.parent.full_name if r.parent else None,
                "teacher_id": r.teacher_id,
                "teacher_name": r.teacher.full_name if r.teacher else None,
                "student_id": r.student_id,
                "student_name": r.student.full_name if r.student else None,
                "subject": r.subject,
                "message": r.message,
                "status": r.status,
                "response_notes": r.response_notes,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in requests
        ]

    async def respond_to_communication_request(
        self,
        db: AsyncSession,
        request_id: str,
        resp_in: CommunicationRequestRespond,
        teacher: User,
    ) -> CommunicationRequest:
        res = await db.execute(
            select(CommunicationRequest).where(
                and_(CommunicationRequest.id == request_id, CommunicationRequest.teacher_id == teacher.id)
            )
        )
        req = res.scalar_one_or_none()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Communication request not found or not assigned to you.",
            )

        req.status = resp_in.status
        req.response_notes = resp_in.response_notes
        await db.commit()
        await db.refresh(req)

        # Notify parent
        await self.create_notification(
            db=db,
            user_id=req.parent_id,
            title="Teacher Responded to Your Request",
            message=f"Teacher {teacher.full_name} updated status to '{resp_in.status}'",
            notification_type="communication",
        )

        return req


communication_service = CommunicationService()
