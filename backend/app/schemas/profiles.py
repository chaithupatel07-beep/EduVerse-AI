from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from datetime import datetime
from app.models.user import UserRole


class StudentProfileData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    student_identifier: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None
    program: Optional[str] = None
    gpa: Optional[float] = None


class TeacherProfileData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    employee_identifier: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    office_hours: Optional[str] = None


class ParentProfileData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    contact_number: Optional[str] = None
    occupation: Optional[str] = None
    preferred_language: str = "en"


class UserProfileDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    firebase_uid: Optional[str] = None
    account_status: str = "active"
    email_verified: bool = False
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Role specific profile extensions
    student_profile: Optional[StudentProfileData] = None
    teacher_profile: Optional[TeacherProfileData] = None
    parent_profile: Optional[ParentProfileData] = None


class RegisterProfileRequest(BaseModel):
    id_token: Optional[str] = None  # Firebase ID token if registering via Firebase
    email: EmailStr
    password: Optional[str] = None  # Optional if Firebase manages password
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole
    institution_code: Optional[str] = None
    phone: Optional[str] = None

    # Role specific registration inputs
    student_id: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None
    program: Optional[str] = None

    employee_id: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None

    linked_student_email: Optional[str] = None
    relationship_type: Optional[str] = "guardian"

    invitation_code: Optional[str] = None  # Admin verification code


class ParentStudentRelationshipRequest(BaseModel):
    student_email: EmailStr
    relationship_type: str = "guardian"  # mother, father, guardian
    notes: Optional[str] = None


class ParentStudentRelationshipVerify(BaseModel):
    relationship_id: str
    decision: str = "verified"  # verified or rejected
    notes: Optional[str] = None


class ParentStudentRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    parent_user_id: str
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    student_user_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    relationship_type: str
    verification_status: str
    verified_at: Optional[str] = None
    created_at: datetime
