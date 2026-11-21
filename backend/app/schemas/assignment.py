from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AssignmentBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5)
    instructions: Optional[str] = None
    class_id: str
    subject_id: Optional[str] = None
    max_marks: float = Field(100.0, gt=0)
    due_date: datetime
    allowed_formats: str = "pdf,docx,zip,txt"
    attachment_url: Optional[str] = None
    status: str = "published"  # 'draft', 'published', 'archived'


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    max_marks: Optional[float] = None
    due_date: Optional[datetime] = None
    allowed_formats: Optional[str] = None
    status: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    id: str
    institution_id: str
    teacher_id: str
    teacher_name: Optional[str] = None
    class_name: Optional[str] = None
    subject_title: Optional[str] = None
    total_submissions: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Submission Schemas
class SubmissionCreate(BaseModel):
    assignment_id: str
    submission_text: Optional[str] = None


class SubmissionEvaluate(BaseModel):
    marks_obtained: float = Field(..., ge=0)
    feedback: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    assignment_title: Optional[str] = None
    max_marks: Optional[float] = None
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    submission_text: Optional[str] = None
    file_name: Optional[str] = None
    file_size: int = 0
    status: str  # 'submitted', 'late', 'under_evaluation', 'evaluated'
    submitted_at: datetime
    marks_obtained: Optional[float] = None
    feedback: Optional[str] = None
    evaluated_by: Optional[str] = None
    evaluator_name: Optional[str] = None
    evaluated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
