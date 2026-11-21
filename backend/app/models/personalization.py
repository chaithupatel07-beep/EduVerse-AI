"""
EduVerse AI - Personalization & Adaptive Learning Database Models (Phase 5)
Covers Student Learning Profiles, Topic Mastery, Knowledge Gaps, Study Plans,
Study Plan Activities, Resource Recommendations, and Adaptive Learning Sessions.
"""
from datetime import datetime, timezone
import uuid
from typing import Optional, List
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class StudentLearningProfile(Base):
    """
    Cumulative learning profile aggregating academic performance,
    topic mastery metrics, and activity indicators for a student.
    """
    __tablename__ = "student_learning_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)

    overall_gpa = Column(Float, default=0.0, nullable=False)
    quiz_average = Column(Float, default=0.0, nullable=False)
    assignment_average = Column(Float, default=0.0, nullable=False)
    attendance_rate = Column(Float, default=0.0, nullable=False)
    quizzes_completed = Column(Integer, default=0, nullable=False)
    assignments_completed = Column(Integer, default=0, nullable=False)
    learning_streak_days = Column(Integer, default=1, nullable=False)
    learning_pace = Column(String(50), default="moderate", nullable=False)  # slow, moderate, fast, accelerated

    # Aggregated JSON metadata for subject breakdown and personalized goals
    subject_performance_json = Column(JSON, default=dict, nullable=False)
    learning_goals_json = Column(JSON, default=list, nullable=False)
    recommended_focus_areas = Column(JSON, default=list, nullable=False)

    last_analyzed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id], backref="learning_profile", lazy="selectin")
    institution = relationship("Institution", lazy="selectin")


class TopicMasteryRecord(Base):
    """
    Tracks topic-level mastery per student based on question responses.
    """
    __tablename__ = "topic_mastery_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_name = Column(String(200), nullable=False, index=True)

    mastery_level = Column(String(50), default="beginner", nullable=False)  # beginner, intermediate, advanced
    mastery_percentage = Column(Float, default=0.0, nullable=False)
    total_questions_attempted = Column(Integer, default=0, nullable=False)
    total_correct_answers = Column(Integer, default=0, nullable=False)
    last_assessed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "topic_name", name="uq_student_topic_mastery"),
        Index("idx_student_topic_level", "student_id", "mastery_level"),
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    subject = relationship("Subject", lazy="selectin")


class KnowledgeGap(Base):
    """
    Identified academic knowledge gap with evidence, severity classification, and suggested action.
    """
    __tablename__ = "knowledge_gaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_name = Column(String(200), nullable=False)

    # 5 standard classification states
    classification = Column(
        String(50),
        default="needs_improvement",
        nullable=False,
        index=True,
    )  # strong_understanding, good_understanding, needs_improvement, requires_immediate_revision, insufficient_assessment_data

    confidence_score = Column(Float, default=0.75, nullable=False)  # 0.0 to 1.0 confidence in detection
    evidence_summary = Column(Text, nullable=False)
    root_cause_reason = Column(Text, nullable=True)
    suggested_action = Column(Text, nullable=False)
    related_material_id = Column(String(36), ForeignKey("study_materials.id", ondelete="SET NULL"), nullable=True)

    is_resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_kg_student_unresolved", "student_id", "is_resolved"),
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    subject = relationship("Subject", lazy="selectin")
    related_material = relationship("StudyMaterial", lazy="selectin")


class StudyPlan(Base):
    """
    Dynamic personalized study plan generated for a student.
    """
    __tablename__ = "study_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    learning_objective = Column(Text, nullable=False)
    target_start_date = Column(Date, nullable=False)
    target_end_date = Column(Date, nullable=False)
    total_estimated_minutes = Column(Integer, default=120, nullable=False)
    completion_percentage = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, completed, archived

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    course = relationship("Course", lazy="selectin")
    activities = relationship("StudyPlanActivity", back_populates="study_plan", cascade="all, delete-orphan", lazy="selectin", order_by="StudyPlanActivity.order_index")


class StudyPlanActivity(Base):
    """
    Individual learning or revision task in a study plan.
    """
    __tablename__ = "study_plan_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_plan_id = Column(String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)

    topic_name = Column(String(200), nullable=False)
    activity_type = Column(String(50), default="reading", nullable=False)  # reading, revision, practice_quiz, exercise
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=True)
    priority = Column(String(20), default="medium", nullable=False)  # high, medium, low
    estimated_duration_minutes = Column(Integer, default=30, nullable=False)

    recommended_material_id = Column(String(36), ForeignKey("study_materials.id", ondelete="SET NULL"), nullable=True)
    practice_questions_json = Column(JSON, default=list, nullable=True)

    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    study_plan = relationship("StudyPlan", back_populates="activities", lazy="selectin")
    subject = relationship("Subject", lazy="selectin")
    recommended_material = relationship("StudyMaterial", lazy="selectin")


class ResourceRecommendation(Base):
    """
    Content-based recommendations connecting weak topics to study materials.
    """
    __tablename__ = "resource_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    knowledge_gap_id = Column(String(36), ForeignKey("knowledge_gaps.id", ondelete="SET NULL"), nullable=True)

    recommendation_reason = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.85, nullable=False)
    viewed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    material = relationship("StudyMaterial", lazy="selectin")
    knowledge_gap = relationship("KnowledgeGap", lazy="selectin")
    feedback = relationship("RecommendationFeedback", back_populates="recommendation", cascade="all, delete-orphan", lazy="selectin")


class RecommendationFeedback(Base):
    """
    Student feedback on resource recommendations for system evaluation.
    """
    __tablename__ = "recommendation_feedback"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recommendation_id = Column(String(36), ForeignKey("resource_recommendations.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    is_helpful = Column(Boolean, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    recommendation = relationship("ResourceRecommendation", back_populates="feedback", lazy="selectin")
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")


class AdaptiveLearningSession(Base):
    """
    Adaptive practice quiz session with dynamic difficulty adjustments.
    """
    __tablename__ = "adaptive_learning_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_name = Column(String(200), nullable=False)

    starting_level = Column(String(50), default="intermediate", nullable=False)  # beginner, intermediate, advanced
    current_level = Column(String(50), default="intermediate", nullable=False)
    questions_data = Column(JSON, default=list, nullable=False)  # Array of question dicts with responses
    total_questions = Column(Integer, default=5, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="in_progress", nullable=False)  # in_progress, completed

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    subject = relationship("Subject", lazy="selectin")
