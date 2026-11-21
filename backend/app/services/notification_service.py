"""
EduVerse AI - Notification & Preference Service (Phase 6)
Manages in-app notifications, read/unread states, badges, and user notification preferences.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.user import User
from app.models.communication import Notification
from app.models.intelligence import NotificationPreference

logger = logging.getLogger("eduverse.services.notification")


class NotificationService:
    async def create_notification(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "general",
        link_url: Optional[str] = None,
    ) -> Notification:
        """
        Dispatches an in-app notification to the specified recipient.
        """
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

    async def get_user_notifications(
        self,
        db: AsyncSession,
        user_id: str,
        unread_only: bool = False,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves user notifications sorted chronologically.
        """
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)

        res = await db.execute(stmt)
        notifs = res.scalars().all()
        return [
            {
                "id": n.id,
                "user_id": n.user_id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "link_url": n.link_url,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifs
        ]

    async def get_unread_count(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> int:
        """
        Returns number of unread notifications for badge counters.
        """
        stmt = (
            select(func.count(Notification.id))
            .where(and_(Notification.user_id == user_id, Notification.is_read == False))
        )
        res = await db.execute(stmt)
        return res.scalar() or 0

    async def mark_as_read(
        self,
        db: AsyncSession,
        notification_id: str,
        user_id: str,
    ) -> bool:
        stmt = select(Notification).where(
            and_(Notification.id == notification_id, Notification.user_id == user_id)
        )
        res = await db.execute(stmt)
        notif = res.scalar_one_or_none()
        if notif:
            notif.is_read = True
            await db.commit()
            return True
        return False

    async def mark_all_as_read(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> int:
        stmt = select(Notification).where(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        )
        res = await db.execute(stmt)
        notifs = res.scalars().all()
        count = len(notifs)
        for n in notifs:
            n.is_read = True
        await db.commit()
        return count

    async def get_or_create_preferences(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> Dict[str, Any]:
        stmt = select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        res = await db.execute(stmt)
        pref = res.scalars().first()
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                email_alerts=True,
                assignment_updates=True,
                quiz_reminders=True,
                academic_alerts=True,
                communication_messages=True,
                preferred_language="en",
            )
            db.add(pref)
            await db.commit()
            await db.refresh(pref)

        return {
            "id": pref.id,
            "user_id": pref.user_id,
            "email_alerts": pref.email_alerts,
            "assignment_updates": pref.assignment_updates,
            "quiz_reminders": pref.quiz_reminders,
            "academic_alerts": pref.academic_alerts,
            "communication_messages": pref.communication_messages,
            "preferred_language": pref.preferred_language,
            "updated_at": pref.updated_at.isoformat(),
        }

    async def update_preferences(
        self,
        db: AsyncSession,
        user_id: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        stmt = select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        res = await db.execute(stmt)
        pref = res.scalars().first()
        if not pref:
            pref = NotificationPreference(user_id=user_id)
            db.add(pref)

        for key, val in updates.items():
            if hasattr(pref, key) and val is not None:
                setattr(pref, key, val)

        await db.commit()
        await db.refresh(pref)
        return {
            "id": pref.id,
            "user_id": pref.user_id,
            "email_alerts": pref.email_alerts,
            "assignment_updates": pref.assignment_updates,
            "quiz_reminders": pref.quiz_reminders,
            "academic_alerts": pref.academic_alerts,
            "communication_messages": pref.communication_messages,
            "preferred_language": pref.preferred_language,
            "updated_at": pref.updated_at.isoformat(),
        }


notification_service = NotificationService()
