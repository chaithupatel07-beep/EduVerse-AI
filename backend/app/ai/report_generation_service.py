"""
EduVerse AI - AI Report Generation Service (Phase 6)
Generates verified, non-hallucinatory academic reports for:
  - Parents (Weekly/Monthly progress summaries & support suggestions in EN, TE, HI)
  - Institution Administrators (Campus-wide academic benchmarks & departmental breakdowns)
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.user import User, UserRole
from app.models.academic import Department, Course, Subject, ClassRoom, ClassEnrollment
from app.models.quiz import QuizAttempt
from app.models.assignment import AssignmentSubmission
from app.models.attendance import AttendanceRecord
from app.models.personalization import KnowledgeGap, TopicMasteryRecord, StudentLearningProfile
from app.models.intelligence import ParentProgressReport, InstitutionalReport
from app.models.communication import CommunicationThread
from app.ai.gemini_service import gemini_service

logger = logging.getLogger("eduverse.ai.reports")


class ReportGenerationService:
    async def generate_parent_progress_report(
        self,
        db: AsyncSession,
        student_id: str,
        parent: Optional[User] = None,
        report_type: str = "weekly_summary",
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Pulls actual academic telemetry and generates a respectful, parent-friendly progress report.
        """
        stmt_user = select(User).where(User.id == student_id)
        res_user = await db.execute(stmt_user)
        student = res_user.scalar_one_or_none()
        if not student:
            return {"error": "Student not found"}

        # 1. Gather actual academic records
        # Quizzes
        stmt_q = select(QuizAttempt).where(QuizAttempt.student_id == student_id)
        res_q = await db.execute(stmt_q)
        quizzes = res_q.scalars().all()
        quizzes_count = len(quizzes)
        quiz_avg = round(sum(q.percentage for q in quizzes) / quizzes_count, 1) if quizzes_count > 0 else 0.0

        # Assignments
        stmt_subs = select(AssignmentSubmission).where(AssignmentSubmission.student_id == student_id)
        res_subs = await db.execute(stmt_subs)
        subs = res_subs.scalars().all()
        eval_subs = [s for s in subs if s.marks_obtained is not None]
        assign_count = len(subs)

        # Attendance
        stmt_att = select(AttendanceRecord).where(AttendanceRecord.student_id == student_id)
        res_att = await db.execute(stmt_att)
        atts = res_att.scalars().all()
        total_sessions = len(atts)
        present = sum(1 for a in atts if a.status in ("present", "late"))
        att_rate = round(present / total_sessions * 100.0, 1) if total_sessions > 0 else 0.0

        # Knowledge gaps & Strengths
        stmt_gaps = select(KnowledgeGap).where(
            and_(
                KnowledgeGap.student_id == student_id,
                KnowledgeGap.classification.in_(["requires_immediate_revision", "needs_improvement"]),
                KnowledgeGap.is_resolved == False,
            )
        )
        res_gaps = await db.execute(stmt_gaps)
        gaps = res_gaps.scalars().all()
        gaps_list = [g.topic_name for g in gaps]

        stmt_tms = select(TopicMasteryRecord).where(TopicMasteryRecord.student_id == student_id)
        res_tms = await db.execute(stmt_tms)
        tms = res_tms.scalars().all()
        strengths_list = [tm.topic_name for tm in tms if tm.mastery_level == "advanced"]

        metrics_snapshot = {
            "attendance_rate": att_rate,
            "quiz_average": quiz_avg,
            "quizzes_completed": quizzes_count,
            "assignments_submitted": assign_count,
            "evaluated_assignments": len(eval_subs),
            "active_knowledge_gaps": len(gaps_list),
            "data_grounded": True,
        }

        # 2. Formulate report content in target language
        summary_text, parent_recs = self._synthesize_parent_report_text(
            student_name=student.full_name,
            att_rate=att_rate,
            quiz_avg=quiz_avg,
            quizzes_count=quizzes_count,
            assign_count=assign_count,
            strengths=strengths_list,
            gaps=gaps_list,
            language=language,
        )

        institution_id = student.institution_id or "inst-default"
        now = datetime.now(timezone.utc)
        report = ParentProgressReport(
            student_id=student_id,
            parent_id=parent.id if parent else None,
            institution_id=institution_id,
            report_type=report_type,
            reporting_period_start=now - timedelta(days=7 if report_type == "weekly_summary" else 30),
            reporting_period_end=now,
            language=language,
            summary_text=summary_text,
            strengths_json=strengths_list or ["Regular curriculum engagement"],
            improvements_needed_json=gaps_list or ["Continue maintaining standard revision pace"],
            parental_support_recommendations=parent_recs,
            metrics_snapshot_json=metrics_snapshot,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        return {
            "id": report.id,
            "student_id": report.student_id,
            "student_name": student.full_name,
            "report_type": report.report_type,
            "language": report.language,
            "summary_text": report.summary_text,
            "strengths": report.strengths_json,
            "improvements_needed": report.improvements_needed_json,
            "parental_support_recommendations": report.parental_support_recommendations,
            "metrics_snapshot": report.metrics_snapshot_json,
            "created_at": report.created_at.isoformat(),
        }

    def _synthesize_parent_report_text(
        self,
        student_name: str,
        att_rate: float,
        quiz_avg: float,
        quizzes_count: int,
        assign_count: int,
        strengths: List[str],
        gaps: List[str],
        language: str,
    ) -> tuple[str, List[str]]:
        if language == "te":
            summary = (
                f"గౌరవనీయ తల్లిదండ్రులకు, మీ బిడ్డ {student_name} విద్యా పురోగతి సమీక్ష:\n"
                f"• ప్రస్తుత తరగతి హాజరు శాతం: {att_rate}%.\n"
                f"• పూర్తి చేసిన క్విజ్‌లు: {quizzes_count} (సగటు మార్కులు: {quiz_avg}%).\n"
                f"• సమర్పించిన అసైన్‌మెంట్లు: {assign_count}.\n"
            )
            if gaps:
                summary += f"ప్రత్యేక శ్రద్ధ అవసరమైన అంశాలు: {', '.join(gaps[:3])}."
            else:
                summary += "ప్రస్తుతానికి అన్ని అసెస్ చేయబడిన అంశాలలో మీ బిడ్డ మంచి పురోగతి కనబరుస్తున్నారు."

            recs = [
                f"రోజూ 30 నిమిషాలు కేటాయించి {', '.join(gaps[:2]) if gaps else 'తరగతి పాఠాలను'} పునశ్చరణ చేయమని ప్రోత్సహించండి.",
                "రాబోయే అసైన్‌మెంట్‌లను చివరి గడువుకు ముందే పూర్తి చేసేలా తోడ్పడండి.",
                "సందేహాలు ఉంటే టీచర్‌తో చర్చించడానికి యాప్‌లోని మీటింగ్ రిక్వెస్ట్ లేదా మెసేజ్ ఫీచర్‌ను ఉపయోగించండి.",
            ]
        elif language == "hi":
            summary = (
                f"आदरणीय अभिभावक, आपके बच्चे {student_name} की शैक्षणिक प्रगति रिपोर्ट:\n"
                f"• वर्तमान कक्षा उपस्थिति: {att_rate}%.\n"
                f"• पूरे किए गए क्विज़: {quizzes_count} (औसत अंक: {quiz_avg}%).\n"
                f"• जमा किए गए असाइनमेंट: {assign_count}.\n"
            )
            if gaps:
                summary += f"अतिरिक्त अभ्यास की आवश्यकता वाले विषय: {', '.join(gaps[:3])}."
            else:
                summary += "वर्तमान में आपके बच्चे का शैक्षणिक प्रदर्शन स्थिर और संतोषजनक है।"

            recs = [
                f"प्रतिदिन 30 मिनट का समय निकालकर {', '.join(gaps[:2]) if gaps else 'पाठ्यक्रम'} का पुनरावलोकन कराएं।",
                "असाइनमेंट समय पर जमा करने के लिए बच्चे का उत्साहवर्धन करें।",
                "यदि कोई संदेह हो तो ऐप के माध्यम से शिक्षक से संपर्क या मीटिंग का अनुरोध करें।",
            ]
        else:
            summary = (
                f"Dear Parent, here is the official academic progress summary for {student_name}:\n"
                f"• Lecture Attendance Rate: {att_rate}% across official sessions.\n"
                f"• Formative Quizzes Completed: {quizzes_count} with an average accuracy of {quiz_avg}%.\n"
                f"• Coursework Submissions: {assign_count} assignments logged.\n"
            )
            if gaps:
                summary += f"Targeted Improvement Focus: Concept reinforcement recommended in {', '.join(gaps[:3])}."
            else:
                summary += "Overall Performance: Demonstrating steady concept retention across evaluated topics."

            recs = [
                f"Encourage a structured 30-minute daily review routine for {', '.join(gaps[:2]) if gaps else 'active course topics'}.",
                "Support timely completion of weekly coursework before submission cutoffs.",
                "Schedule a quick consultation with faculty via the Parent-Teacher Meeting tab if questions arise.",
            ]

        return summary, recs

    async def generate_institutional_report(
        self,
        db: AsyncSession,
        institution_id: str,
        generated_by: User,
        report_type: str = "monthly_academic",
        period: str = "Current Term 2026",
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Synthesizes an executive institutional intelligence report for administrators.
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

        # Quizzes & Attendance
        stmt_iq = (
            select(QuizAttempt)
            .join(User, QuizAttempt.student_id == User.id)
            .where(User.institution_id == institution_id)
        )
        res_iq = await db.execute(stmt_iq)
        attempts = res_iq.scalars().all()
        avg_score = round(sum(a.percentage for a in attempts) / len(attempts), 1) if attempts else 0.0

        stmt_ia = (
            select(AttendanceRecord)
            .join(User, AttendanceRecord.student_id == User.id)
            .where(User.institution_id == institution_id)
        )
        res_ia = await db.execute(stmt_ia)
        atts = res_ia.scalars().all()
        present = sum(1 for a in atts if a.status in ("present", "late"))
        avg_att = round(present / len(atts) * 100.0, 1) if atts else 0.0

        # Parent communication telemetry
        stmt_threads = select(CommunicationThread).where(CommunicationThread.institution_id == institution_id)
        res_th = await db.execute(stmt_threads)
        threads = res_th.scalars().all()
        total_th = len(threads)
        resolved_th = sum(1 for t in threads if t.status == "resolved")
        res_rate = round((resolved_th / total_th * 100.0), 1) if total_th > 0 else 100.0

        report_data = {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_departments": len(depts),
            "total_courses": len(courses),
            "campus_average_score": avg_score,
            "campus_average_attendance": avg_att,
            "parent_inquiries_total": total_th,
            "parent_inquiries_resolved": resolved_th,
            "inquiry_resolution_rate": res_rate,
        }

        if language == "te":
            title = f"సంస్థాగత అకడమిక్ మరియు నిర్వహణ నివేదిక ({period})"
            summary = (
                f"విశ్వవిద్యాలయ నిర్వహణా సారాంశం ({period}):\n"
                f"• నమోదైన విద్యార్థులు: {total_students}, బోధనా అధ్యాపకులు: {total_teachers}.\n"
                f"• మొత్తం విభాగాలు: {len(depts)}, కోర్సులు: {len(courses)}.\n"
                f"• ప్రాంగణ సగటు మార్కులు: {avg_score}%, సగటు హాజరు: {avg_att}%.\n"
                f"• తల్లిదండ్రుల విచారణల పరిష్కార రేటు: {res_rate}% ({resolved_th}/{total_th} పరిష్కరించబడ్డాయి)."
            )
        else:
            title = f"Executive Institutional Report ({period})"
            summary = (
                f"Institutional Academic & Governance Summary for {period}:\n"
                f"• Student Body: {total_students} enrolled students supported by {total_teachers} certified educators.\n"
                f"• Academic Structure: {len(depts)} academic departments managing {len(courses)} active courses.\n"
                f"• Academic Benchmarks: Campus-wide average quiz proficiency of {avg_score}% with an attendance consistency of {avg_att}%.\n"
                f"• Parent Engagement: {res_rate}% of parent inquiry threads successfully resolved ({resolved_th} of {total_th})."
            )

        report = InstitutionalReport(
            institution_id=institution_id,
            generated_by=generated_by.id,
            report_type=report_type,
            title=title,
            period=period,
            summary=summary,
            data_json=report_data,
            language=language,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        return {
            "id": report.id,
            "institution_id": report.institution_id,
            "generated_by": report.generated_by,
            "report_type": report.report_type,
            "title": report.title,
            "period": report.period,
            "summary": report.summary,
            "data_json": report.data_json,
            "language": report.language,
            "created_at": report.created_at.isoformat(),
        }


report_generation_service = ReportGenerationService()
