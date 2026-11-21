"""
EduVerse AI - Student Learning Profile Service (Phase 5)
Aggregates actual student database records (quizzes, assignments, attendance, topic mastery)
into an intelligent, updated learning profile without fabricating data.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.user import User
from app.models.academic import Subject, Course, ClassEnrollment
from app.models.quiz import Quiz, QuizAttempt
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.attendance import AttendanceRecord
from app.models.personalization import StudentLearningProfile, TopicMasteryRecord, KnowledgeGap

logger = logging.getLogger("eduverse.personalization.learning_profile")


class LearningProfileService:
    async def get_or_create_profile(
        self,
        db: AsyncSession,
        student_id: str,
    ) -> Dict[str, Any]:
        """
        Retrieves or dynamically recalculates a student's learning profile strictly using actual records.
        """
        stmt_user = select(User).where(User.id == student_id)
        res_user = await db.execute(stmt_user)
        student = res_user.scalar_one_or_none()
        if not student:
            return {"error": "Student not found"}

        # 1. Fetch or create record
        stmt_prof = select(StudentLearningProfile).where(StudentLearningProfile.student_id == student_id)
        res_prof = await db.execute(stmt_prof)
        profile = res_prof.scalars().first()

        # 2. Gather raw academic metrics
        # Quizzes
        stmt_q = (
            select(QuizAttempt)
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id, isouter=True)
            .where(QuizAttempt.student_id == student_id)
        )
        res_q = await db.execute(stmt_q)
        quizzes = res_q.scalars().all()
        quiz_avg = round(sum(q.percentage for q in quizzes) / len(quizzes), 1) if quizzes else 0.0

        # Assignments
        stmt_subs = (
            select(AssignmentSubmission)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id, isouter=True)
            .where(AssignmentSubmission.student_id == student_id)
        )
        res_subs = await db.execute(stmt_subs)
        subs = res_subs.scalars().all()
        evaluated_subs = [s for s in subs if s.marks_obtained is not None]
        if evaluated_subs:
            marks_pcts = []
            for s in evaluated_subs:
                if s.assignment and s.assignment.max_marks and s.assignment.max_marks > 0:
                    marks_pcts.append((s.marks_obtained / s.assignment.max_marks) * 100.0)
                else:
                    marks_pcts.append(s.marks_obtained)
            assignment_avg = round(sum(marks_pcts) / len(marks_pcts), 1)
        else:
            assignment_avg = 0.0

        # Attendance
        stmt_att = select(AttendanceRecord).where(AttendanceRecord.student_id == student_id)
        res_att = await db.execute(stmt_att)
        atts = res_att.scalars().all()
        present = sum(1 for a in atts if a.status in ("present", "late"))
        att_rate = round(present / len(atts) * 100.0, 1) if atts else 0.0

        # Overall GPA calculation (4.0 scale) based on actual available data
        has_any_data = bool(quizzes or evaluated_subs or atts)
        if has_any_data:
            components = []
            if quizzes:
                components.append((quiz_avg, 0.45))
            if evaluated_subs:
                components.append((assignment_avg, 0.45))
            if atts:
                components.append((att_rate, 0.10))

            weight_sum = sum(w for _, w in components)
            composite_score = sum(val * (w / weight_sum) for val, w in components)
            overall_gpa = round(composite_score / 25.0, 2)  # Scale to 4.0
        else:
            overall_gpa = 0.0

        # Topic mastery records
        stmt_tm = select(TopicMasteryRecord).where(TopicMasteryRecord.student_id == student_id)
        res_tm = await db.execute(stmt_tm)
        tms = res_tm.scalars().all()

        strengths = [tm.topic_name for tm in tms if tm.mastery_level == "advanced"]
        weaknesses = [tm.topic_name for tm in tms if tm.mastery_level == "beginner"]

        # Subject-wise breakdown from actual quiz attempts
        subject_perf: Dict[str, Any] = {}
        for q in quizzes:
            if q.quiz and q.quiz.subject:
                s_name = q.quiz.subject.title
                if s_name not in subject_perf:
                    subject_perf[s_name] = {"scores": [], "status": "in_progress"}
                subject_perf[s_name]["scores"].append(q.percentage)

        for s_name, data in subject_perf.items():
            avg_s = round(sum(data["scores"]) / len(data["scores"]), 1)
            data["score"] = avg_s
            data["status"] = "proficient" if avg_s >= 75.0 else "remedial_required"
            del data["scores"]

        # Goals & Focus areas
        goals = [
            {"goal": "Complete active subject quizzes", "progress_pct": min(100, len(quizzes) * 25), "target_date": "2026-12-15"},
        ]
        focus_areas = weaknesses if weaknesses else (["Review syllabus topics"] if not has_any_data else [])

        # Determine learning pace
        if not has_any_data:
            pace = "uncalibrated"
        elif quiz_avg >= 85 and att_rate >= 90:
            pace = "accelerated"
        elif quiz_avg >= 70:
            pace = "moderate"
        else:
            pace = "guided"

        institution_id = student.institution_id or "inst-default"

        if not profile:
            profile = StudentLearningProfile(
                student_id=student_id,
                institution_id=institution_id,
                overall_gpa=overall_gpa,
                quiz_average=quiz_avg,
                assignment_average=assignment_avg,
                attendance_rate=att_rate,
                quizzes_completed=len(quizzes),
                assignments_completed=len(subs),
                learning_streak_days=1 if has_any_data else 0,
                learning_pace=pace,
                subject_performance_json=subject_perf,
                learning_goals_json=goals,
                recommended_focus_areas=focus_areas,
                last_analyzed_at=datetime.now(timezone.utc),
            )
            db.add(profile)
        else:
            profile.overall_gpa = overall_gpa
            profile.quiz_average = quiz_avg
            profile.assignment_average = assignment_avg
            profile.attendance_rate = att_rate
            profile.quizzes_completed = len(quizzes)
            profile.assignments_completed = len(subs)
            profile.learning_pace = pace
            profile.subject_performance_json = subject_perf
            profile.learning_goals_json = goals
            profile.recommended_focus_areas = focus_areas
            profile.last_analyzed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(profile)

        return {
            "student_id": student_id,
            "student_name": student.full_name,
            "overall_gpa": profile.overall_gpa,
            "quiz_average": profile.quiz_average,
            "assignment_average": profile.assignment_average,
            "attendance_rate": profile.attendance_rate,
            "quizzes_completed": profile.quizzes_completed,
            "assignments_completed": profile.assignments_completed,
            "learning_streak_days": profile.learning_streak_days,
            "learning_pace": profile.learning_pace,
            "subject_performance": profile.subject_performance_json,
            "topic_strengths": strengths,
            "topic_weaknesses": weaknesses,
            "learning_goals": profile.learning_goals_json,
            "recommended_focus_areas": profile.recommended_focus_areas,
            "last_analyzed_at": profile.last_analyzed_at.isoformat(),
        }


learning_profile_service = LearningProfileService()
