"""
EduVerse AI - Phase 6.5 Innovation Models
Includes:
- Mock Exam Simulator (MockExam, MockExamQuestion, MockExamAttempt, MockExamAnswer)
- Smart Notes Scanner & OCR (ScannedDocument, DocumentExtractedText)
- AI Smart Timetable & Scheduler (StudyTimetable, StudySessionEntry)
- Gamification & Achievements (GamificationProfile, AchievementBadge, EarnedBadge, PointTransaction)
- Visual Knowledge Map (KnowledgeNode, KnowledgeEdge, StudentNodeMastery)
- Early-Warning & Intervention System (EarlyWarningAlert, InterventionRecord)
"""
from datetime import datetime, timezone
import uuid

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
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


# ============================================================================
# 1. AI Smart Examination Simulator
# ============================================================================

class MockExam(Base):
    __tablename__ = "mock_exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    topic_focus = Column(String(255), nullable=True)
    difficulty_level = Column(String(50), default="medium", nullable=False)  # easy, medium, hard, adaptive
    duration_minutes = Column(Integer, default=60, nullable=False)
    total_marks = Column(Float, default=100.0, nullable=False)
    passing_percentage = Column(Float, default=40.0, nullable=False)
    language = Column(String(10), default="en", nullable=False)  # en, te, hi

    question_types = Column(JSON, default=lambda: ["mcq", "true_false", "short_answer"], nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    questions = relationship("MockExamQuestion", back_populates="exam", cascade="all, delete-orphan", lazy="selectin", order_by="MockExamQuestion.order_index")
    attempts = relationship("MockExamAttempt", back_populates="exam", cascade="all, delete-orphan", lazy="selectin")


class MockExamQuestion(Base):
    __tablename__ = "mock_exam_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("mock_exams.id", ondelete="CASCADE"), nullable=False, index=True)

    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq", nullable=False)  # mcq, true_false, fill_blank, short_answer, descriptive
    section = Column(String(50), default="Section A", nullable=False)
    order_index = Column(Integer, default=1, nullable=False)
    marks = Column(Float, default=1.0, nullable=False)

    options = Column(JSON, nullable=True)  # List of options for MCQ: ["optA", "optB", "optC", "optD"]
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    topic_tag = Column(String(150), nullable=True)
    cognitive_level = Column(String(50), default="understand", nullable=True)  # remember, understand, apply, analyze

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    exam = relationship("MockExam", back_populates="questions", lazy="selectin")
    answers = relationship("MockExamAnswer", back_populates="question", cascade="all, delete-orphan", lazy="selectin")


class MockExamAttempt(Base):
    __tablename__ = "mock_exam_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("mock_exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(50), default="in_progress", nullable=False)  # in_progress, completed, abandoned, evaluated
    total_score = Column(Float, default=0.0, nullable=False)
    max_possible_score = Column(Float, default=100.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    accuracy_percentage = Column(Float, default=0.0, nullable=False)
    time_taken_seconds = Column(Integer, default=0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)

    subject_breakdown = Column(JSON, default=dict, nullable=False)
    topic_breakdown = Column(JSON, default=dict, nullable=False)
    ai_feedback_summary = Column(Text, nullable=True)
    recommended_revision_topics = Column(JSON, default=list, nullable=False)

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    exam = relationship("MockExam", back_populates="attempts", lazy="selectin")
    student = relationship("User", lazy="selectin")
    answers = relationship("MockExamAnswer", back_populates="attempt", cascade="all, delete-orphan", lazy="selectin")


class MockExamAnswer(Base):
    __tablename__ = "mock_exam_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("mock_exam_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("mock_exam_questions.id", ondelete="CASCADE"), nullable=False, index=True)

    student_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False, nullable=False)
    marks_awarded = Column(Float, default=0.0, nullable=False)
    evaluation_type = Column(String(50), default="auto_objective", nullable=False)  # auto_objective, ai_suggested, teacher_reviewed
    ai_feedback = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    attempt = relationship("MockExamAttempt", back_populates="answers", lazy="selectin")
    question = relationship("MockExamQuestion", back_populates="answers", lazy="selectin")


# ============================================================================
# 2. Smart Notes Scanner & OCR Doubt Solver
# ============================================================================

class ScannedDocument(Base):
    __tablename__ = "scanned_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    document_type = Column(String(50), default="notes", nullable=False)  # notes, textbook_page, handwritten, exam_paper
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    mime_type = Column(String(100), nullable=False)
    detected_language = Column(String(10), default="en", nullable=False)  # en, te, hi

    ocr_status = Column(String(50), default="pending", nullable=False)  # pending, completed, failed, corrected
    ocr_confidence = Column(Float, default=0.9, nullable=False)  # 0.0 to 1.0
    is_indexed_in_rag = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    extracted_text = relationship("DocumentExtractedText", back_populates="document", uselist=False, cascade="all, delete-orphan", lazy="selectin")


class DocumentExtractedText(Base):
    __tablename__ = "document_extracted_texts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("scanned_documents.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    raw_extracted_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=False)
    user_edited_text = Column(Text, nullable=True)
    extracted_key_concepts = Column(JSON, default=list, nullable=False)
    summary = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    document = relationship("ScannedDocument", back_populates="extracted_text", lazy="selectin")


# ============================================================================
# 3. AI Smart Timetable & Study Scheduler
# ============================================================================

class StudyTimetable(Base):
    __tablename__ = "study_timetables"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    schedule_title = Column(String(200), default="Weekly AI Study Schedule", nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    daily_available_hours = Column(Float, default=3.0, nullable=False)
    status = Column(String(50), default="active", nullable=False)  # active, completed, archived

    optimization_goal = Column(String(100), default="exam_prep", nullable=False)  # gap_remediation, exam_prep, balanced
    ai_generated_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sessions = relationship("StudySessionEntry", back_populates="timetable", cascade="all, delete-orphan", lazy="selectin", order_by="StudySessionEntry.scheduled_start")


class StudySessionEntry(Base):
    __tablename__ = "study_session_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String(36), ForeignKey("study_timetables.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    subject_name = Column(String(150), nullable=False)
    topic_name = Column(String(200), nullable=False)
    session_type = Column(String(50), default="revision", nullable=False)  # revision, practice_quiz, concept_learning, break
    day_of_week = Column(String(20), nullable=False)  # Monday, Tuesday, etc.
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=45, nullable=False)

    priority = Column(String(50), default="medium", nullable=False)  # high, medium, low
    linked_gap_id = Column(String(36), ForeignKey("knowledge_gaps.id", ondelete="SET NULL"), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    missed_and_rescheduled = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    timetable = relationship("StudyTimetable", back_populates="sessions", lazy="selectin")


# ============================================================================
# 4. Gamification & Verified Achievement System
# ============================================================================

class GamificationProfile(Base):
    __tablename__ = "gamification_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)

    total_xp = Column(Integer, default=100, nullable=False)
    current_level = Column(Integer, default=1, nullable=False)
    level_title = Column(String(100), default="Curious Explorer", nullable=False)
    streak_days = Column(Integer, default=1, nullable=False)
    longest_streak_days = Column(Integer, default=1, nullable=False)
    last_activity_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)

    daily_goal_xp = Column(Integer, default=50, nullable=False)
    today_xp = Column(Integer, default=10, nullable=False)
    leaderboard_opt_in = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", backref="gamification_profile", lazy="selectin")
    earned_badges = relationship("EarnedBadge", back_populates="profile", cascade="all, delete-orphan", lazy="selectin")
    transactions = relationship("PointTransaction", back_populates="profile", cascade="all, delete-orphan", lazy="selectin")


class AchievementBadge(Base):
    __tablename__ = "achievement_badges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    badge_code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="academic", nullable=False)  # academic, consistency, mastery, innovation
    icon = Column(String(100), default="award", nullable=False)
    xp_reward = Column(Integer, default=100, nullable=False)
    criteria_summary = Column(String(255), nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class EarnedBadge(Base):
    __tablename__ = "earned_badges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String(36), ForeignKey("gamification_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(36), ForeignKey("achievement_badges.id", ondelete="CASCADE"), nullable=False, index=True)

    earned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    evidence_note = Column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint("profile_id", "badge_id", name="uq_profile_badge"),
    )

    # Relationships
    profile = relationship("GamificationProfile", back_populates="earned_badges", lazy="selectin")
    badge = relationship("AchievementBadge", lazy="selectin")


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String(36), ForeignKey("gamification_profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    amount = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)  # quiz_completed, exam_simulated, ocr_scanned, streak_reward
    reference_id = Column(String(100), nullable=True)  # ID of the quiz/exam/session
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    profile = relationship("GamificationProfile", back_populates="transactions", lazy="selectin")


# ============================================================================
# 5. Visual Knowledge Map
# ============================================================================

class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)

    node_type = Column(String(50), default="topic", nullable=False)  # subject, chapter, topic, subtopic
    label = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(50), default="medium", nullable=False)
    estimated_hours = Column(Float, default=2.0, nullable=False)
    pos_x = Column(Float, default=0.0, nullable=False)
    pos_y = Column(Float, default=0.0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class KnowledgeEdge(Base):
    __tablename__ = "knowledge_edges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_node_id = Column(String(36), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_node_id = Column(String(36), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)

    relationship_type = Column(String(50), default="prerequisite", nullable=False)  # prerequisite, related, part_of
    weight = Column(Float, default=1.0, nullable=False)

    __table_args__ = (
        UniqueConstraint("source_node_id", "target_node_id", "relationship_type", name="uq_knowledge_edge"),
    )


class StudentNodeMastery(Base):
    __tablename__ = "student_node_masteries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String(36), ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)

    mastery_state = Column(String(50), default="in_progress", nullable=False)  # mastered, in_progress, needs_attention, unvisited
    mastery_score = Column(Float, default=0.5, nullable=False)  # 0.0 to 1.0
    practice_count = Column(Integer, default=1, nullable=False)
    last_assessed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "node_id", name="uq_student_node_mastery"),
    )


# ============================================================================
# 6. Intelligent Early-Warning & Intervention System
# ============================================================================

class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True, index=True)

    risk_level = Column(String(50), default="moderate", nullable=False)  # high, moderate, watch, low
    alert_category = Column(String(100), default="academic_performance", nullable=False)  # attendance_drop, assessment_decline, unresolved_gaps, assignment_overdue
    title = Column(String(255), nullable=False)
    evidence_summary = Column(Text, nullable=False)
    recommended_intervention = Column(Text, nullable=False)

    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    interventions = relationship("InterventionRecord", back_populates="alert", cascade="all, delete-orphan", lazy="selectin")


class InterventionRecord(Base):
    __tablename__ = "intervention_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id = Column(String(36), ForeignKey("early_warning_alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    action_type = Column(String(100), default="remedial_session", nullable=False)  # remedial_session, parent_conference, study_plan_adjustment, peer_tutoring
    status = Column(String(50), default="assigned", nullable=False)  # assigned, in_progress, completed, outcome_evaluated
    notes = Column(Text, nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    outcome_evaluation = Column(String(100), nullable=True)  # improved, stable, needs_further_support

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    alert = relationship("EarlyWarningAlert", back_populates="interventions", lazy="selectin")
    teacher = relationship("User", foreign_keys=[assigned_teacher_id], lazy="selectin")
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
