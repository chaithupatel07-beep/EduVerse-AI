from datetime import timedelta
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.institution import Institution
from app.models.user import ParentStudentLink, User, UserRole
from app.models.profiles import (
    StudentProfile,
    TeacherProfile,
    ParentProfile,
    InstitutionMembership,
    ParentStudentRelationship,
)
from app.schemas.auth import (
    AuthResponseData,
    FirebaseLoginRequest,
    LoginRequest,
    RegisterRequest,
    TokenData,
)
from app.schemas.user import UserResponse
from app.schemas.profiles import (
    RegisterProfileRequest,
    UserProfileDetailResponse,
    StudentProfileData,
    TeacherProfileData,
    ParentProfileData,
)
from app.services.firebase_service import firebase_service


class AuthService:
    """Authentication and User Lifecycle Business Service with Dual-Token RBAC."""

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.institution),
                selectinload(User.student_profile),
                selectinload(User.teacher_profile),
                selectinload(User.parent_profile),
            )
            .where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.institution),
                selectinload(User.student_profile),
                selectinload(User.teacher_profile),
                selectinload(User.parent_profile),
            )
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def build_user_response(cls, db: AsyncSession, user: User) -> UserResponse:
        institution_name = None
        if user.institution_id:
            inst_query = await db.execute(
                select(Institution.name).where(Institution.id == user.institution_id)
            )
            institution_name = inst_query.scalar_one_or_none()

        child_ids: List[str] = []
        if user.role == UserRole.PARENT:
            res = await db.execute(
                select(ParentStudentRelationship.student_user_id).where(
                    ParentStudentRelationship.parent_user_id == user.id,
                    ParentStudentRelationship.verification_status == "verified",
                )
            )
            child_ids = [row[0] for row in res.all()]

        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            avatar_url=user.avatar_url,
            phone=user.phone,
            bio=user.bio,
            institution_id=user.institution_id,
            institution_name=institution_name,
            grade_level=user.grade_level,
            subject_specialization=user.subject_specialization,
            child_ids=child_ids if child_ids else None,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    @classmethod
    async def build_user_detail_response(cls, db: AsyncSession, user: User) -> UserProfileDetailResponse:
        # Load user with all profile relations eagerly
        query = (
            select(User)
            .options(
                selectinload(User.institution),
                selectinload(User.student_profile),
                selectinload(User.teacher_profile),
                selectinload(User.parent_profile),
            )
            .where(User.id == user.id)
        )
        res = await db.execute(query)
        loaded_user = res.scalar_one()

        institution_name = loaded_user.institution.name if loaded_user.institution else None

        student_data = None
        if loaded_user.student_profile:
            student_data = StudentProfileData.model_validate(loaded_user.student_profile)

        teacher_data = None
        if loaded_user.teacher_profile:
            teacher_data = TeacherProfileData.model_validate(loaded_user.teacher_profile)

        parent_data = None
        if loaded_user.parent_profile:
            parent_data = ParentProfileData.model_validate(loaded_user.parent_profile)

        return UserProfileDetailResponse(
            id=loaded_user.id,
            email=loaded_user.email,
            full_name=loaded_user.full_name,
            role=loaded_user.role,
            firebase_uid=loaded_user.firebase_uid,
            account_status=loaded_user.account_status,
            email_verified=loaded_user.email_verified,
            avatar_url=loaded_user.avatar_url,
            phone=loaded_user.phone,
            bio=loaded_user.bio,
            institution_id=loaded_user.institution_id,
            institution_name=institution_name,
            student_profile=student_data,
            teacher_profile=teacher_data,
            parent_profile=parent_data,
            created_at=loaded_user.created_at,
            updated_at=loaded_user.updated_at,
        )

    @classmethod
    async def generate_tokens_for_user(cls, db: AsyncSession, user: User) -> TokenData:
        access_token = create_access_token(
            user_id=user.id,
            role=user.role.value,
            email=user.email,
        )
        refresh_token = create_refresh_token(
            user_id=user.id,
            role=user.role.value,
        )

        user.refresh_token = refresh_token
        await db.commit()
        await db.refresh(user)

        return TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @classmethod
    async def register(cls, db: AsyncSession, req: RegisterRequest) -> Tuple[User, TokenData]:
        normalized_email = req.email.lower().strip()
        existing = await cls.get_user_by_email(db, normalized_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{normalized_email}' already exists.",
            )

        institution_id = None
        if req.institution_code:
            inst_res = await db.execute(
                select(Institution).where(Institution.code == req.institution_code.strip().upper())
            )
            inst = inst_res.scalar_one_or_none()
            if not inst:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Institution code '{req.institution_code}' not found.",
                )
            institution_id = inst.id

        hashed_pw = hash_password(req.password)
        user = User(
            email=normalized_email,
            hashed_password=hashed_pw,
            full_name=req.full_name.strip(),
            role=req.role,
            phone=req.phone,
            institution_id=institution_id,
            grade_level=req.grade_level if req.role == UserRole.STUDENT else None,
            subject_specialization=req.subject_specialization if req.role == UserRole.TEACHER else None,
            is_active=True,
            is_verified=True,
            account_status="active",
            email_verified=True,
        )

        db.add(user)
        await db.flush()

        # Create role-specific profiles
        if req.role == UserRole.STUDENT:
            db.add(
                StudentProfile(
                    user_id=user.id,
                    institution_id=institution_id,
                    academic_year=req.grade_level or "Year 1",
                )
            )
        elif req.role == UserRole.TEACHER:
            db.add(
                TeacherProfile(
                    user_id=user.id,
                    institution_id=institution_id,
                    specialization=req.subject_specialization or "General Education",
                )
            )
        elif req.role == UserRole.PARENT:
            db.add(ParentProfile(user_id=user.id, contact_number=req.phone))

        if institution_id:
            db.add(
                InstitutionMembership(
                    institution_id=institution_id,
                    user_id=user.id,
                    membership_role=req.role.value,
                    status="active",
                )
            )

        await db.commit()
        await db.refresh(user)

        tokens = await cls.generate_tokens_for_user(db, user)
        return user, tokens

    @classmethod
    async def register_profile(cls, db: AsyncSession, req: RegisterProfileRequest) -> Tuple[User, TokenData]:
        normalized_email = req.email.lower().strip()
        existing = await cls.get_user_by_email(db, normalized_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{normalized_email}' already exists.",
            )

        # Enforce controlled setup for Institution Administrators
        if req.role == UserRole.ADMIN:
            valid_codes = ["EDUVERSE-ADMIN-2026", "OGA-ADMIN-INVITE"]
            if not req.invitation_code or req.invitation_code.strip() not in valid_codes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Institution Administrator accounts require a valid administrative invitation code.",
                )

        firebase_uid = None
        email_verified = False
        if req.id_token:
            claims = firebase_service.verify_firebase_id_token(req.id_token)
            if claims:
                firebase_uid = claims.get("uid")
                email_verified = claims.get("email_verified", False)

        institution_id = None
        if req.institution_code:
            inst_res = await db.execute(
                select(Institution).where(Institution.code == req.institution_code.strip().upper())
            )
            inst = inst_res.scalar_one_or_none()
            if not inst:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Institution code '{req.institution_code}' not found.",
                )
            institution_id = inst.id

        hashed_pw = hash_password(req.password) if req.password else None
        user = User(
            email=normalized_email,
            hashed_password=hashed_pw,
            full_name=req.full_name.strip(),
            role=req.role,
            firebase_uid=firebase_uid,
            phone=req.phone,
            institution_id=institution_id,
            grade_level=req.academic_year if req.role == UserRole.STUDENT else None,
            subject_specialization=req.specialization if req.role == UserRole.TEACHER else None,
            is_active=True,
            is_verified=True,
            account_status="active",
            email_verified=email_verified or True,
        )

        db.add(user)
        await db.flush()

        # Create role-specific profiles
        if req.role == UserRole.STUDENT:
            db.add(
                StudentProfile(
                    user_id=user.id,
                    institution_id=institution_id,
                    student_identifier=req.student_id,
                    department=req.department,
                    academic_year=req.academic_year,
                    program=req.program,
                )
            )
        elif req.role == UserRole.TEACHER:
            db.add(
                TeacherProfile(
                    user_id=user.id,
                    institution_id=institution_id,
                    employee_identifier=req.employee_id,
                    department=req.department,
                    designation=req.designation,
                    specialization=req.specialization,
                )
            )
        elif req.role == UserRole.PARENT:
            db.add(ParentProfile(user_id=user.id, contact_number=req.phone))
            if req.linked_student_email:
                # Attempt to link student in pending state
                stu_query = await db.execute(
                    select(User).where(
                        User.email == req.linked_student_email.lower().strip(),
                        User.role == UserRole.STUDENT,
                    )
                )
                student = stu_query.scalar_one_or_none()
                if student:
                    db.add(
                        ParentStudentRelationship(
                            parent_user_id=user.id,
                            student_user_id=student.id,
                            relationship_type=req.relationship_type or "guardian",
                            verification_status="pending",
                        )
                    )

        if institution_id:
            db.add(
                InstitutionMembership(
                    institution_id=institution_id,
                    user_id=user.id,
                    membership_role=req.role.value,
                    status="active",
                )
            )

        await db.commit()
        await db.refresh(user)

        tokens = await cls.generate_tokens_for_user(db, user)
        return user, tokens

    @classmethod
    async def login(cls, db: AsyncSession, req: LoginRequest) -> Tuple[User, TokenData]:
        normalized_email = req.email.lower().strip()
        user = await cls.get_user_by_email(db, normalized_email)

        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials.",
            )

        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials.",
            )

        if not user.is_active or user.account_status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact your institution administrator.",
            )

        tokens = await cls.generate_tokens_for_user(db, user)
        return user, tokens

    @classmethod
    async def login_with_firebase(
        cls, db: AsyncSession, req: FirebaseLoginRequest
    ) -> Tuple[User, TokenData]:
        claims = firebase_service.verify_firebase_id_token(req.id_token)
        if not claims or "uid" not in claims:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase ID token.",
            )

        uid = claims["uid"]
        email = claims.get("email", f"{uid}@firebase.eduverse.io").lower()
        full_name = req.full_name or claims.get("name", "Firebase User")

        # Authoritative lookup in PostgreSQL
        res = await db.execute(
            select(User)
            .options(
                selectinload(User.institution),
                selectinload(User.student_profile),
                selectinload(User.teacher_profile),
                selectinload(User.parent_profile),
            )
            .where((User.firebase_uid == uid) | (User.email == email))
        )
        user = res.scalar_one_or_none()

        if not user:
            # First-time registration with selected role
            role = req.role or UserRole.STUDENT
            user = User(
                email=email,
                firebase_uid=uid,
                full_name=full_name,
                role=role,
                is_active=True,
                is_verified=True,
                account_status="active",
                email_verified=claims.get("email_verified", True),
            )
            db.add(user)
            await db.flush()

            if role == UserRole.STUDENT:
                db.add(StudentProfile(user_id=user.id))
            elif role == UserRole.TEACHER:
                db.add(TeacherProfile(user_id=user.id))
            elif role == UserRole.PARENT:
                db.add(ParentProfile(user_id=user.id))

            await db.commit()
            await db.refresh(user)
        else:
            if not user.firebase_uid:
                user.firebase_uid = uid
                await db.commit()

        if not user.is_active or user.account_status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is deactivated.",
            )

        tokens = await cls.generate_tokens_for_user(db, user)
        return user, tokens

    @classmethod
    async def refresh_tokens(cls, db: AsyncSession, refresh_token: str) -> TokenData:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        user_id = payload.get("sub")
        user = await cls.get_user_by_id(db, user_id)

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer active or exists.",
            )

        if user.refresh_token != refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked or superseded.",
            )

        return await cls.generate_tokens_for_user(db, user)

    @classmethod
    async def logout(cls, db: AsyncSession, user: User) -> None:
        user.refresh_token = None
        await db.commit()


auth_service = AuthService()
