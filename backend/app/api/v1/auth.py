from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthResponseData,
    FirebaseLoginRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenData,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[AuthResponseData], status_code=status.HTTP_201_CREATED)
async def register_user(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new student, teacher, parent, or admin."""
    user, tokens = await auth_service.register(db, request)
    user_response = await auth_service.build_user_response(db, user)
    return ApiResponse(
        success=True,
        message=f"User account created successfully as {user.role.value}.",
        data=AuthResponseData(tokens=tokens, user=user_response),
    )


@router.post("/login", response_model=ApiResponse[AuthResponseData])
async def login_user(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with email and password."""
    user, tokens = await auth_service.login(db, request)
    user_response = await auth_service.build_user_response(db, user)
    return ApiResponse(
        success=True,
        message="Login successful.",
        data=AuthResponseData(tokens=tokens, user=user_response),
    )


@router.post("/firebase-login", response_model=ApiResponse[AuthResponseData])
async def login_with_firebase(
    request: FirebaseLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate using Firebase Authentication ID token."""
    user, tokens = await auth_service.login_with_firebase(db, request)
    user_response = await auth_service.build_user_response(db, user)
    return ApiResponse(
        success=True,
        message="Firebase authentication successful.",
        data=AuthResponseData(tokens=tokens, user=user_response),
    )


@router.post("/refresh", response_model=ApiResponse[TokenData])
async def refresh_access_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rotate and refresh access token using valid refresh token."""
    tokens = await auth_service.refresh_tokens(db, request.refresh_token)
    return ApiResponse(
        success=True,
        message="Tokens refreshed successfully.",
        data=tokens,
    )


@router.post("/logout", response_model=ApiResponse[None])
async def logout_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate current session refresh token."""
    await auth_service.logout(db, current_user)
    return ApiResponse(
        success=True,
        message="Logged out successfully.",
        data=None,
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve currently authenticated user profile."""
    user_response = await auth_service.build_user_response(db, current_user)
    return ApiResponse(
        success=True,
        message="Current user profile retrieved.",
        data=user_response,
    )
