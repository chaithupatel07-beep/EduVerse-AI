from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole, ParentStudentLink
from app.models.profiles import ParentStudentRelationship


class RelationshipService:
    @staticmethod
    async def request_parent_student_relationship(
        parent_user: User,
        student_email: str,
        relationship_type: str,
        notes: Optional[str],
        db: AsyncSession,
    ) -> ParentStudentRelationship:
        if parent_user.role != UserRole.PARENT and parent_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parent accounts can request parent-student linking.",
            )

        # Look up target student
        student_query = await db.execute(
            select(User).where(User.email == student_email, User.role == UserRole.STUDENT)
        )
        student = student_query.scalar_one_or_none()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with email '{student_email}' not found.",
            )

        # Check existing relationship
        existing_query = await db.execute(
            select(ParentStudentRelationship).where(
                ParentStudentRelationship.parent_user_id == parent_user.id,
                ParentStudentRelationship.student_user_id == student.id,
            )
        )
        existing = existing_query.scalar_one_or_none()
        if existing:
            if existing.verification_status == "verified":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A verified relationship already exists with this student.",
                )
            return existing

        # Create new relationship in pending state
        rel = ParentStudentRelationship(
            parent_user_id=parent_user.id,
            student_user_id=student.id,
            relationship_type=relationship_type or "guardian",
            verification_status="pending",
            notes=notes,
        )
        db.add(rel)

        # Also maintain compatibility with Phase 1 link
        p1_link_query = await db.execute(
            select(ParentStudentLink).where(
                ParentStudentLink.parent_id == parent_user.id,
                ParentStudentLink.student_id == student.id,
            )
        )
        if not p1_link_query.scalar_one_or_none():
            db.add(
                ParentStudentLink(
                    parent_id=parent_user.id,
                    student_id=student.id,
                    relationship_type=relationship_type or "guardian",
                    is_verified=False,
                )
            )

        await db.commit()
        await db.refresh(rel)
        return rel

    @staticmethod
    async def verify_relationship(
        relationship_id: str,
        verifier_user: User,
        decision: str,
        db: AsyncSession,
    ) -> ParentStudentRelationship:
        # Load relationship
        query = await db.execute(
            select(ParentStudentRelationship).where(ParentStudentRelationship.id == relationship_id)
        )
        rel = query.scalar_one_or_none()
        if not rel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent-student relationship request not found.",
            )

        # Authorization: Must be the student being linked OR an institution admin
        is_the_student = verifier_user.id == rel.student_user_id
        is_admin = verifier_user.role == UserRole.ADMIN

        if not is_the_student and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized. Only the requested student or an institution admin can verify this link.",
            )

        now_str = datetime.now(timezone.utc).isoformat()
        rel.verification_status = "verified" if decision == "verified" else "rejected"
        rel.verified_at = now_str
        rel.verified_by = verifier_user.id

        # Update Phase 1 link
        link_query = await db.execute(
            select(ParentStudentLink).where(
                ParentStudentLink.parent_id == rel.parent_user_id,
                ParentStudentLink.student_id == rel.student_user_id,
            )
        )
        link = link_query.scalar_one_or_none()
        if link:
            link.is_verified = (decision == "verified")

        await db.commit()
        await db.refresh(rel)
        return rel

    @staticmethod
    async def get_parent_children(
        parent_user_id: str,
        db: AsyncSession,
        only_verified: bool = True,
    ) -> List[User]:
        query = (
            select(ParentStudentRelationship)
            .options(selectinload(ParentStudentRelationship.student))
            .where(ParentStudentRelationship.parent_user_id == parent_user_id)
        )
        if only_verified:
            query = query.where(ParentStudentRelationship.verification_status == "verified")

        result = await db.execute(query)
        rels = result.scalars().all()
        return [r.student for r in rels if r.student]

    @staticmethod
    async def has_verified_access(
        parent_user_id: str,
        student_user_id: str,
        db: AsyncSession,
    ) -> bool:
        query = await db.execute(
            select(ParentStudentRelationship).where(
                ParentStudentRelationship.parent_user_id == parent_user_id,
                ParentStudentRelationship.student_user_id == student_user_id,
                ParentStudentRelationship.verification_status == "verified",
            )
        )
        return query.scalar_one_or_none() is not None


relationship_service = RelationshipService()
