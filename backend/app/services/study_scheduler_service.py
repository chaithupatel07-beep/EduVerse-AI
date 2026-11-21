"""
EduVerse AI - AI Smart Timetable & Study Scheduler Service (Phase 6.5)
Features:
- Dynamic timetable generation personalized to student knowledge gaps & pending assignments
- Break-aware time allocation (45-min pomodoro blocks + revision sessions)
- Completion tracking with gamification XP rewards
- Automated rescheduling of missed study sessions
"""
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.innovation import (
    StudyTimetable,
    StudySessionEntry,
    GamificationProfile,
    PointTransaction,
)
from app.models.personalization import KnowledgeGap
from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.innovation import StudyTimetableGenerateRequest

logger = logging.getLogger("eduverse.scheduling")


class StudySchedulerService:
    async def generate_timetable(
        self,
        db: AsyncSession,
        student_id: str,
        institution_id: str,
        req: StudyTimetableGenerateRequest
    ) -> StudyTimetable:
        """
        Generates an intelligent, balanced weekly study schedule tailored to the student's gaps.
        """
        # Archive previous active timetables
        stmt_prev = select(StudyTimetable).where(
            and_(StudyTimetable.student_id == student_id, StudyTimetable.status == "active")
        )
        res_prev = await db.execute(stmt_prev)
        for t in res_prev.scalars().all():
            t.status = "archived"

        start_date = date.today()
        end_date = start_date + timedelta(days=req.days_ahead)

        # 1. Fetch unresolved knowledge gaps
        stmt_gaps = select(KnowledgeGap).where(
            and_(KnowledgeGap.student_id == student_id, KnowledgeGap.is_resolved == False)
        )
        res_gaps = await db.execute(stmt_gaps)
        gaps = res_gaps.scalars().all()

        gap_topics = [g.topic_name for g in gaps]
        if not gap_topics:
            gap_topics = ["Algebraic Foundations", "System Thermodynamics", "Algorithm Optimization"]

        timetable_id = str(uuid.uuid4())
        timetable = StudyTimetable(
            id=timetable_id,
            institution_id=institution_id,
            student_id=student_id,
            schedule_title=f"Personalized AI Study Schedule ({req.optimization_goal.replace('_', ' ').title()})",
            start_date=start_date,
            end_date=end_date,
            daily_available_hours=req.daily_available_hours,
            status="active",
            optimization_goal=req.optimization_goal,
            ai_generated_notes=(
                f"Schedule optimized for {req.daily_available_hours} hrs/day across {req.days_ahead} days. "
                f"Prioritizes identified focus topics: {', '.join(gap_topics[:2])}."
            ),
        )
        db.add(timetable)

        # 2. Generate daily study sessions (2-3 sessions per day)
        sessions_to_create: List[StudySessionEntry] = []
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        base_dt = datetime.now(timezone.utc).replace(hour=17, minute=0, second=0, microsecond=0)

        for d in range(req.days_ahead):
            curr_day = start_date + timedelta(days=d)
            curr_dow = days_of_week[curr_day.weekday()]

            # Session 1: Focus topic from knowledge gap
            target_topic = gap_topics[d % len(gap_topics)]
            s1_start = base_dt + timedelta(days=d)
            s1_end = s1_start + timedelta(minutes=45)

            session1 = StudySessionEntry(
                id=str(uuid.uuid4()),
                timetable_id=timetable_id,
                student_id=student_id,
                subject_name="Mathematics & Natural Sciences",
                topic_name=target_topic,
                session_type="revision",
                day_of_week=curr_dow,
                scheduled_start=s1_start,
                scheduled_end=s1_end,
                duration_minutes=45,
                priority="high",
                is_completed=False,
            )
            sessions_to_create.append(session1)

            # Session 2: Practice / Problem Solving
            s2_start = s1_end + timedelta(minutes=15)  # 15-min break
            s2_end = s2_start + timedelta(minutes=45)

            session2 = StudySessionEntry(
                id=str(uuid.uuid4()),
                timetable_id=timetable_id,
                student_id=student_id,
                subject_name="Computer Science & Engineering",
                topic_name=f"Practice Problem Set: {target_topic}",
                session_type="practice_quiz",
                day_of_week=curr_dow,
                scheduled_start=s2_start,
                scheduled_end=s2_end,
                duration_minutes=45,
                priority="medium",
                is_completed=False,
            )
            sessions_to_create.append(session2)

        for s in sessions_to_create:
            db.add(s)

        await db.commit()
        await db.refresh(timetable)
        return timetable

    async def get_active_timetable(self, db: AsyncSession, student_id: str) -> Optional[StudyTimetable]:
        """
        Retrieves the active study timetable with all scheduled sessions.
        """
        stmt = select(StudyTimetable).where(
            and_(StudyTimetable.student_id == student_id, StudyTimetable.status == "active")
        ).order_by(StudyTimetable.created_at.desc())
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def complete_session(self, db: AsyncSession, session_id: str, student_id: str) -> StudySessionEntry:
        """
        Marks study session completed and awards +15 XP points.
        """
        session = await db.get(StudySessionEntry, session_id)
        if not session or session.student_id != student_id:
            raise ValueError("Session not found or unauthorized.")

        session.is_completed = not session.is_completed
        session.completed_at = datetime.now(timezone.utc) if session.is_completed else None

        if session.is_completed:
            # Award Gamification XP points
            tt = await db.get(StudyTimetable, session.timetable_id)
            if tt:
                await self._award_gamification_xp(db, student_id, tt.institution_id, 15, "session_completed", session.id)

        await db.commit()
        await db.refresh(session)
        return session

    async def reschedule_missed(self, db: AsyncSession, timetable_id: str, student_id: str) -> int:
        """
        Finds past uncompleted sessions, marks them as rescheduled, and rolls them forward.
        """
        now = datetime.now(timezone.utc)
        stmt = select(StudySessionEntry).where(
            and_(
                StudySessionEntry.timetable_id == timetable_id,
                StudySessionEntry.student_id == student_id,
                StudySessionEntry.is_completed == False,
                StudySessionEntry.scheduled_end < now,
            )
        )
        res = await db.execute(stmt)
        missed = res.scalars().all()

        count = 0
        for s in missed:
            s.missed_and_rescheduled = True
            # Roll forward by 24 hours
            s.scheduled_start = s.scheduled_start + timedelta(days=1)
            s.scheduled_end = s.scheduled_end + timedelta(days=1)
            count += 1

        await db.commit()
        return count

    async def _award_gamification_xp(
        self,
        db: AsyncSession,
        user_id: str,
        institution_id: str,
        xp_amount: int,
        reason: str,
        ref_id: str
    ):
        stmt = select(GamificationProfile).where(GamificationProfile.user_id == user_id)
        res = await db.execute(stmt)
        prof = res.scalar_one_or_none()
        if not prof:
            prof = GamificationProfile(
                id=str(uuid.uuid4()),
                user_id=user_id,
                institution_id=institution_id,
                total_xp=100 + xp_amount,
                current_level=1,
            )
            db.add(prof)
        else:
            prof.total_xp += xp_amount
            prof.today_xp += xp_amount
            prof.current_level = max(1, prof.total_xp // 250 + 1)

        tx = PointTransaction(
            id=str(uuid.uuid4()),
            profile_id=prof.id,
            amount=xp_amount,
            reason=reason,
            reference_id=ref_id,
        )
        db.add(tx)


study_scheduler_service = StudySchedulerService()
