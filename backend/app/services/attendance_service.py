"""
EduVerse AI - Attendance Management Service
Handles attendance sessions, batch marking for classrooms, duplicate prevention,
student attendance summaries, and audit logging.
"""
from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from app.models.academic import ClassRoom, ClassEnrollment, Subject
from app.models.user import User, UserRole
from app.models.profiles import StudentProfile
from app.schemas.attendance import AttendanceSessionCreate, AttendanceRecordUpdate


class AttendanceService:
    async def create_or_update_session(
        self, db: AsyncSession, session_in: AttendanceSessionCreate, teacher: User
    ) -> AttendanceSession:
        class_res = await db.execute(select(ClassRoom).where(ClassRoom.id == session_in.class_id))
        classroom = class_res.scalar_one_or_none()
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )

        if teacher.role != UserRole.ADMIN and classroom.institution_id != teacher.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot manage attendance for classroom outside your institution.",
            )

        # Check existing session for (class_id, session_date, subject_id)
        existing = await db.execute(
            select(AttendanceSession).where(
                and_(
                    AttendanceSession.class_id == session_in.class_id,
                    AttendanceSession.session_date == session_in.session_date,
                    AttendanceSession.subject_id == session_in.subject_id,
                )
            )
        )
        session = existing.scalar_one_or_none()

        if not session:
            session = AttendanceSession(
                institution_id=classroom.institution_id,
                class_id=session_in.class_id,
                subject_id=session_in.subject_id,
                teacher_id=teacher.id,
                session_date=session_in.session_date,
                session_title=session_in.session_title,
                session_notes=session_in.session_notes,
            )
            db.add(session)
            await db.flush()
        else:
            session.session_title = session_in.session_title
            session.session_notes = session_in.session_notes

        # Process record entries
        for rec in session_in.records:
            # Check existing record for session and student
            rec_existing = await db.execute(
                select(AttendanceRecord).where(
                    and_(
                        AttendanceRecord.session_id == session.id,
                        AttendanceRecord.student_id == rec.student_id,
                    )
                )
            )
            record = rec_existing.scalar_one_or_none()
            if record:
                if record.status != rec.status:
                    # Log audit
                    audit = AttendanceAuditLog(
                        record_id=record.id,
                        changed_by=teacher.id,
                        old_status=record.status,
                        new_status=rec.status,
                        reason="Updated via batch attendance session",
                    )
                    db.add(audit)
                    record.status = rec.status
                    record.remarks = rec.remarks
            else:
                new_record = AttendanceRecord(
                    session_id=session.id,
                    student_id=rec.student_id,
                    status=rec.status,
                    remarks=rec.remarks,
                )
                db.add(new_record)

        await db.commit()
        await db.refresh(session)
        return session

    async def list_class_sessions(
        self, db: AsyncSession, class_id: str
    ) -> List[dict]:
        query = (
            select(AttendanceSession, ClassRoom, Subject, User)
            .join(ClassRoom, AttendanceSession.class_id == ClassRoom.id)
            .outerjoin(Subject, AttendanceSession.subject_id == Subject.id)
            .join(User, AttendanceSession.teacher_id == User.id)
            .where(AttendanceSession.class_id == class_id)
            .order_by(AttendanceSession.session_date.desc())
        )
        result = await db.execute(query)
        rows = result.all()

        sessions_list = []
        for sess, cl, subj, usr in rows:
            # Counts
            total_records_res = await db.execute(
                select(func.count(AttendanceRecord.id)).where(AttendanceRecord.session_id == sess.id)
            )
            total_recs = total_records_res.scalar() or 0

            present_res = await db.execute(
                select(func.count(AttendanceRecord.id)).where(
                    and_(AttendanceRecord.session_id == sess.id, AttendanceRecord.status == "present")
                )
            )
            present_count = present_res.scalar() or 0

            absent_res = await db.execute(
                select(func.count(AttendanceRecord.id)).where(
                    and_(AttendanceRecord.session_id == sess.id, AttendanceRecord.status == "absent")
                )
            )
            absent_count = absent_res.scalar() or 0

            sessions_list.append(
                {
                    "id": sess.id,
                    "institution_id": sess.institution_id,
                    "class_id": sess.class_id,
                    "class_name": cl.name,
                    "subject_id": sess.subject_id,
                    "subject_title": subj.title if subj else None,
                    "teacher_id": sess.teacher_id,
                    "teacher_name": usr.full_name,
                    "session_date": sess.session_date,
                    "session_title": sess.session_title,
                    "session_notes": sess.session_notes,
                    "total_records": total_recs,
                    "present_count": present_count,
                    "absent_count": absent_count,
                    "created_at": sess.created_at,
                }
            )
        return sessions_list

    async def get_session_details(self, db: AsyncSession, session_id: str) -> dict:
        query = (
            select(AttendanceSession)
            .options(
                selectinload(AttendanceSession.classroom),
                selectinload(AttendanceSession.subject),
                selectinload(AttendanceSession.teacher),
                selectinload(AttendanceSession.records).selectinload(AttendanceRecord.student),
            )
            .where(AttendanceSession.id == session_id)
        )
        result = await db.execute(query)
        sess = result.scalar_one_or_none()
        if not sess:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance session not found.",
            )

        records_data = []
        present_count = 0
        absent_count = 0
        for r in sess.records:
            if r.status == "present":
                present_count += 1
            elif r.status == "absent":
                absent_count += 1

            records_data.append(
                {
                    "id": r.id,
                    "student_id": r.student_id,
                    "student_name": r.student.full_name if r.student else None,
                    "student_email": r.student.email if r.student else None,
                    "status": r.status,
                    "remarks": r.remarks,
                    "recorded_at": r.recorded_at,
                }
            )

        return {
            "id": sess.id,
            "institution_id": sess.institution_id,
            "class_id": sess.class_id,
            "class_name": sess.classroom.name if sess.classroom else None,
            "subject_id": sess.subject_id,
            "subject_title": sess.subject.title if sess.subject else None,
            "teacher_id": sess.teacher_id,
            "teacher_name": sess.teacher.full_name if sess.teacher else None,
            "session_date": sess.session_date,
            "session_title": sess.session_title,
            "session_notes": sess.session_notes,
            "total_records": len(sess.records),
            "present_count": present_count,
            "absent_count": absent_count,
            "records": records_data,
            "created_at": sess.created_at,
        }

    async def get_student_attendance_summary(
        self, db: AsyncSession, student_id: str
    ) -> dict:
        user_res = await db.execute(select(User).where(User.id == student_id))
        student = user_res.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

        query = (
            select(AttendanceRecord, AttendanceSession)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .where(AttendanceRecord.student_id == student_id)
            .order_by(AttendanceSession.session_date.desc())
        )
        result = await db.execute(query)
        rows = result.all()

        total = len(rows)
        present = sum(1 for r, _ in rows if r.status == "present")
        absent = sum(1 for r, _ in rows if r.status == "absent")
        late = sum(1 for r, _ in rows if r.status == "late")
        excused = sum(1 for r, _ in rows if r.status == "excused")

        rate = round(((present + (0.5 * late)) / total) * 100, 1) if total > 0 else 100.0

        records_data = [
            {
                "id": r.id,
                "student_id": r.student_id,
                "student_name": student.full_name,
                "status": r.status,
                "remarks": r.remarks,
                "session_date": sess.session_date,
                "session_title": sess.session_title,
                "recorded_at": r.recorded_at,
            }
            for r, sess in rows
        ]

        return {
            "student_id": student.id,
            "student_name": student.full_name,
            "total_sessions": total,
            "present_count": present,
            "absent_count": absent,
            "late_count": late,
            "excused_count": excused,
            "attendance_percentage": rate,
            "records": records_data,
        }


attendance_service = AttendanceService()
