from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from app.models.user import UserRole


class InstitutionBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    grade_level: Optional[str] = None
    subject_specialization: Optional[str] = None
    child_ids: Optional[List[str]] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500)
    grade_level: Optional[str] = Field(None, max_length=100)
    subject_specialization: Optional[str] = Field(None, max_length=200)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)
