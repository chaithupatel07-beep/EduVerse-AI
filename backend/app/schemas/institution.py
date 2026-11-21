from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class InstitutionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "Global"
    contact_email: Optional[EmailStr] = None
    official_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    institution_type: str = "university"


class InstitutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    code: str
    description: Optional[str] = None
    city: Optional[str] = None
    country: str
    contact_email: Optional[str] = None
    official_email: Optional[str] = None
    institution_type: str
    verification_status: str
    is_active: bool
    created_at: datetime


class InstitutionInvitationRequest(BaseModel):
    email: EmailStr
    role: str = "teacher"  # teacher, student, admin
    department: Optional[str] = None
