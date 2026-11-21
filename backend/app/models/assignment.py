"""
EduVerse AI - Assignment and Submission Models
Manages assignment creation, student submissions, evaluation, scoring, and feedback.
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
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    max_marks = Column(Float, default=100.0, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    allowed_formats = Column(String(255), default="pdf,docx,zip,txt", nullable=False)
    attachment_url = Column(String(500), nullable=True)
    status = Column(String(50), default="published", nullable=False)  # 'draft', 'published', 'archived'

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    institution = relationship("Institution", backref="assignments")
    classroom = relationship("ClassRoom", back_populates="assignments", lazy="selectin")
    subject = relationship("Subject", back_populates="assignments", lazy="selectin")
    teacher = relationship("User", backref="created_assignments", lazy="selectin")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan", lazy="selectin")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    submission_text = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, default=0, nullable=False)
    mime_type = Column(String(100), nullable=True)

    status = Column(
        String(50), default="submitted", nullable=False
    )  # 'submitted', 'late', 'under_evaluation', 'evaluated'
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Evaluation fields
    marks_obtained = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    evaluated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    evaluated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions", lazy="selectin")
    student = relationship("User", foreign_keys=[student_id], backref="submissions", lazy="selectin")
    evaluator = relationship("User", foreign_keys=[evaluated_by], lazy="selectin")
