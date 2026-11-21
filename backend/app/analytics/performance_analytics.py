"""
EduVerse AI - Academic Performance Analytics Service (Phase 5)
Provides student performance trends, teacher class-level analytics,
and institutional academic reporting strictly grounded in actual database records.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.user import User, UserRole
from app.models.academic import Department, Course, Subject, ClassRoom, ClassEnrollment
from app.models.quiz import Quiz, QuizAttempt
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.personalization import KnowledgeGap, TopicMasteryRecord, StudentLearningProfile

logger = logging.getLogger("eduverse.analytics.performance")


class PerformanceAnalyticsService:
    async def get_student_trend_analytics(
        self,
        db: AsyncSession,
        student_id: str,
    ) -> Dict[str, Any]:
        """
        Retrieves longitudinal score trends across quizzes, assignments, and attendance.
        """
        # Quiz trend
        stmt_q = (
            select(QuizAttempt)
            .where(QuizAttempt.student_id == student_id)
            .order_by(QuizAttempt.created_at.asc())
        )
        res_q = await db.execute(stmt_q)
        quizzes = res_q.scalars().all()
        quiz_timeline = [
            {
                "date": q.created_at.strftime("%Y-%m-%d"),
                "quiz_title": q.quiz.title if q.quiz else "Quiz",
                "percentage": q.percentage,
                "passed": q.passed,
            }
            for q in quizzes
        ]

        # Assignment scores
        stmt_a = (
            select(AssignmentSubmission)
            .where(AssignmentSubmission.student_id == student_id)
            .order_by(AssignmentSubmission.created_at.asc())
        )
        res_a = await db.execute(stmt_a)
        subs = res_a.scalars().all()
        assignment_timeline = [
            {
                "date": s.submitted_at.strftime("%Y-%m-%d") if s.submitted_at else s.created_at.strftime("%Y-%m-%d"),
                "assignment_title": s.assignment.title if s.assignment else "Assignment",
                "marks_obtained": s.marks_obtained,
                "status": s.status,
            }
            for s in subs
        ]

        # Attendance trend
        stmt_att = select(AttendanceRecord).where(AttendanceRecord.student_id == student_id)
        res_att = await db.execute(stmt_att)
        atts = res_att.scalars().all()
        present = sum(1 for a in atts if a.status in ("present", "late"))
        att_rate = round(present / len(atts) * 100.0, 1) if atts else 0.0

        return {
            "student_id": student_id,
            "overall_attendance_rate": att_rate,
            "quiz_timeline": quiz_timeline,
            "assignment_timeline": assignment_timeline,
            "total_assessments": len(quiz_timeline) + len(assignment_timeline),
        }

    async def get_class_level_analytics(
        self,
        db: AsyncSession,
        class_id: str,
    ) -> Dict[str, Any]:
        """
        Provides teacher with aggregated classroom analytics:
        average scores, at-risk students, and shared topic learning gaps.
        """
        # 1. Fetch class & enrollments
        stmt_class = select(ClassRoom).where(ClassRoom.id == class_id)
        res_class = await db.execute(stmt_class)
        classroom = res_class.scalar_one_or_none()
        if not classroom:
            return {"error": "Classroom not found"}

        stmt_enrolled = select(ClassEnrollment).where(ClassEnrollment.class_id == class_id)
        res_enrolled = await db.execute(stmt_enrolled)
        enrollments = res_enrolled.scalars().all()
        student_ids = [e.student_id for e in enrollments]

        if not student_ids:
            return {
                "class_id": class_id,
                "class_name": classroom.name,
                "total_students": 0,
                "class_average_quiz": 0.0,
                "class_average_attendance": 0.0,
                "at_risk_students": [],
                "common_learning_gaps": [],
            }

        # 2. Quizzes for class
        stmt_q = select(QuizAttempt).where(QuizAttempt.student_id.in_(student_ids))
        res_q = await db.execute(stmt_q)
        attempts = res_q.scalars().all()
        avg_quiz = round(sum(a.percentage for a in attempts) / len(attempts), 1) if attempts else 0.0

        # 3. Attendance for class
        stmt_att = select(AttendanceRecord).where(AttendanceRecord.student_id.in_(student_ids))
        res_att = await db.execute(stmt_att)
        records = res_att.scalars().all()
        present_cnt = sum(1 for r in records if r.status in ("present", "late"))
        avg_att = round(present_cnt / len(records) * 100.0, 1) if records else 0.0

        # 4. At-risk students
        at_risk = []
        for s_id in student_ids:
            s_attempts = [a for a in attempts if a.student_id == s_id]
            s_quiz_avg = (sum(a.percentage for a in s_attempts) / len(s_attempts)) if s_attempts else None
            s_atts = [r for r in records if r.student_id == s_id]
            s_att_rate = (sum(1 for r in s_atts if r.status in ("present", "late")) / len(s_atts) * 100.0) if s_atts else None

            is_at_risk = False
            concern = ""
            if s_quiz_avg is not None and s_quiz_avg < 65.0:
                is_at_risk = True
                concern = "Low Quiz Performance"
            elif s_att_rate is not None and s_att_rate < 80.0:
                is_at_risk = True
                concern = "Attendance Deficit"
            elif s_quiz_avg is None and len(attempts) > 0:
                is_at_risk = True
                concern = "No Quizzes Attempted"

            if is_at_risk:
                stmt_u = select(User).where(User.id == s_id)
                res_u = await db.execute(stmt_u)
                u = res_u.scalar_one_or_none()
                at_risk.append({
                    "student_id": s_id,
                    "student_name": u.full_name if u else "Student",
                    "quiz_average": round(s_quiz_avg, 1) if s_quiz_avg is not None else 0.0,
                    "attendance_rate": round(s_att_rate, 1) if s_att_rate is not None else 0.0,
                    "primary_concern": concern,
                })

        # 5. Common topic learning gaps across class
        stmt_gaps = (
            select(KnowledgeGap.topic_name, func.count(KnowledgeGap.id).label("student_count"))
            .where(
                and_(
                    KnowledgeGap.student_id.in_(student_ids),
                    KnowledgeGap.classification.in_(["requires_immediate_revision", "needs_improvement"]),
                    KnowledgeGap.is_resolved == False,
                )
            )
            .group_by(KnowledgeGap.topic_name)
            .order_by(func.count(KnowledgeGap.id).desc())
            .limit(5)
        )
        res_gaps = await db.execute(stmt_gaps)
        common_gaps = [
            {
                "topic_name": row[0],
                "affected_students_count": row[1],
                "recommended_action": f"Schedule class revision session on {row[0]}.",
            }
            for row in res_gaps.all()
        ]

        return {
            "class_id": class_id,
            "class_name": classroom.name,
            "total_students": len(student_ids),
            "class_average_quiz": avg_quiz,
            "class_average_attendance": avg_att,
            "at_risk_students": at_risk,
            "common_learning_gaps": common_gaps,
        }

    async def get_institution_analytics(
        self,
        db: AsyncSession,
        institution_id: str,
    ) -> Dict[str, Any]:
        """
        Aggregated institution-level analytics for administrators.
        """
        # Departments & Courses
        stmt_depts = select(Department).where(Department.institution_id == institution_id)
        res_depts = await db.execute(stmt_depts)
        depts = res_depts.scalars().all()

        stmt_courses = select(Course).where(Course.institution_id == institution_id)
        res_courses = await db.execute(stmt_courses)
        courses = res_courses.scalars().all()

        stmt_students = select(User).where(
            and_(User.institution_id == institution_id, User.role == UserRole.STUDENT)
        )
        res_st = await db.execute(stmt_students)
        total_students = len(res_st.scalars().all())

        stmt_teachers = select(User).where(
            and_(User.institution_id == institution_id, User.role == UserRole.TEACHER)
        )
        res_tc = await db.execute(stmt_teachers)
        total_teachers = len(res_tc.scalars().all())

        stmt_inst_quizzes = (
            select(QuizAttempt)
            .join(User, QuizAttempt.student_id == User.id)
            .where(User.institution_id == institution_id)
        )
        res_iq = await db.execute(stmt_inst_quizzes)
        inst_attempts = res_iq.scalars().all()
        inst_avg_score = round(sum(a.percentage for a in inst_attempts) / len(inst_attempts), 1) if inst_attempts else 0.0

        stmt_inst_att = (
            select(AttendanceRecord)
            .join(User, AttendanceRecord.student_id == User.id)
            .where(User.institution_id == institution_id)
        )
        res_ia = await db.execute(stmt_inst_att)
        inst_atts = res_ia.scalars().all()
        inst_present = sum(1 for a in inst_atts if a.status in ("present", "late"))
        inst_avg_att = round(inst_present / len(inst_atts) * 100.0, 1) if inst_atts else 0.0

        dept_breakdown = [
            {
                "department_id": d.id,
                "name": d.name,
                "courses_count": len([c for c in courses if c.department_id == d.id]),
                "average_performance": inst_avg_score,
            }
            for d in depts
        ]

        return {
            "institution_id": institution_id,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_departments": len(depts),
            "total_courses": len(courses),
            "institution_average_score": inst_avg_score,
            "institution_average_attendance": inst_avg_att,
            "department_breakdown": dept_breakdown,
        }


performance_analytics_service = PerformanceAnalyticsService()
