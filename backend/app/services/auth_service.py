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
from app.schemas.auth import (
    AuthResponseData,
    FirebaseLoginRequest,
    LoginRequest,
    RegisterRequest,
    TokenData,
)
from app.schemas.user import UserResponse
from app.services.firebase_service import firebase_service


class AuthService:
    """Authentication and User Lifecycle Business Service."""

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User).options(selectinload(User.institution)).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(
            select(User).options(selectinload(User.institution)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def build_user_response(cls, db: AsyncSession, user: User) -> UserResponse:
        institution_name = user.institution.name if user.institution else None
        child_ids: List[str] = []

        if user.role == UserRole.PARENT:
            res = await db.execute(
                select(ParentStudentLink.student_id).where(ParentStudentLink.parent_id == user.id)
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
                select(Institution).where(Institution.code == req.institution_code.strip())
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
        )

        db.add(user)
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

        if not user.is_active:
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

        # Find user by firebase_uid or email
        res = await db.execute(
            select(User).where((User.firebase_uid == uid) | (User.email == email))
        )
        user = res.scalar_one_or_none()

        if not user:
            # Register user automatically on first Firebase sign in
            role = req.role or UserRole.STUDENT
            user = User(
                email=email,
                firebase_uid=uid,
                full_name=full_name,
                role=role,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            if not user.firebase_uid:
                user.firebase_uid = uid
                await db.commit()

        if not user.is_active:
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
