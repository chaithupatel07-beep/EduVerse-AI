"""
EduVerse AI - Phase 3 Database Seeding Script
Populates complete academic structure: departments, courses, subjects, classrooms,
enrollments, teacher assignments, study materials, assignments, quizzes, attendance,
announcements, and communication requests for Oakridge Global Academy.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
import logging
import os
from pathlib import Path
import sys

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal, init_db
from app.models.institution import Institution
from app.models.user import User, UserRole
from app.models.academic import (
    Department,
    Course,
    Subject,
    ClassRoom,
    ClassEnrollment,
    TeacherAssignment,
)
from app.models.material import StudyMaterial
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.communication import Announcement, Notification, CommunicationRequest

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("eduverse.seed_phase3")


async def seed_phase3():
    logger.info("Initializing database tables for Phase 3...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Fetch Oakridge Global Academy
        inst_res = await session.execute(select(Institution).where(Institution.code == "OGA-2026"))
        institution = inst_res.scalar_one_or_none()
        if not institution:
            logger.error("Oakridge Global Academy not found! Run seed_phase2.py first.")
            return

        # 2. Fetch Users
        stu_res = await session.execute(select(User).where(User.email == "student@eduverse.io"))
        student = stu_res.scalar_one_or_none()

        teach_res = await session.execute(select(User).where(User.email == "teacher@eduverse.io"))
        teacher = teach_res.scalar_one_or_none()

        parent_res = await session.execute(select(User).where(User.email == "parent@eduverse.io"))
        parent = parent_res.scalar_one_or_none()

        admin_res = await session.execute(select(User).where(User.email == "admin@eduverse.io"))
        admin = admin_res.scalar_one_or_none()

        if not student or not teacher or not parent or not admin:
            logger.error("Demo users missing! Please run seed_phase2.py first.")
            return

        # 3. Departments
        dept_cs = await session.execute(
            select(Department).where(and_(Department.institution_id == institution.id, Department.code == "CS"))
        )
        cs_dept = dept_cs.scalar_one_or_none()
        if not cs_dept:
            cs_dept = Department(
                institution_id=institution.id,
                name="Department of Computer Science & Artificial Intelligence",
                code="CS",
                description="Specialized in intelligent agent systems, knowledge retrieval, and computational intelligence.",
            )
            session.add(cs_dept)
            await session.flush()
            logger.info("Seeded Department: CS")

        dept_phys = await session.execute(
            select(Department).where(and_(Department.institution_id == institution.id, Department.code == "PHYS"))
        )
        phys_dept = dept_phys.scalar_one_or_none()
        if not phys_dept:
            phys_dept = Department(
                institution_id=institution.id,
                name="Department of Physical Sciences",
                code="PHYS",
                description="Specialized in mechanics, electromagnetism, and classical physics.",
            )
            session.add(phys_dept)
            await session.flush()
            logger.info("Seeded Department: PHYS")

        # 4. Courses
        course_cs_res = await session.execute(
            select(Course).where(and_(Course.institution_id == institution.id, Course.code == "CS301"))
        )
        course_cs = course_cs_res.scalar_one_or_none()
        if not course_cs:
            course_cs = Course(
                institution_id=institution.id,
                department_id=cs_dept.id,
                title="Intelligent Systems & Generative AI",
                code="CS301",
                description="Comprehensive study of generative models, LLMs, Retrieval-Augmented Generation, and autonomous AI agents.",
                credits=4,
                syllabus="Week 1: Foundations of LLMs. Week 2: Embeddings & Vector Search. Week 3: RAG Pipelines. Week 4: Multi-Agent Systems.",
                is_active=True,
            )
            session.add(course_cs)
            await session.flush()
            logger.info("Seeded Course: CS301")

        course_phy_res = await session.execute(
            select(Course).where(and_(Course.institution_id == institution.id, Course.code == "PHY201"))
        )
        course_phy = course_phy_res.scalar_one_or_none()
        if not course_phy:
            course_phy = Course(
                institution_id=institution.id,
                department_id=phys_dept.id,
                title="Classical Mechanics & Electromagnetism",
                code="PHY201",
                description="Rigorous study of rotational dynamics, central forces, gravitational fields, and Maxwell's equations.",
                credits=4,
                syllabus="Week 1: Kinematics. Week 2: Rotational Dynamics. Week 3: Oscillations. Week 4: Electromagnetic Fields.",
                is_active=True,
            )
            session.add(course_phy)
            await session.flush()
            logger.info("Seeded Course: PHY201")

        # 5. Subjects
        sub1_res = await session.execute(
            select(Subject).where(and_(Subject.course_id == course_cs.id, Subject.code == "CS301-A"))
        )
        sub_rag = sub1_res.scalar_one_or_none()
        if not sub_rag:
            sub_rag = Subject(
                course_id=course_cs.id,
                title="RAG Architectures & Vector Databases",
                code="CS301-A",
                description="Chunking strategies, dense embeddings, hybrid search, and grounding verification.",
                order_index=1,
            )
            session.add(sub_rag)
            await session.flush()

        sub2_res = await session.execute(
            select(Subject).where(and_(Subject.course_id == course_phy.id, Subject.code == "PHY201-A"))
        )
        sub_rot = sub2_res.scalar_one_or_none()
        if not sub_rot:
            sub_rot = Subject(
                course_id=course_phy.id,
                title="Rotational Dynamics & Angular Momentum",
                code="PHY201-A",
                description="Moment of inertia tensors, torque equilibrium, and gyroscopic motion.",
                order_index=1,
            )
            session.add(sub_rot)
            await session.flush()

        # 6. Classrooms
        class1_res = await session.execute(
            select(ClassRoom).where(
                and_(
                    ClassRoom.course_id == course_cs.id,
                    ClassRoom.name == "Section A - Fall 2026",
                )
            )
        )
        class_cs = class1_res.scalar_one_or_none()
        if not class_cs:
            class_cs = ClassRoom(
                institution_id=institution.id,
                course_id=course_cs.id,
                name="Section A - Fall 2026",
                academic_year="2026-2027",
                semester_term="Semester 1",
                room_number="Turing Hall 301",
                schedule="Mon/Wed 10:00 - 11:30 AM",
                is_active=True,
            )
            session.add(class_cs)
            await session.flush()
            logger.info("Seeded Classroom: CS301 Section A")

        class2_res = await session.execute(
            select(ClassRoom).where(
                and_(
                    ClassRoom.course_id == course_phy.id,
                    ClassRoom.name == "Section B - Fall 2026",
                )
            )
        )
        class_phy = class2_res.scalar_one_or_none()
        if not class_phy:
            class_phy = ClassRoom(
                institution_id=institution.id,
                course_id=course_phy.id,
                name="Section B - Fall 2026",
                academic_year="2026-2027",
                semester_term="Semester 1",
                room_number="Newton Lab 102",
                schedule="Tue/Thu 02:00 - 03:30 PM",
                is_active=True,
            )
            session.add(class_phy)
            await session.flush()
            logger.info("Seeded Classroom: PHY201 Section B")

        # 7. Class Enrollments (Alex Chen)
        enr1_res = await session.execute(
            select(ClassEnrollment).where(
                and_(ClassEnrollment.class_id == class_cs.id, ClassEnrollment.student_id == student.id)
            )
        )
        if not enr1_res.scalar_one_or_none():
            session.add(
                ClassEnrollment(
                    class_id=class_cs.id,
                    student_id=student.id,
                    status="enrolled",
                )
            )

        enr2_res = await session.execute(
            select(ClassEnrollment).where(
                and_(ClassEnrollment.class_id == class_phy.id, ClassEnrollment.student_id == student.id)
            )
        )
        if not enr2_res.scalar_one_or_none():
            session.add(
                ClassEnrollment(
                    class_id=class_phy.id,
                    student_id=student.id,
                    status="enrolled",
                )
            )

        # 8. Teacher Assignments (Dr. Sarah Jenkins)
        ta1_res = await session.execute(
            select(TeacherAssignment).where(
                and_(TeacherAssignment.class_id == class_cs.id, TeacherAssignment.teacher_id == teacher.id)
            )
        )
        if not ta1_res.scalar_one_or_none():
            session.add(
                TeacherAssignment(
                    class_id=class_cs.id,
                    subject_id=sub_rag.id,
                    teacher_id=teacher.id,
                    role_type="primary",
                )
            )

        ta2_res = await session.execute(
            select(TeacherAssignment).where(
                and_(TeacherAssignment.class_id == class_phy.id, TeacherAssignment.teacher_id == teacher.id)
            )
        )
        if not ta2_res.scalar_one_or_none():
            session.add(
                TeacherAssignment(
                    class_id=class_phy.id,
                    subject_id=sub_rot.id,
                    teacher_id=teacher.id,
                    role_type="primary",
                )
            )

        # 9. Real Sample Study Material Files
        materials_dir = backend_dir / "uploads" / "materials"
        os.makedirs(materials_dir, exist_ok=True)

        sample_file_name = "mat_rag_primer.pdf"
        sample_path = materials_dir / sample_file_name
        if not sample_path.exists():
            sample_path.write_text(
                "%PDF-1.4\n1 0 obj\n<< /Title (EduVerse RAG Fundamentals) /Author (Dr. Sarah Jenkins) >>\nendobj\n"
                "EduVerse AI Knowledge Primer: Retrieval-Augmented Generation groundings.\n"
                "Section 1: Chunking strategies with sliding window.\n"
                "Section 2: Embedding models (e.g. text-embedding-004).\n"
                "Section 3: Top-K Vector Search.\n%%EOF"
            )

        mat_res = await session.execute(
            select(StudyMaterial).where(
                and_(StudyMaterial.course_id == course_cs.id, StudyMaterial.title == "RAG Systems Architecture & Best Practices")
            )
        )
        if not mat_res.scalar_one_or_none():
            session.add(
                StudyMaterial(
                    institution_id=institution.id,
                    course_id=course_cs.id,
                    subject_id=sub_rag.id,
                    uploaded_by=teacher.id,
                    title="RAG Systems Architecture & Best Practices",
                    description="Comprehensive guide covering vector indexing, semantic search, re-ranking, and grounding verification.",
                    file_name=sample_file_name,
                    original_file_name="RAG_Architecture_Guide.pdf",
                    file_path=f"materials/{sample_file_name}",
                    file_size=len(sample_path.read_bytes()),
                    mime_type="application/pdf",
                    file_type="pdf",
                    download_count=18,
                    is_published=True,
                    rag_indexed=True,
                    rag_chunks_count=12,
                )
            )

        # 10. Assignments & Submissions
        now = datetime.now(timezone.utc)
        assign1_res = await session.execute(
            select(Assignment).where(
                and_(Assignment.class_id == class_cs.id, Assignment.title == "Vector Embeddings & Retrieval Implementation")
            )
        )
        assign1 = assign1_res.scalar_one_or_none()
        if not assign1:
            assign1 = Assignment(
                institution_id=institution.id,
                class_id=class_cs.id,
                subject_id=sub_rag.id,
                teacher_id=teacher.id,
                title="Vector Embeddings & Retrieval Implementation",
                description="Implement a cosine similarity retrieval function and analyze recall across 1536-dimensional embeddings.",
                instructions="Provide source code and benchmark metrics. Allowed formats: pdf, docx, txt, zip.",
                max_marks=100.0,
                due_date=now + timedelta(days=5),
                allowed_formats="pdf,docx,zip,txt",
                status="published",
            )
            session.add(assign1)
            await session.flush()

            # Seed evaluated submission for Alex Chen
            session.add(
                AssignmentSubmission(
                    assignment_id=assign1.id,
                    student_id=student.id,
                    submission_text="Implemented top-K vector search with FAISS and ChromaDB. Grounding recall reached 96.2%.",
                    file_name="AlexChen_VectorSearch_Lab.pdf",
                    file_path="submissions/sample_alex_sub.pdf",
                    file_size=14200,
                    mime_type="application/pdf",
                    status="evaluated",
                    submitted_at=now - timedelta(days=1),
                    marks_obtained=94.5,
                    feedback="Exceptional work on chunk overlap and cosine threshold analysis. Well grounded!",
                    evaluated_by=teacher.id,
                    evaluated_at=now - timedelta(hours=4),
                )
            )
            logger.info("Seeded Assignment 1 and evaluated submission for Alex Chen")

        assign2_res = await session.execute(
            select(Assignment).where(
                and_(Assignment.class_id == class_phy.id, Assignment.title == "Moment of Inertia Laboratory Report")
            )
        )
        if not assign2_res.scalar_one_or_none():
            session.add(
                Assignment(
                    institution_id=institution.id,
                    class_id=class_phy.id,
                    subject_id=sub_rot.id,
                    teacher_id=teacher.id,
                    title="Moment of Inertia Laboratory Report",
                    description="Calculate the moment of inertia for composite rigid bodies using the parallel axis theorem.",
                    instructions="Upload experimental measurements, error bounds, and theoretical derivations.",
                    max_marks=100.0,
                    due_date=now + timedelta(days=2),
                    allowed_formats="pdf,docx",
                    status="published",
                )
            )

        # 11. Quizzes
        quiz1_res = await session.execute(
            select(Quiz).where(
                and_(Quiz.class_id == class_cs.id, Quiz.title == "Generative AI & Knowledge Grounding Assessment")
            )
        )
        quiz1 = quiz1_res.scalar_one_or_none()
        if not quiz1:
            quiz1 = Quiz(
                institution_id=institution.id,
                class_id=class_cs.id,
                subject_id=sub_rag.id,
                teacher_id=teacher.id,
                title="Generative AI & Knowledge Grounding Assessment",
                description="Evaluation of core concepts in RAG, vector spaces, dense embeddings, and hallucination prevention.",
                instructions="Answer all questions. Duration: 30 minutes. Single attempt.",
                duration_minutes=30,
                total_marks=100.0,
                passing_marks=50.0,
                is_published=True,
                results_released=True,
            )
            session.add(quiz1)
            await session.flush()

            # Q1: MCQ
            q1 = QuizQuestion(
                quiz_id=quiz1.id,
                question_text="What does the acronym RAG represent in modern Generative AI architectures?",
                question_type="mcq",
                points=25.0,
                order_index=0,
                explanation="RAG stands for Retrieval-Augmented Generation, combining search with generative LLMs.",
            )
            session.add(q1)
            await session.flush()

            session.add_all([
                QuizOption(question_id=q1.id, option_text="Real-time Agent Generation", is_correct=False, order_index=0),
                QuizOption(question_id=q1.id, option_text="Retrieval-Augmented Generation", is_correct=True, order_index=1),
                QuizOption(question_id=q1.id, option_text="Recursive Attention Graph", is_correct=False, order_index=2),
                QuizOption(question_id=q1.id, option_text="Random Access Gradient", is_correct=False, order_index=3),
            ])

            # Q2: True/False
            q2 = QuizQuestion(
                quiz_id=quiz1.id,
                question_text="Cosine similarity measures the orientation angle rather than magnitude between two high-dimensional embeddings.",
                question_type="true_false",
                points=25.0,
                order_index=1,
                explanation="Cosine similarity normalizes vectors to unit length, evaluating the cosine of the angle between them.",
            )
            session.add(q2)
            await session.flush()

            session.add_all([
                QuizOption(question_id=q2.id, option_text="True", is_correct=True, order_index=0),
                QuizOption(question_id=q2.id, option_text="False", is_correct=False, order_index=1),
            ])

            # Q3: MCQ
            q3 = QuizQuestion(
                quiz_id=quiz1.id,
                question_text="Which similarity metric is computationally equivalent to cosine similarity for normalized unit vectors?",
                question_type="mcq",
                points=25.0,
                order_index=2,
                explanation="When embeddings have L2 norm = 1, their dot product equals their cosine similarity.",
            )
            session.add(q3)
            await session.flush()

            session.add_all([
                QuizOption(question_id=q3.id, option_text="Dot Product", is_correct=True, order_index=0),
                QuizOption(question_id=q3.id, option_text="Manhattan Distance", is_correct=False, order_index=1),
                QuizOption(question_id=q3.id, option_text="Hamming Distance", is_correct=False, order_index=2),
                QuizOption(question_id=q3.id, option_text="Jaccard Similarity", is_correct=False, order_index=3),
            ])

            # Q4: Short Answer
            q4 = QuizQuestion(
                quiz_id=quiz1.id,
                question_text="What core mechanism provides factual verification and grounding to prevent LLM hallucinations?",
                question_type="short_answer",
                points=25.0,
                order_index=3,
                explanation="Retrieval",
            )
            session.add(q4)
            await session.flush()

            # Seed completed attempt for Alex Chen
            attempt = QuizAttempt(
                quiz_id=quiz1.id,
                student_id=student.id,
                status="completed",
                score=100.0,
                percentage=100.0,
                passed=True,
                started_at=now - timedelta(hours=24),
                submitted_at=now - timedelta(hours=23, minutes=35),
            )
            session.add(attempt)
            await session.flush()
            logger.info("Seeded Quiz 1 with questions and Alex Chen's attempt")

        # 12. Attendance Sessions & Records
        for i, days_ago in enumerate([14, 10, 7, 3]):
            sess_date = date.today() - timedelta(days=days_ago)
            sess_res = await session.execute(
                select(AttendanceSession).where(
                    and_(
                        AttendanceSession.class_id == class_cs.id,
                        AttendanceSession.session_date == sess_date,
                    )
                )
            )
            att_sess = sess_res.scalar_one_or_none()
            if not att_sess:
                att_sess = AttendanceSession(
                    institution_id=institution.id,
                    class_id=class_cs.id,
                    subject_id=sub_rag.id,
                    teacher_id=teacher.id,
                    session_date=sess_date,
                    session_title=f"Lecture {i+1}: AI Grounding & RAG Core",
                    session_notes="High student participation and hands-on lab demonstration.",
                )
                session.add(att_sess)
                await session.flush()

                # Record for Alex Chen
                session.add(
                    AttendanceRecord(
                        session_id=att_sess.id,
                        student_id=student.id,
                        status="present" if i != 2 else "late",
                        remarks="Participated in discussion" if i != 2 else "Arrived 5 mins late with permission",
                    )
                )

        # 13. Institutional Announcements
        ann1_res = await session.execute(
            select(Announcement).where(
                and_(Announcement.institution_id == institution.id, Announcement.title == "Fall 2026 Academic Research Symposium")
            )
        )
        if not ann1_res.scalar_one_or_none():
            session.add(
                Announcement(
                    institution_id=institution.id,
                    author_id=admin.id,
                    title="Fall 2026 Academic Research Symposium",
                    content="Oakridge Global Academy will host the annual AI and Education Research Symposium on December 15. All students and faculty are invited to submit papers.",
                    target_role="all",
                    priority="high",
                    is_published=True,
                )
            )

        ann2_res = await session.execute(
            select(Announcement).where(
                and_(Announcement.institution_id == institution.id, Announcement.title == "Generative AI Lab Access Protocols")
            )
        )
        if not ann2_res.scalar_one_or_none():
            session.add(
                Announcement(
                    institution_id=institution.id,
                    author_id=teacher.id,
                    title="Generative AI Lab Access Protocols",
                    content="Computing clusters for CS301 are now provisioned. GPU allocation is available Monday through Friday from 8:00 AM to 10:00 PM.",
                    target_role="student",
                    priority="normal",
                    is_published=True,
                )
            )

        # 14. Notifications
        notif_res = await session.execute(
            select(Notification).where(
                and_(Notification.user_id == student.id, Notification.title == "Assignment 1 Evaluated")
            )
        )
        if not notif_res.scalar_one_or_none():
            session.add(
                Notification(
                    user_id=student.id,
                    title="Assignment 1 Evaluated",
                    message="Dr. Sarah Jenkins awarded 94.5/100 on Vector Embeddings & Retrieval Implementation.",
                    notification_type="grade",
                    is_read=False,
                )
            )

        # 15. Communication Request (Parent to Teacher)
        comm_res = await session.execute(
            select(CommunicationRequest).where(
                and_(CommunicationRequest.parent_id == parent.id, CommunicationRequest.student_id == student.id)
            )
        )
        if not comm_res.scalar_one_or_none():
            session.add(
                CommunicationRequest(
                    parent_id=parent.id,
                    teacher_id=teacher.id,
                    student_id=student.id,
                    subject="Inquiry regarding Alex's AI Capstone Project",
                    message="Hello Dr. Jenkins, I would like to schedule a brief meeting to discuss Alex's upcoming RAG research paper and mentoring schedule.",
                    status="pending",
                )
            )

        await session.commit()
        logger.info("Phase 3 Database Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_phase3())
