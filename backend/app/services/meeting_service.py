"""
EduVerse AI - Parent–Teacher Meeting Service (Phase 6)
Manages consultation requests, scheduling, video conferencing links,
and status transitions between parents and teachers.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.user import User, UserRole, ParentStudentLink
from app.models.intelligence import MeetingRequest

logger = logging.getLogger("eduverse.services.meeting")


class MeetingService:
    async def request_meeting(
        self,
        db: AsyncSession,
        parent: User,
        teacher_id: str,
        student_id: str,
        requested_date: str,
        preferred_time_slot: str,
        subject: str,
        reason: str,
        meeting_type: str = "in_person",
    ) -> Dict[str, Any]:
        """
        Creates a new meeting request from a verified parent to an assigned educator.
        """
        # Verify parent-student authorization
        stmt_link = select(ParentStudentLink).where(
            and_(
                ParentStudentLink.parent_id == parent.id,
                ParentStudentLink.student_id == student_id,
            )
        )
        res_link = await db.execute(stmt_link)
        link = res_link.scalars().first()
        if not link and parent.role != UserRole.ADMIN:
            return {"error": "Unauthorized: Student is not linked to this parent"}

        # Verify teacher exists
        stmt_teacher = select(User).where(User.id == teacher_id)
        res_t = await db.execute(stmt_teacher)
        teacher = res_t.scalar_one_or_none()
        if not teacher:
            return {"error": "Teacher not found"}

        institution_id = parent.institution_id or teacher.institution_id or "inst-default"

        meeting = MeetingRequest(
            parent_id=parent.id,
            teacher_id=teacher_id,
            student_id=student_id,
            institution_id=institution_id,
            requested_date=requested_date,
            preferred_time_slot=preferred_time_slot,
            subject=subject,
            reason=reason,
            meeting_type=meeting_type,
            status="requested",
        )
        db.add(meeting)
        await db.commit()
        await db.refresh(meeting)

        return self._format_meeting(meeting)

    async def list_meetings_for_user(
        self,
        db: AsyncSession,
        user: User,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Lists meetings relevant to the user (as parent or as teacher).
        """
        if user.role == UserRole.PARENT:
            clause = (MeetingRequest.parent_id == user.id)
        elif user.role == UserRole.TEACHER:
            clause = (MeetingRequest.teacher_id == user.id)
        else:
            clause = (MeetingRequest.institution_id == (user.institution_id or "inst-default"))

        stmt = select(MeetingRequest).where(clause)
        if status:
            stmt = stmt.where(MeetingRequest.status == status)
        stmt = stmt.order_by(MeetingRequest.created_at.desc())

        res = await db.execute(stmt)
        meetings = res.scalars().all()
        return [self._format_meeting(m) for m in meetings]

    async def update_meeting_status(
        self,
        db: AsyncSession,
        user: User,
        meeting_id: str,
        status: str,
        teacher_notes: Optional[str] = None,
        meeting_link: Optional[str] = None,
        new_date: Optional[str] = None,
        new_time_slot: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Teacher or Admin confirms, reschedules, completes, or cancels a meeting.
        """
        stmt = select(MeetingRequest).where(MeetingRequest.id == meeting_id)
        res = await db.execute(stmt)
        meeting = res.scalar_one_or_none()
        if not meeting:
            return {"error": "Meeting request not found"}

        # Authorization: teacher must be assigned, or parent cancelling, or admin
        if user.id != meeting.teacher_id and user.id != meeting.parent_id and user.role != UserRole.ADMIN:
            return {"error": "Unauthorized to update this meeting request"}

        meeting.status = status
        if teacher_notes:
            meeting.teacher_notes = teacher_notes
        if meeting_link:
            meeting.meeting_link = meeting_link
        if new_date:
            meeting.requested_date = new_date
        if new_time_slot:
            meeting.preferred_time_slot = new_time_slot

        await db.commit()
        await db.refresh(meeting)
        return self._format_meeting(meeting)

    def _format_meeting(self, m: MeetingRequest) -> Dict[str, Any]:
        return {
            "id": m.id,
            "parent_id": m.parent_id,
            "parent_name": m.parent.full_name if m.parent else "Parent",
            "teacher_id": m.teacher_id,
            "teacher_name": m.teacher.full_name if m.teacher else "Teacher",
            "student_id": m.student_id,
            "student_name": m.student.full_name if m.student else "Student",
            "institution_id": m.institution_id,
            "requested_date": m.requested_date,
            "preferred_time_slot": m.preferred_time_slot,
            "subject": m.subject,
            "reason": m.reason,
            "meeting_type": m.meeting_type,
            "status": m.status,
            "teacher_notes": m.teacher_notes,
            "meeting_link": m.meeting_link,
            "created_at": m.created_at.isoformat(),
            "updated_at": m.updated_at.isoformat(),
        }


meeting_service = MeetingService()
