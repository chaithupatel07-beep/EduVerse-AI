import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.institution import Institution
from app.models.user import ParentStudentLink, User, UserRole

logger = logging.getLogger("eduverse.seed")


async def seed_initial_data() -> None:
    """Seeds default institution and demo users for all 4 roles."""
    async with AsyncSessionLocal() as session:
        # 1. Seed Default Institution
        inst_res = await session.execute(
            select(Institution).where(Institution.code == "OGA-2026")
        )
        institution = inst_res.scalar_one_or_none()

        if not institution:
            institution = Institution(
                name="Oakridge Global Academy",
                code="OGA-2026",
                description="Pioneering AI-driven holistic education and personalized student growth.",
                address="450 Innovation Parkway",
                city="San Francisco",
                state="California",
                country="United States",
                contact_email="admissions@oakridge.edu",
                contact_phone="+1 (555) 234-5678",
                website="https://oakridge.eduverse.io",
                is_active=True,
            )
            session.add(institution)
            await session.commit()
            await session.refresh(institution)
            logger.info(f"Created institution: {institution.name} ({institution.code})")

        # 2. Seed Demo Accounts
        demo_users = [
            {
                "email": "student@eduverse.io",
                "password": "Password123!",
                "full_name": "Alex Chen",
                "role": UserRole.STUDENT,
                "grade_level": "Grade 11 - Advanced STEM",
                "phone": "+1 (555) 901-1001",
                "bio": "Enthusiastic high school student passionate about physics, computer science, and AI.",
            },
            {
                "email": "teacher@eduverse.io",
                "password": "Password123!",
                "full_name": "Dr. Sarah Jenkins",
                "role": UserRole.TEACHER,
                "subject_specialization": "Physics & Computer Science",
                "phone": "+1 (555) 901-2002",
                "bio": "Lead STEM Educator with 12 years experience blending generative learning with experimental physics.",
            },
            {
                "email": "parent@eduverse.io",
                "password": "Password123!",
                "full_name": "Marcus Chen",
                "role": UserRole.PARENT,
                "phone": "+1 (555) 901-3003",
                "bio": "Parent advocate interested in tracking learning progression, milestones, and collaborative teacher feedback.",
            },
            {
                "email": "admin@eduverse.io",
                "password": "Password123!",
                "full_name": "Dean Eleanor Vance",
                "role": UserRole.ADMIN,
                "phone": "+1 (555) 901-4004",
                "bio": "Dean of Academic Technology & Innovation at Oakridge Global Academy.",
            },
        ]

        created_map = {}
        for u in demo_users:
            user_res = await session.execute(
                select(User).where(User.email == u["email"])
            )
            existing = user_res.scalar_one_or_none()

            if not existing:
                new_user = User(
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    institution_id=institution.id,
                    phone=u.get("phone"),
                    bio=u.get("bio"),
                    grade_level=u.get("grade_level"),
                    subject_specialization=u.get("subject_specialization"),
                    is_active=True,
                    is_verified=True,
                )
                session.add(new_user)
                await session.commit()
                await session.refresh(new_user)
                created_map[u["role"]] = new_user
                logger.info(f"Seeded demo {u['role'].value}: {u['email']}")
            else:
                created_map[u["role"]] = existing

        # 3. Link Parent and Student
        if UserRole.PARENT in created_map and UserRole.STUDENT in created_map:
            parent = created_map[UserRole.PARENT]
            student = created_map[UserRole.STUDENT]

            link_res = await session.execute(
                select(ParentStudentLink).where(
                    (ParentStudentLink.parent_id == parent.id)
                    & (ParentStudentLink.student_id == student.id)
                )
            )
            if not link_res.scalar_one_or_none():
                link = ParentStudentLink(
                    parent_id=parent.id,
                    student_id=student.id,
                    relationship_type="father",
                    is_verified=True,
                )
                session.add(link)
                await session.commit()
                logger.info(f"Linked Parent ({parent.email}) to Student ({student.email})")


if __name__ == "__main__":
    asyncio.run(seed_initial_data())
