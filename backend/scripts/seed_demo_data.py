"""
EduVerse AI - Master Hackathon Demonstration Seeding Script (Phase 7)
Idempotently prepares complete ecosystem demo data across:
1. Oakridge Global Academy (OGA-2026)
2. 4 Standard Role Accounts:
   - Student: student@eduverse.io / Password123! (Marcus Chen)
   - Teacher: teacher@eduverse.io / Password123! (Dr. Sarah Jenkins)
   - Parent:  parent@eduverse.io / Password123! (David Chen)
   - Admin:   admin@eduverse.io / Password123! (Dr. Elena Rostova)
3. Verified Academic Records: Courses, Classrooms, Quizzes, Attendance, Assignments.
4. Phase 5 Learning Profiles & Knowledge Gaps.
5. Phase 6 AI Copilot Question Papers & Reports.
6. Phase 6.5 Innovation Data: Mock Exams, Scanned Notes, Smart Timetable, Gamification, and Early-Warning Alerts.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import logging
from pathlib import Path
import sys
import uuid

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal, init_db
from app.models.institution import Institution
from app.models.user import User, UserRole
from app.models.academic import Subject
from app.models.personalization import StudentLearningProfile, KnowledgeGap
from app.models.innovation import (
    MockExam,
    MockExamQuestion,
    ScannedDocument,
    DocumentExtractedText,
    StudyTimetable,
    StudySessionEntry,
    GamificationProfile,
    AchievementBadge,
    EarnedBadge,
    PointTransaction,
    EarlyWarningAlert,
    InterventionRecord,
)
from scripts.seed_phase2 import seed_phase2
from scripts.seed_phase3 import seed_phase3

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("eduverse.seed_demo")


async def seed_master_demo_data():
    logger.info("Step 1: Running Phase 2 base user & institution seeding...")
    await seed_phase2()

    logger.info("Step 2: Running Phase 3 academic structure seeding...")
    await seed_phase3()

    logger.info("Step 3: Seeding Phase 5, 6, and 6.5 Innovation and Intelligence demonstration records...")
    async with AsyncSessionLocal() as session:
        # Fetch Student User
        stu_res = await session.execute(select(User).where(User.email == "student@eduverse.io"))
        student = stu_res.scalar_one_or_none()

        # Fetch Teacher User
        teach_res = await session.execute(select(User).where(User.email == "teacher@eduverse.io"))
        teacher = teach_res.scalar_one_or_none()

        # Fetch Institution
        inst_res = await session.execute(select(Institution).where(Institution.code == "OGA-2026"))
        institution = inst_res.scalar_one_or_none()

        if not student or not teacher or not institution:
            logger.error("Required users or institution missing after initial seeds.")
            return

        # Fetch Subject
        subj_res = await session.execute(select(Subject).limit(1))
        subject = subj_res.scalar_one_or_none()
        subject_id = subject.id if subject else str(uuid.uuid4())

        # 3.1 Learning Profile & Knowledge Gaps
        prof_res = await session.execute(
            select(StudentLearningProfile).where(StudentLearningProfile.student_id == student.id)
        )
        profile = prof_res.scalar_one_or_none()
        if not profile:
            profile = StudentLearningProfile(
                id=str(uuid.uuid4()),
                student_id=student.id,
                institution_id=institution.id,
                overall_gpa=3.65,
                quiz_average=85.0,
                assignment_average=88.5,
                attendance_rate=94.0,
                quizzes_completed=6,
                assignments_completed=5,
                learning_streak_days=4,
                learning_pace="moderate",
            )
            session.add(profile)
            await session.flush()

            # Add Knowledge Gaps
            gap1 = KnowledgeGap(
                id=str(uuid.uuid4()),
                student_id=student.id,
                subject_id=subject_id,
                topic_name="Kinematic Equations & Free Fall",
                classification="needs_improvement",
                confidence_score=0.82,
                evidence_summary="Frequent conceptual errors on quadratic acceleration relationships.",
                suggested_action="Review foundational kinematics video and complete 10 practice problems.",
                is_resolved=False,
            )
            gap2 = KnowledgeGap(
                id=str(uuid.uuid4()),
                student_id=student.id,
                subject_id=subject_id,
                topic_name="Matrix Transformations & Eigenvalues",
                classification="needs_improvement",
                confidence_score=0.79,
                evidence_summary="Incomplete steps identified in formative quiz problem solving.",
                suggested_action="Work through 1-on-1 remedial practice set with teacher guidance.",
                is_resolved=False,
            )
            session.add_all([gap1, gap2])

        # 3.2 Mock Exam Simulator Demonstration Record
        exam_res = await session.execute(
            select(MockExam).where(and_(MockExam.created_by == student.id, MockExam.title.like("%Kinematics%")))
        )
        exam = exam_res.scalar_one_or_none()
        if not exam:
            exam = MockExam(
                id=str(uuid.uuid4()),
                created_by=student.id,
                institution_id=institution.id,
                subject_id=subject_id,
                title="Physics: Kinematics & Newton's Laws Mock Exam",
                description="Comprehensive practice exam covering 1D kinematics and Newton's laws.",
                topic_focus="Kinematics and Dynamics",
                difficulty_level="medium",
                duration_minutes=20,
                total_marks=15.0,
                passing_percentage=40.0,
                language="en",
                question_types=["multiple_choice", "true_false", "short_answer"],
                is_published=True,
            )
            session.add(exam)
            await session.flush()

            q1 = MockExamQuestion(
                id=str(uuid.uuid4()),
                exam_id=exam.id,
                order_index=1,
                question_text="A particle starts from rest and moves with a constant acceleration of 4 m/s^2. What is its velocity after 5 seconds?",
                question_type="multiple_choice",
                section="Section A",
                topic_tag="Kinematics",
                marks=5.0,
                options=["10 m/s", "20 m/s", "25 m/s", "40 m/s"],
                correct_answer="20 m/s",
                explanation="Using v = u + at: v = 0 + (4)(5) = 20 m/s.",
            )
            q2 = MockExamQuestion(
                id=str(uuid.uuid4()),
                exam_id=exam.id,
                order_index=2,
                question_text="Under zero net external force, an object in motion will maintain a constant velocity.",
                question_type="true_false",
                section="Section A",
                topic_tag="Newton Laws",
                marks=5.0,
                options=["True", "False"],
                correct_answer="True",
                explanation="Newton's First Law of Motion (Law of Inertia).",
            )
            q3 = MockExamQuestion(
                id=str(uuid.uuid4()),
                exam_id=exam.id,
                order_index=3,
                question_text="Define acceleration in terms of calculus and state its SI unit.",
                question_type="short_answer",
                section="Section B",
                topic_tag="Kinematics",
                marks=5.0,
                correct_answer="a = dv/dt, m/s^2",
                explanation="Acceleration is the first derivative of velocity with respect to time (a = dv/dt), measured in m/s^2.",
            )
            session.add_all([q1, q2, q3])

        # 3.3 Digitized Notes Scanner Demonstration Record
        doc_res = await session.execute(
            select(ScannedDocument).where(and_(ScannedDocument.student_id == student.id, ScannedDocument.title.like("%Kinematics%")))
        )
        if not doc_res.scalar_one_or_none():
            doc = ScannedDocument(
                id=str(uuid.uuid4()),
                student_id=student.id,
                institution_id=institution.id,
                subject_id=subject_id,
                title="Kinematics & Acceleration Lecture Notes",
                file_name="kinematics_ch1.pdf",
                document_type="notes",
                mime_type="application/pdf",
                detected_language="en",
                ocr_status="completed",
                ocr_confidence=0.96,
                is_indexed_in_rag=True,
            )
            session.add(doc)
            await session.flush()

            ext_text = DocumentExtractedText(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                raw_extracted_text="Chapter 1: Kinematics. Acceleration is defined as rate of change of velocity: a = dv/dt. Constant acceleration yields v = u + at and s = ut + 0.5*a*t^2.",
                cleaned_text="Chapter 1: Kinematics. Acceleration is defined as rate of change of velocity: a = dv/dt. Under constant acceleration: v = u + at and s = ut + 0.5*a*t^2.",
                user_edited_text="Chapter 1: Kinematics. Acceleration is defined as rate of change of velocity: a = dv/dt. Under constant acceleration: v = u + at and s = ut + 0.5*a*t^2.",
                extracted_key_concepts=["kinematics", "velocity", "acceleration", "displacement", "a = dv/dt", "v = u + at"],
                summary="Fundamental kinematic relations under uniform acceleration.",
            )
            session.add(ext_text)

        # 3.4 Smart Study Timetable Demonstration Record
        tt_res = await session.execute(
            select(StudyTimetable).where(StudyTimetable.student_id == student.id)
        )
        if not tt_res.scalar_one_or_none():
            today = date.today()
            tt = StudyTimetable(
                id=str(uuid.uuid4()),
                student_id=student.id,
                institution_id=institution.id,
                schedule_title="Personalized Gap-Focused Weekly Revision",
                start_date=today,
                end_date=today + timedelta(days=7),
                daily_available_hours=3.0,
                status="active",
                optimization_goal="gap_remediation",
                ai_generated_notes="Prioritizes Kinematics (Physics) and Matrix Transformations (Mathematics) based on detected formative gaps.",
            )
            session.add(tt)
            await session.flush()

            sess1 = StudySessionEntry(
                id=str(uuid.uuid4()),
                timetable_id=tt.id,
                student_id=student.id,
                subject_name="Physics",
                topic_name="Kinematics & Free Fall",
                session_type="revision",
                day_of_week="Monday",
                scheduled_start=datetime.now(timezone.utc),
                scheduled_end=datetime.now(timezone.utc) + timedelta(minutes=45),
                duration_minutes=45,
                priority="high",
                is_completed=True,
                completed_at=datetime.now(timezone.utc),
            )
            sess2 = StudySessionEntry(
                id=str(uuid.uuid4()),
                timetable_id=tt.id,
                student_id=student.id,
                subject_name="Mathematics",
                topic_name="Matrix Transformations",
                session_type="practice_quiz",
                day_of_week="Tuesday",
                scheduled_start=datetime.now(timezone.utc) + timedelta(days=1),
                scheduled_end=datetime.now(timezone.utc) + timedelta(days=1, minutes=45),
                duration_minutes=45,
                priority="high",
                is_completed=False,
            )
            session.add_all([sess1, sess2])

        # 3.5 Gamification & Verified Achievements
        gam_res = await session.execute(
            select(GamificationProfile).where(GamificationProfile.user_id == student.id)
        )
        if not gam_res.scalar_one_or_none():
            gprof = GamificationProfile(
                id=str(uuid.uuid4()),
                user_id=student.id,
                institution_id=institution.id,
                total_xp=245,
                current_level=2,
                level_title="Knowledge Practitioner",
                streak_days=4,
                longest_streak_days=6,
                daily_goal_xp=50,
                today_xp=35,
                leaderboard_opt_in=True,
            )
            session.add(gprof)
            await session.flush()

            tx = PointTransaction(
                id=str(uuid.uuid4()),
                profile_id=gprof.id,
                amount=50,
                reason="Submitted verified formative quiz with 90%+ score.",
            )
            session.add(tx)

        # 3.6 Early Warning & Teacher Intervention Demonstration Record
        alert_res = await session.execute(
            select(EarlyWarningAlert).where(EarlyWarningAlert.student_id == student.id)
        )
        if not alert_res.scalar_one_or_none():
            alert = EarlyWarningAlert(
                id=str(uuid.uuid4()),
                institution_id=institution.id,
                student_id=student.id,
                risk_level="moderate",
                alert_category="unresolved_gaps",
                title=f"Targeted Academic Revision Needed: {student.full_name}",
                evidence_summary="Formative quiz assessments indicate 2 unresolved knowledge gaps: Kinematics (Physics) and Matrix Transformations (Mathematics).",
                recommended_intervention="Schedule a 30-minute 1-on-1 remedial practice session and recommend foundational video walkthroughs.",
                is_acknowledged=True,
                acknowledged_by=teacher.id,
            )
            session.add(alert)
            await session.flush()

            intervention = InterventionRecord(
                id=str(uuid.uuid4()),
                alert_id=alert.id,
                assigned_teacher_id=teacher.id,
                student_id=student.id,
                action_type="remedial_session",
                scheduled_for=datetime.now(timezone.utc) + timedelta(days=2),
                status="assigned",
                notes="Reviewing quadratic acceleration derivation and eigenvalue determinants.",
            )
            session.add(intervention)

        await session.commit()
        logger.info("Demo data seeding completed successfully! All 4 roles and innovation features are demonstration-ready.")


if __name__ == "__main__":
    asyncio.run(seed_master_demo_data())
