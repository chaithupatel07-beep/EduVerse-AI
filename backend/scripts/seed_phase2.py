"""
EduVerse AI - Phase 2 Database Seeding Script
Populates institutions, 4-role users, detailed role profiles, and parent-student relationships.
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.institution import Institution
from app.models.user import User, UserRole, ParentStudentLink
from app.models.profiles import (
    StudentProfile,
    TeacherProfile,
    ParentProfile,
    InstitutionMembership,
    ParentStudentRelationship,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("eduverse.seed")


async def seed_phase2():
    logger.info("Initializing database tables for Phase 2...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Seed Institution: Oakridge Global Academy
        inst_query = await session.execute(
            select(Institution).where(Institution.code == "OGA-2026")
        )
        institution = inst_query.scalar_one_or_none()
        if not institution:
            institution = Institution(
                name="Oakridge Global Academy",
                code="OGA-2026",
                description="A premier global institution pioneering generative AI and personalized learning ecosystems.",
                address="100 Innovation Way, Tech Corridor",
                city="San Francisco",
                state="California",
                country="United States",
                contact_email="admissions@oakridge.edu",
                official_email="administration@oakridge.edu",
                contact_phone="+1-555-0100",
                website="https://oakridge.eduverse.io",
                institution_type="university",
                verification_status="verified",
                is_active=True,
            )
            session.add(institution)
            await session.flush()
            logger.info(f"Seeded Institution: {institution.name} ({institution.code})")
        else:
            institution.official_email = "administration@oakridge.edu"
            institution.institution_type = "university"
            institution.verification_status = "verified"
            logger.info(f"Institution already exists: {institution.name}")

        default_pw = hash_password("Password123!")

        # 2. Seed Student User & Profile
        stu_query = await session.execute(select(User).where(User.email == "student@eduverse.io"))
        student = stu_query.scalar_one_or_none()
        if not student:
            student = User(
                email="student@eduverse.io",
                hashed_password=default_pw,
                full_name="Alex Chen",
                role=UserRole.STUDENT,
                institution_id=institution.id,
                grade_level="3rd Year / Semester 5",
                phone="+1-555-0142",
                bio="Passionate computer science student specializing in AI systems and intelligent tutoring.",
                firebase_uid="firebase-student-alex-001",
                is_active=True,
                is_verified=True,
                account_status="active",
                email_verified=True,
            )
            session.add(student)
            await session.flush()
            logger.info("Seeded Student User: Alex Chen")

        stu_prof_query = await session.execute(
            select(StudentProfile).where(StudentProfile.user_id == student.id)
        )
        if not stu_prof_query.scalar_one_or_none():
            session.add(
                StudentProfile(
                    user_id=student.id,
                    institution_id=institution.id,
                    student_identifier="STU-2026-0042",
                    department="Computer Science & Engineering",
                    academic_year="3rd Year / Semester 5",
                    program="B.Tech in Artificial Intelligence",
                    gpa=3.85,
                )
            )
            logger.info("Seeded Student Profile for Alex Chen")

        # 3. Seed Teacher User & Profile
        teacher_query = await session.execute(select(User).where(User.email == "teacher@eduverse.io"))
        teacher = teacher_query.scalar_one_or_none()
        if not teacher:
            teacher = User(
                email="teacher@eduverse.io",
                hashed_password=default_pw,
                full_name="Dr. Sarah Jenkins",
                role=UserRole.TEACHER,
                institution_id=institution.id,
                subject_specialization="Generative AI & Machine Learning",
                phone="+1-555-0178",
                bio="Professor of Computing Sciences and lead researcher in cognitive education algorithms.",
                firebase_uid="firebase-teacher-sarah-002",
                is_active=True,
                is_verified=True,
                account_status="active",
                email_verified=True,
            )
            session.add(teacher)
            await session.flush()
            logger.info("Seeded Teacher User: Dr. Sarah Jenkins")

        teach_prof_query = await session.execute(
            select(TeacherProfile).where(TeacherProfile.user_id == teacher.id)
        )
        if not teach_prof_query.scalar_one_or_none():
            session.add(
                TeacherProfile(
                    user_id=teacher.id,
                    institution_id=institution.id,
                    employee_identifier="FAC-2026-018",
                    department="School of AI & Data Science",
                    designation="Senior Associate Professor",
                    specialization="Generative AI & Machine Learning",
                    office_hours="Mon/Wed 2:00 PM - 4:00 PM",
                )
            )
            logger.info("Seeded Teacher Profile for Dr. Sarah Jenkins")

        # 4. Seed Parent User & Profile
        parent_query = await session.execute(select(User).where(User.email == "parent@eduverse.io"))
        parent = parent_query.scalar_one_or_none()
        if not parent:
            parent = User(
                email="parent@eduverse.io",
                hashed_password=default_pw,
                full_name="Marcus Chen",
                role=UserRole.PARENT,
                phone="+1-555-0199",
                bio="Parent actively engaged in student curriculum, assessment progress, and academic growth.",
                firebase_uid="firebase-parent-marcus-003",
                is_active=True,
                is_verified=True,
                account_status="active",
                email_verified=True,
            )
            session.add(parent)
            await session.flush()
            logger.info("Seeded Parent User: Marcus Chen")

        parent_prof_query = await session.execute(
            select(ParentProfile).where(ParentProfile.user_id == parent.id)
        )
        if not parent_prof_query.scalar_one_or_none():
            session.add(
                ParentProfile(
                    user_id=parent.id,
                    contact_number="+1-555-0199",
                    occupation="Senior Technology Executive",
                    preferred_language="en",
                )
            )
            logger.info("Seeded Parent Profile for Marcus Chen")

        # 5. Seed Institution Admin User
        admin_query = await session.execute(select(User).where(User.email == "admin@eduverse.io"))
        admin = admin_query.scalar_one_or_none()
        if not admin:
            admin = User(
                email="admin@eduverse.io",
                hashed_password=default_pw,
                full_name="Dean Elena Rostova",
                role=UserRole.ADMIN,
                institution_id=institution.id,
                phone="+1-555-0105",
                bio="Dean of Academic Technology overseeing multi-tenant policies, RBAC governance, and curriculum systems.",
                firebase_uid="firebase-admin-elena-004",
                is_active=True,
                is_verified=True,
                account_status="active",
                email_verified=True,
            )
            session.add(admin)
            await session.flush()
            logger.info("Seeded Admin User: Dean Elena Rostova")

        # 6. Seed Authoritative Parent-Student Relationship
        rel_query = await session.execute(
            select(ParentStudentRelationship).where(
                ParentStudentRelationship.parent_user_id == parent.id,
                ParentStudentRelationship.student_user_id == student.id,
            )
        )
        if not rel_query.scalar_one_or_none():
            session.add(
                ParentStudentRelationship(
                    parent_user_id=parent.id,
                    student_user_id=student.id,
                    relationship_type="father",
                    verification_status="verified",
                    verified_at="2026-01-15T10:00:00Z",
                    verified_by=admin.id,
                    notes="Verified via official student enrollment registration document.",
                )
            )
            # Phase 1 link
            session.add(
                ParentStudentLink(
                    parent_id=parent.id,
                    student_id=student.id,
                    relationship_type="father",
                    is_verified=True,
                )
            )
            logger.info("Seeded Verified Parent-Student Relationship between Marcus Chen and Alex Chen")

        # 7. Seed Institution Memberships
        for user_record in [student, teacher, admin]:
            m_query = await session.execute(
                select(InstitutionMembership).where(
                    InstitutionMembership.institution_id == institution.id,
                    InstitutionMembership.user_id == user_record.id,
                )
            )
            if not m_query.scalar_one_or_none():
                session.add(
                    InstitutionMembership(
                        institution_id=institution.id,
                        user_id=user_record.id,
                        membership_role=user_record.role.value,
                        status="active",
                    )
                )

        await session.commit()
        logger.info("Phase 2 Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_phase2())
