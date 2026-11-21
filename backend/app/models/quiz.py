"""
EduVerse AI - Quiz and Assessment Models
Manages quizzes, questions (MCQ, Multi-select, True/False, Short Answer), options,
student attempts, and answer evaluations.
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


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    total_marks = Column(Float, default=100.0, nullable=False)
    passing_marks = Column(Float, default=40.0, nullable=False)

    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)
    results_released = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    institution = relationship("Institution", backref="quizzes")
    classroom = relationship("ClassRoom", back_populates="quizzes", lazy="selectin")
    subject = relationship("Subject", back_populates="quizzes", lazy="selectin")
    teacher = relationship("User", backref="created_quizzes", lazy="selectin")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", lazy="selectin", order_by="QuizQuestion.order_index")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan", lazy="selectin")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq", nullable=False)  # 'mcq', 'multi_select', 'true_false', 'short_answer'
    points = Column(Float, default=10.0, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    explanation = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    quiz = relationship("Quiz", back_populates="questions", lazy="selectin")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan", lazy="selectin", order_by="QuizOption.order_index")


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    # Relationships
    question = relationship("QuizQuestion", back_populates="options", lazy="selectin")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(50), default="completed", nullable=False)  # 'in_progress', 'completed', 'timed_out'
    score = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts", lazy="selectin")
    student = relationship("User", backref="quiz_attempts", lazy="selectin")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan", lazy="selectin")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)

    selected_option_id = Column(String(36), nullable=True)
    selected_option_ids = Column(Text, nullable=True)
    text_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False, nullable=False)
    marks_awarded = Column(Float, default=0.0, nullable=False)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers", lazy="selectin")
    question = relationship("QuizQuestion", lazy="selectin")
