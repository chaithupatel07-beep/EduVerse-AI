"""
EduVerse AI - Analytics & ML Pydantic Schemas (Phase 5)
Schemas for Performance Trends, Class Analytics, Institution Reporting, and ML Predictions.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class StudentTrendAnalyticsResponse(BaseModel):
    student_id: str
    overall_attendance_rate: float
    quiz_timeline: List[Dict[str, Any]]
    assignment_timeline: List[Dict[str, Any]]
    total_assessments: int


class ClassLevelAnalyticsResponse(BaseModel):
    class_id: str
    class_name: str
    total_students: int
    class_average_quiz: float
    class_average_attendance: float
    at_risk_students: List[Dict[str, Any]]
    common_learning_gaps: List[Dict[str, Any]]


class InstitutionAnalyticsResponse(BaseModel):
    institution_id: str
    total_students: int
    total_teachers: int
    total_departments: int
    total_courses: int
    institution_average_score: float
    institution_average_attendance: float
    department_breakdown: List[Dict[str, Any]]


class AcademicPredictionResponse(BaseModel):
    student_id: str
    model_version: str
    predicted_gpa_range: str
    predicted_success_score: float
    confidence_interval: str
    confidence_score: float
    contributing_factors: Dict[str, Any]
    suggested_interventions: List[str]
    is_rule_based: bool = False
    data_sufficiency: str = "sufficient"  # "sufficient", "insufficient_data", "no_data"
    methodology: str = "scikit_learn_ml_regression"  # "scikit_learn_ml_regression", "rule_based_provisional", "no_data_baseline"
    transparency_notice: Optional[str] = None
    data_points_count: Optional[Dict[str, int]] = None
    missing_requirements: Optional[List[str]] = None
    created_at: str


class MLModelStatusResponse(BaseModel):
    model_name: str
    model_version: str
    algorithm_type: str
    is_trained: bool
    metrics: Dict[str, float]
    feature_importances: Dict[str, float]
    sample_size: int
