"""
EduVerse AI - Personalization Pydantic Schemas (Phase 5)
Schemas for Learning Profiles, Topic Mastery, Knowledge Gaps, Study Plans,
Recommendations, and Adaptive Learning.
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class StudentLearningProfileResponse(BaseModel):
    student_id: str
    student_name: str
    overall_gpa: float
    quiz_average: float
    assignment_average: float
    attendance_rate: float
    quizzes_completed: int
    assignments_completed: int
    learning_streak_days: int
    learning_pace: str
    subject_performance: Dict[str, Any]
    topic_strengths: List[str]
    topic_weaknesses: List[str]
    learning_goals: List[Dict[str, Any]]
    recommended_focus_areas: List[str]
    last_analyzed_at: str


class KnowledgeGapResponse(BaseModel):
    id: str
    subject_id: str
    subject_name: Optional[str] = None
    topic_name: str
    classification: str
    confidence_score: float
    evidence_summary: str
    root_cause_reason: Optional[str] = None
    suggested_action: str
    related_material_id: Optional[str] = None
    is_resolved: bool
    accuracy_percentage: float
    last_assessment_date: Optional[str] = None


class StudyPlanActivityResponse(BaseModel):
    id: str
    topic_name: str
    activity_type: str
    title: str
    instructions: Optional[str] = None
    priority: str
    estimated_duration_minutes: int
    recommended_material_id: Optional[str] = None
    recommended_material_title: Optional[str] = None
    is_completed: bool
    completed_at: Optional[str] = None
    order_index: int


class StudyPlanResponse(BaseModel):
    id: str
    title: str
    learning_objective: str
    target_start_date: str
    target_end_date: str
    total_estimated_minutes: int
    completion_percentage: float
    status: str
    activities: List[StudyPlanActivityResponse] = []
    created_at: str


class StudyPlanGenerateRequest(BaseModel):
    custom_goal: Optional[str] = None
    duration_days: int = Field(default=7, ge=1, le=30)


class StudyPlanActivityStatusUpdate(BaseModel):
    is_completed: bool


class ResourceRecommendationResponse(BaseModel):
    id: str
    material_id: str
    material_title: str
    file_type: str
    file_path: str
    download_count: int
    recommendation_reason: str
    confidence_score: float
    created_at: str


class RecommendationFeedbackRequest(BaseModel):
    recommendation_id: str
    is_helpful: bool
    comments: Optional[str] = None


class AdaptiveSessionStartRequest(BaseModel):
    subject_id: str
    topic_name: str


class AdaptiveSessionStartResponse(BaseModel):
    session_id: str
    topic_name: str
    starting_level: str
    current_level: str
    questions: List[Dict[str, Any]]
    total_questions: int


class AdaptiveSessionSubmitRequest(BaseModel):
    session_id: str
    answers: Dict[str, int]  # question_id -> option_index


class AdaptiveSessionSubmitResponse(BaseModel):
    session_id: str
    topic_name: str
    starting_level: str
    score_percentage: float
    correct_answers: int
    total_questions: int
    next_calibrated_level: str
    difficulty_action: str
    evaluations: List[Dict[str, Any]]
