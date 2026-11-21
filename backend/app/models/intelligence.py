"""
EduVerse AI - Phase 6 Intelligence Models
Defines models for:
  - Teacher AI Copilot: Lesson Plans and Question Papers
  - AI-Assisted Assignment Evaluation Suggestions
  - Parent–Teacher Meeting Requests
  - Parent-Friendly Progress Reports
  - Notification Preferences
  - Institutional Intelligence Reports
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class LessonPlan(Base):
    """
    Teacher AI Copilot generated lesson plans with 11 pedagogical sections,
    standards alignment, and editable teacher approval workflow.
    """
    __tablename__ = "lesson_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    grade_level = Column(String(50), nullable=False, default="Grade 10")
    duration_minutes = Column(Integer, default=45, nullable=False)
    learning_level = Column(String(50), default="mixed", nullable=False)  # foundational, intermediate, advanced, mixed
    status = Column(String(50), default="draft", nullable=False)  # draft, reviewed, approved, published
    language = Column(String(10), default="en", nullable=False)  # en, te, hi

    # Structured 11 sections content stored as JSON
    content_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")
    subject = relationship("Subject", foreign_keys=[subject_id], lazy="selectin")
    classroom = relationship("ClassRoom", foreign_keys=[class_id], lazy="selectin")


class QuestionPaper(Base):
    """
    Teacher AI Copilot generated question papers with multi-section distribution,
    separate answer keys, and marking guidelines.
    """
    __tablename__ = "question_papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    topics_json = Column(JSON, default=list, nullable=False)
    total_marks = Column(Float, default=100.0, nullable=False)
    duration_minutes = Column(Integer, default=180, nullable=False)
    difficulty_level = Column(String(50), default="medium", nullable=False)  # easy, medium, hard, balanced
    status = Column(String(50), default="draft", nullable=False)  # draft, reviewed, approved, published
    language = Column(String(10), default="en", nullable=False)  # en, te, hi

    # Sections & questions structure
    sections_data = Column(JSON, default=list, nullable=False)
    answer_key_data = Column(JSON, default=dict, nullable=False)
    marking_guidelines = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")
    subject = relationship("Subject", foreign_keys=[subject_id], lazy="selectin")
    classroom = relationship("ClassRoom", foreign_keys=[class_id], lazy="selectin")


class AssignmentEvaluationSuggestion(Base):
    """
    AI-assisted assignment grading suggestions.
    Crucial Safeguard: Remains a suggestion until teacher review and explicit approval.
    """
    __tablename__ = "assignment_evaluation_suggestions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(
        String(36),
        ForeignKey("assignment_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    suggested_marks = Column(Float, nullable=False)
    max_marks = Column(Float, default=100.0, nullable=False)
    confidence_score = Column(Float, default=0.85, nullable=False)

    correct_concepts = Column(JSON, default=list, nullable=False)
    missing_key_points = Column(JSON, default=list, nullable=False)
    suggested_feedback = Column(Text, nullable=False)
    misunderstandings = Column(JSON, default=list, nullable=False)
    recommended_revision_topics = Column(JSON, default=list, nullable=False)

    # Teacher Approval Workflow
    status = Column(String(50), default="suggested", nullable=False)  # suggested, teacher_reviewed, approved, rejected
    teacher_approved_marks = Column(Float, nullable=True)
    teacher_final_feedback = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    submission = relationship("AssignmentSubmission", lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")


class MeetingRequest(Base):
    """
    Parent-Teacher meeting requests with lifecycle tracking.
    """
    __tablename__ = "meeting_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)

    requested_date = Column(String(50), nullable=False)
    preferred_time_slot = Column(String(50), nullable=False)
    subject = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    meeting_type = Column(String(50), default="in_person", nullable=False)  # in_person, online_video, phone_call
    status = Column(String(50), default="requested", nullable=False)  # requested, confirmed, rescheduled, completed, cancelled

    teacher_notes = Column(Text, nullable=True)
    meeting_link = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    parent = relationship("User", foreign_keys=[parent_id], lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")


class ParentProgressReport(Base):
    """
    Verified, parent-friendly academic progress reports generated in EN, TE, or HI.
    """
    __tablename__ = "parent_progress_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)

    report_type = Column(String(50), default="weekly_summary", nullable=False)  # weekly_summary, monthly_overview, mid_term_review
    reporting_period_start = Column(DateTime(timezone=True), nullable=True)
    reporting_period_end = Column(DateTime(timezone=True), nullable=True)
    language = Column(String(10), default="en", nullable=False)  # en, te, hi

    summary_text = Column(Text, nullable=False)
    strengths_json = Column(JSON, default=list, nullable=False)
    improvements_needed_json = Column(JSON, default=list, nullable=False)
    parental_support_recommendations = Column(JSON, default=list, nullable=False)
    metrics_snapshot_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    parent = relationship("User", foreign_keys=[parent_id], lazy="selectin")


class NotificationPreference(Base):
    """
    User notification preferences and language configuration.
    """
    __tablename__ = "notification_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    email_alerts = Column(Boolean, default=True, nullable=False)
    assignment_updates = Column(Boolean, default=True, nullable=False)
    quiz_reminders = Column(Boolean, default=True, nullable=False)
    academic_alerts = Column(Boolean, default=True, nullable=False)
    communication_messages = Column(Boolean, default=True, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)  # en, te, hi

    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")


class InstitutionalReport(Base):
    """
    AI-assisted institutional academic and operational summaries for administrators.
    """
    __tablename__ = "institutional_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    report_type = Column(String(50), nullable=False)  # monthly_academic, department_performance, attendance_summary, communication_resolution, knowledge_gap_overview
    title = Column(String(255), nullable=False)
    period = Column(String(100), nullable=False)
    summary = Column(Text, nullable=False)
    data_json = Column(JSON, default=dict, nullable=False)
    language = Column(String(10), default="en", nullable=False)  # en, te, hi

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    author = relationship("User", foreign_keys=[generated_by], lazy="selectin")
