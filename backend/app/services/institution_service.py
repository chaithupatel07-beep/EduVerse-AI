from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution
from app.models.user import User, UserRole
from app.models.profiles import InstitutionMembership
from app.schemas.institution import InstitutionCreate


class InstitutionService:
    @staticmethod
    async def create_institution(
        data: InstitutionCreate,
        creator: User,
        db: AsyncSession,
    ) -> Institution:
        # Check code uniqueness
        query = await db.execute(select(Institution).where(Institution.code == data.code.upper()))
        if query.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Institution with code '{data.code}' already exists.",
            )

        inst = Institution(
            name=data.name,
            code=data.code.upper(),
            description=data.description,
            address=data.address,
            city=data.city,
            state=data.state,
            country=data.country,
            contact_email=data.contact_email,
            official_email=data.official_email or data.contact_email,
            contact_phone=data.contact_phone,
            website=data.website,
            institution_type=data.institution_type,
            verification_status="verified",
            is_active=True,
        )
        db.add(inst)
        await db.flush()

        # Link creator to this institution as admin
        if creator.role == UserRole.ADMIN:
            creator.institution_id = inst.id
            db.add(
                InstitutionMembership(
                    institution_id=inst.id,
                    user_id=creator.id,
                    membership_role="admin",
                    status="active",
                )
            )

        await db.commit()
        await db.refresh(inst)
        return inst

    @staticmethod
    async def get_all_institutions(db: AsyncSession) -> List[Institution]:
        result = await db.execute(select(Institution).where(Institution.is_active == True))
        return list(result.scalars().all())

    @staticmethod
    async def get_institution_by_id(institution_id: str, db: AsyncSession) -> Optional[Institution]:
        result = await db.execute(select(Institution).where(Institution.id == institution_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_institution_by_code(code: str, db: AsyncSession) -> Optional[Institution]:
        result = await db.execute(select(Institution).where(Institution.code == code.upper()))
        return result.scalar_one_or_none()


institution_service = InstitutionService()
