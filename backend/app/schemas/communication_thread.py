"""
EduVerse AI - Multilingual Parent-Teacher-Management Communication Schemas (Phase 4)
"""
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class CommunicationMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    original_language: str = Field(default="en", description="en, te, hi")


class CommunicationMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    thread_id: str
    sender_id: str
    sender_role: str
    sender_name: Optional[str] = None
    content: str
    original_language: str
    translated_content: Optional[str] = None
    target_language: Optional[str] = None
    is_read: bool
    created_at: datetime


class CommunicationThreadCreate(BaseModel):
    thread_type: str = Field(default="parent_teacher", description="parent_teacher, parent_management")
    category: str = Field(
        default="academic_concerns",
        description="academic_concerns, attendance_issues, assignment_queries, examination_queries, administrative_concerns, general_requests"
    )
    student_id: Optional[str] = None
    recipient_id: Optional[str] = None  # Specific teacher ID or Admin ID
    subject: str = Field(..., min_length=3, max_length=255)
    initial_message: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(default="en", description="en, te, hi")
    priority: str = Field(default="normal", description="low, normal, high, urgent")


class CommunicationThreadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    thread_type: str
    category: str
    parent_id: str
    parent_name: Optional[str] = None
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    recipient_id: Optional[str] = None
    recipient_name: Optional[str] = None
    subject: str
    status: str  # pending, in_review, resolved, closed
    priority: str
    created_at: datetime
    updated_at: datetime
    messages: List[CommunicationMessageResponse] = []
    unread_count: int = 0


class ThreadStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|in_review|resolved|closed)$")


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_language: Optional[str] = "auto"
    target_language: str = Field(..., pattern="^(en|te|hi)$")


class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    engine: str = "EduVerse AI Translation Engine"
