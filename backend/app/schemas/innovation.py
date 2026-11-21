"""
EduVerse AI - Phase 6.5 Innovation Schemas
Pydantic v2 schemas for all innovation features:
- AI Smart Examination Simulator
- Smart Notes Scanner & OCR Doubt Solver
- AI Smart Timetable & Scheduler
- Gamification & Verified Achievements
- Visual Knowledge Map
- Early-Warning & Intervention System
- Voice Multilingual Assistant
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# 1. AI Smart Examination Simulator Schemas
# ============================================================================

class MockExamQuestionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    question_text: str
    question_type: str = "mcq"  # mcq, true_false, fill_blank, short_answer, descriptive
    section: str = "Section A"
    order_index: int = 1
    marks: float = 1.0
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    topic_tag: Optional[str] = None
    cognitive_level: Optional[str] = "understand"


class MockExamGenerateRequest(BaseModel):
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    title: str = "Comprehensive Mock Examination"
    topic_focus: Optional[str] = "Core Semester Syllabus"
    difficulty_level: str = "medium"  # easy, medium, hard, adaptive
    duration_minutes: int = Field(default=45, ge=10, le=180)
    total_marks: float = Field(default=50.0, ge=10.0, le=200.0)
    question_types: List[str] = Field(default=["mcq", "true_false", "short_answer", "descriptive"])
    language: str = "en"  # en, te, hi


class MockExamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    created_by: str
    class_id: Optional[str] = None
    subject_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    topic_focus: Optional[str] = None
    difficulty_level: str
    duration_minutes: int
    total_marks: float
    passing_percentage: float
    language: str
    question_types: List[str]
    is_published: bool
    questions: List[MockExamQuestionSchema] = []
    created_at: datetime


class MockExamAttemptStartRequest(BaseModel):
    exam_id: str


class StudentAnswerSubmission(BaseModel):
    question_id: str
    student_answer: str


class MockExamAttemptSubmitRequest(BaseModel):
    time_taken_seconds: int = Field(default=0, ge=0)
    answers: List[StudentAnswerSubmission] = []


class MockExamAnswerResultSchema(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    student_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    marks_awarded: float
    max_marks: float
    explanation: Optional[str] = None
    ai_feedback: Optional[str] = None


class MockExamAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    exam_id: str
    student_id: str
    status: str
    total_score: float
    max_possible_score: float
    percentage: float
    accuracy_percentage: float
    time_taken_seconds: int
    passed: bool
    subject_breakdown: Dict[str, Any] = {}
    topic_breakdown: Dict[str, Any] = {}
    ai_feedback_summary: Optional[str] = None
    recommended_revision_topics: List[str] = []
    started_at: datetime
    submitted_at: Optional[datetime] = None
    detailed_answers: List[MockExamAnswerResultSchema] = []


# ============================================================================
# 2. Smart Notes Scanner & OCR Doubt Solver Schemas
# ============================================================================

class OCRProcessRequest(BaseModel):
    document_id: str
    language: Optional[str] = "en"  # en, te, hi


class OCREditTextRequest(BaseModel):
    edited_text: str = Field(..., min_length=5)


class OCRDoubtAskRequest(BaseModel):
    question: str = Field(..., min_length=3)
    language: str = "en"


class OCRQuizGenerateRequest(BaseModel):
    num_questions: int = Field(default=4, ge=1, le=10)
    language: str = "en"


class ScannedDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    student_id: str
    subject_id: Optional[str] = None
    title: str
    document_type: str
    file_name: str
    file_size: int
    mime_type: str
    detected_language: str
    ocr_status: str
    ocr_confidence: float
    is_indexed_in_rag: bool
    raw_text: Optional[str] = None
    cleaned_text: Optional[str] = None
    user_edited_text: Optional[str] = None
    summary: Optional[str] = None
    extracted_key_concepts: List[str] = []
    created_at: datetime


class OCRDoubtAskResponse(BaseModel):
    document_id: str
    question: str
    answer: str
    language: str
    citations: List[str] = []
    confidence: float = 0.95


# ============================================================================
# 3. AI Smart Timetable & Study Scheduler Schemas
# ============================================================================

class StudyTimetableGenerateRequest(BaseModel):
    daily_available_hours: float = Field(default=3.0, ge=1.0, le=12.0)
    optimization_goal: str = Field(default="exam_prep")  # gap_remediation, exam_prep, balanced
    days_ahead: int = Field(default=7, ge=3, le=30)
    subject_priority_ids: Optional[List[str]] = None


class StudySessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timetable_id: str
    subject_name: str
    topic_name: str
    session_type: str
    day_of_week: str
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    priority: str
    linked_gap_id: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    missed_and_rescheduled: bool


class StudyTimetableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    schedule_title: str
    start_date: date
    end_date: date
    daily_available_hours: float
    status: str
    optimization_goal: str
    ai_generated_notes: Optional[str] = None
    sessions: List[StudySessionResponse] = []
    created_at: datetime


# ============================================================================
# 4. Gamification & Verified Achievements Schemas
# ============================================================================

class BadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    badge_code: str
    name: str
    description: str
    category: str
    icon: str
    xp_reward: int
    criteria_summary: str


class EarnedBadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    badge_id: str
    badge: BadgeResponse
    earned_at: datetime
    evidence_note: Optional[str] = None


class GamificationProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    total_xp: int
    current_level: int
    level_title: str
    streak_days: int
    longest_streak_days: int
    daily_goal_xp: int
    today_xp: int
    leaderboard_opt_in: bool
    earned_badges: List[EarnedBadgeResponse] = []
    recent_transactions: List[Dict[str, Any]] = []


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    display_name: str
    total_xp: int
    current_level: int
    level_title: str
    streak_days: int


# ============================================================================
# 5. Visual Knowledge Map Schemas
# ============================================================================

class KnowledgeNodeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    subject_id: Optional[str] = None
    node_type: str
    label: str
    description: Optional[str] = None
    difficulty: str
    estimated_hours: float
    pos_x: float
    pos_y: float
    mastery_state: str = "in_progress"  # mastered, in_progress, needs_attention, unvisited
    mastery_score: float = 0.5


class KnowledgeEdgeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_node_id: str
    target_node_id: str
    relationship_type: str
    weight: float


class KnowledgeMapGraphResponse(BaseModel):
    nodes: List[KnowledgeNodeSchema]
    edges: List[KnowledgeEdgeSchema]
    mastery_summary: Dict[str, int]


class KnowledgeNodeDetailResponse(BaseModel):
    node: KnowledgeNodeSchema
    prerequisites: List[KnowledgeNodeSchema] = []
    unlocked_topics: List[KnowledgeNodeSchema] = []
    related_study_materials: List[Dict[str, Any]] = []
    recommended_activities: List[Dict[str, Any]] = []


# ============================================================================
# 6. Intelligent Early-Warning & Intervention Schemas
# ============================================================================

class EarlyWarningAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    student_id: str
    student_name: Optional[str] = None
    class_id: Optional[str] = None
    risk_level: str
    alert_category: str
    title: str
    evidence_summary: str
    recommended_intervention: str
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    created_at: datetime


class CreateInterventionActionRequest(BaseModel):
    alert_id: str
    student_id: str
    action_type: str = "remedial_session"  # remedial_session, parent_conference, study_plan_adjustment, peer_tutoring
    notes: Optional[str] = None
    scheduled_for: Optional[datetime] = None


class UpdateInterventionStatusRequest(BaseModel):
    status: str = "completed"  # assigned, in_progress, completed, outcome_evaluated
    notes: Optional[str] = None
    outcome_evaluation: Optional[str] = "improved"  # improved, stable, needs_further_support


class InterventionRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    alert_id: str
    assigned_teacher_id: str
    student_id: str
    student_name: Optional[str] = None
    action_type: str
    status: str
    notes: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    outcome_evaluation: Optional[str] = None
    created_at: datetime


class StudentEarlyWarningSummary(BaseModel):
    student_id: str
    student_name: str
    overall_academic_risk: str  # low, watch, moderate, high
    active_alerts_count: int
    alerts: List[EarlyWarningAlertResponse] = []
    recent_interventions: List[InterventionRecordResponse] = []
    parent_supportive_advice: Dict[str, str] = {}  # en, te, hi


# ============================================================================
# 7. Voice Multilingual AI Schemas
# ============================================================================

class VoiceProcessRequest(BaseModel):
    audio_transcript: str = Field(..., min_length=1)
    detected_language: Optional[str] = "en"
    target_language: Optional[str] = "en"
    role: str = "student"  # student, parent, teacher
    context_id: Optional[str] = None  # student_id or conversation_id


class VoiceProcessResponse(BaseModel):
    query_transcript: str
    query_language: str
    response_text: str
    response_language: str
    audio_speech_config: Dict[str, Any]
    provider: str
