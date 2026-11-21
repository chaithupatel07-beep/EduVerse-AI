from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.STUDENT
    phone: Optional[str] = None
    institution_code: Optional[str] = None
    grade_level: Optional[str] = None  # Relevant for Student
    subject_specialization: Optional[str] = None  # Relevant for Teacher


class FirebaseLoginRequest(BaseModel):
    id_token: str
    role: Optional[UserRole] = None
    full_name: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # in seconds


class AuthResponseData(BaseModel):
    tokens: TokenData
    user: UserResponse


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
