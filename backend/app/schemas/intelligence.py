"""
EduVerse AI - Phase 6 Pydantic Schemas
Defines request and response schemas for:
  - Teacher AI Copilot (Lesson Plans, Question Papers, Evaluation Assistance, Teaching Aids, Remedial Guidance)
  - Parent Intelligence (Progress Reports, Meetings)
  - Integrated Notifications & Preferences
  - Admin Intelligence (Institutional Reports, Communication Analytics, Request Assignment)
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============================================================================
# 1. TEACHER AI COPILOT SCHEMAS
# ============================================================================

class LessonPlanGenerateRequest(BaseModel):
    subject: str = Field(..., description="Subject name e.g. Mathematics, Physics")
    grade: str = Field(default="Grade 10", description="Grade or semester level")
    topic: str = Field(..., description="Curriculum topic to teach")
    duration: int = Field(default=45, ge=15, le=180, description="Duration in minutes")
    learning_level: str = Field(default="mixed", description="foundational, intermediate, advanced, mixed")
    objectives: Optional[List[str]] = Field(default=None, description="Custom learning objectives if provided")
    language: str = Field(default="en", description="en, te, hi")
    class_id: Optional[str] = None
    subject_id: Optional[str] = None


class LessonPlanUpdateRequest(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    grade_level: Optional[str] = None
    duration_minutes: Optional[int] = None
    learning_level: Optional[str] = None
    status: Optional[str] = None  # draft, reviewed, approved, published
    content_json: Optional[Dict[str, Any]] = None
    language: Optional[str] = None


class LessonPlanResponse(BaseModel):
    id: str
    teacher_id: str
    institution_id: str
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    title: str
    topic: str
    grade_level: str
    duration_minutes: int
    learning_level: str
    status: str
    language: str
    content_json: Dict[str, Any]
    created_at: str
    updated_at: str


class QuestionPaperGenerateRequest(BaseModel):
    subject: str
    class_id: Optional[str] = None
    subject_id: Optional[str] = None
    topics: List[str] = Field(..., min_length=1, description="List of topics covered")
    total_marks: float = Field(default=100.0, gt=0)
    duration_minutes: int = Field(default=180, ge=30, le=360)
    difficulty_level: str = Field(default="medium", description="easy, medium, hard, balanced")
    question_types: Optional[List[str]] = Field(
        default=["mcq", "short_answer", "long_answer", "application_based"],
        description="Types of questions to synthesize",
    )
    language: str = Field(default="en", description="en, te, hi")


class QuestionPaperUpdateRequest(BaseModel):
    title: Optional[str] = None
    total_marks: Optional[float] = None
    duration_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None
    status: Optional[str] = None  # draft, reviewed, approved, published
    sections_data: Optional[List[Dict[str, Any]]] = None
    answer_key_data: Optional[Dict[str, Any]] = None
    marking_guidelines: Optional[str] = None


class QuestionPaperResponse(BaseModel):
    id: str
    teacher_id: str
    institution_id: str
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    title: str
    topics_json: List[str]
    total_marks: float
    duration_minutes: int
    difficulty_level: str
    status: str
    language: str
    sections_data: List[Dict[str, Any]]
    answer_key_data: Dict[str, Any]
    marking_guidelines: Optional[str] = None
    created_at: str
    updated_at: str


class TeachingMaterialAssistRequest(BaseModel):
    material_type: str = Field(..., description="summary, classroom_examples, revision_notes, differentiated_explanation")
    topic: str
    subject: str
    notes_text: Optional[str] = None
    target_learning_level: str = Field(default="intermediate", description="beginner, intermediate, advanced")
    language: str = Field(default="en", description="en, te, hi")


class TeachingMaterialAssistResponse(BaseModel):
    material_type: str
    topic: str
    subject: str
    language: str
    content: str
    bullet_points: List[str]
    examples: List[str]


class RemedialSuggestionsResponse(BaseModel):
    class_id: str
    class_name: str
    total_at_risk_students: int
    common_knowledge_gaps: List[Dict[str, Any]]
    remedial_actions: List[Dict[str, Any]]
    student_interventions: List[Dict[str, Any]]


class EvaluationSuggestionResponse(BaseModel):
    id: str
    submission_id: str
    teacher_id: str
    suggested_marks: float
    max_marks: float
    confidence_score: float
    correct_concepts: List[str]
    missing_key_points: List[str]
    suggested_feedback: str
    misunderstandings: List[str]
    recommended_revision_topics: List[str]
    status: str
    teacher_approved_marks: Optional[float] = None
    teacher_final_feedback: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str


class EvaluationApprovalRequest(BaseModel):
    decision: str = Field(default="approved", description="approved, rejected, teacher_reviewed")
    teacher_approved_marks: float = Field(..., ge=0)
    teacher_final_feedback: str = Field(..., min_length=2)


# ============================================================================
# 2. PARENT INTELLIGENCE & MEETING SCHEMAS
# ============================================================================

class ParentReportGenerateRequest(BaseModel):
    student_id: str
    report_type: str = Field(default="weekly_summary", description="weekly_summary, monthly_overview")
    language: str = Field(default="en", description="en, te, hi")


class ParentReportResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    report_type: str
    language: str
    summary_text: str
    strengths: List[str]
    improvements_needed: List[str]
    parental_support_recommendations: List[str]
    metrics_snapshot: Dict[str, Any]
    created_at: str


class MeetingRequestCreate(BaseModel):
    teacher_id: str
    student_id: str
    requested_date: str = Field(..., description="YYYY-MM-DD or readable date")
    preferred_time_slot: str = Field(..., description="e.g. 10:00 AM - 10:30 AM")
    subject: str = Field(..., min_length=3)
    reason: str = Field(..., min_length=5)
    meeting_type: str = Field(default="in_person", description="in_person, online_video, phone_call")


class MeetingStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="requested, confirmed, rescheduled, completed, cancelled")
    teacher_notes: Optional[str] = None
    meeting_link: Optional[str] = None
    new_date: Optional[str] = None
    new_time_slot: Optional[str] = None


class MeetingRequestResponse(BaseModel):
    id: str
    parent_id: str
    parent_name: Optional[str] = None
    teacher_id: str
    teacher_name: Optional[str] = None
    student_id: str
    student_name: Optional[str] = None
    institution_id: str
    requested_date: str
    preferred_time_slot: str
    subject: str
    reason: str
    meeting_type: str
    status: str
    teacher_notes: Optional[str] = None
    meeting_link: Optional[str] = None
    created_at: str
    updated_at: str


# ============================================================================
# 3. NOTIFICATION SYSTEM SCHEMAS
# ============================================================================

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: str


class NotificationPreferenceResponse(BaseModel):
    id: str
    user_id: str
    email_alerts: bool
    assignment_updates: bool
    quiz_reminders: bool
    academic_alerts: bool
    communication_messages: bool
    preferred_language: str
    updated_at: str


class NotificationPreferenceUpdateRequest(BaseModel):
    email_alerts: Optional[bool] = None
    assignment_updates: Optional[bool] = None
    quiz_reminders: Optional[bool] = None
    academic_alerts: Optional[bool] = None
    communication_messages: Optional[bool] = None
    preferred_language: Optional[str] = None


# ============================================================================
# 4. INSTITUTION ADMIN INTELLIGENCE SCHEMAS
# ============================================================================

class CommunicationAnalyticsResponse(BaseModel):
    institution_id: str
    total_threads: int
    pending_threads: int
    in_review_threads: int
    resolved_threads: int
    closed_threads: int
    resolution_rate_percentage: float
    average_resolution_hours: float
    category_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    unresolved_alerts: List[Dict[str, Any]]


class RequestAssignmentUpdate(BaseModel):
    assigned_staff_id: str
    priority: Optional[str] = None
    status: Optional[str] = "in_review"
    admin_notes: Optional[str] = None


class InstitutionalReportGenerateRequest(BaseModel):
    report_type: str = Field(
        ...,
        description="monthly_academic, department_performance, attendance_summary, communication_resolution, knowledge_gap_overview",
    )
    period: str = Field(default="Current Term 2026")
    language: str = Field(default="en", description="en, te, hi")


class InstitutionalReportResponse(BaseModel):
    id: str
    institution_id: str
    generated_by: str
    report_type: str
    title: str
    period: str
    summary: str
    data_json: Dict[str, Any]
    language: str
    created_at: str
