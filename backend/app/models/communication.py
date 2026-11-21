"""
EduVerse AI - Communication Models
Manages institutional announcements, in-app notifications, and parent-teacher/parent-management communication threads.
"""
from datetime import datetime, timezone
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String(50), default="all", nullable=False)  # 'all', 'student', 'teacher', 'parent'
    priority = Column(String(50), default="normal", nullable=False)  # 'low', 'normal', 'high', 'urgent'
    is_published = Column(Boolean, default=True, nullable=False)
    attachment_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    institution = relationship("Institution", backref="announcements", lazy="selectin")
    author = relationship("User", backref="authored_announcements", lazy="selectin")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(
        String(50), default="general", nullable=False
    )  # 'assignment', 'quiz', 'attendance', 'announcement', 'grade', 'general'
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", backref="notifications", lazy="selectin")


class CommunicationRequest(Base):
    __tablename__ = "communication_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(
        String(50), default="pending", nullable=False
    )  # 'pending', 'accepted', 'completed', 'declined'
    response_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    parent = relationship("User", foreign_keys=[parent_id], backref="sent_communication_requests", lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="received_communication_requests", lazy="selectin")
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")


class CommunicationThread(Base):
    __tablename__ = "communication_threads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    thread_type = Column(String(50), nullable=False, default="parent_teacher")  # parent_teacher, parent_management
    category = Column(String(50), nullable=False, default="academic_concerns")  # academic_concerns, attendance_issues, assignment_queries, examination_queries, administrative_concerns, general_requests
    parent_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)  # Teacher or Admin
    subject = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, in_review, resolved, closed
    priority = Column(String(20), nullable=False, default="normal")  # low, normal, high, urgent
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    parent = relationship("User", foreign_keys=[parent_id], lazy="selectin")
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
    recipient = relationship("User", foreign_keys=[recipient_id], lazy="selectin")
    messages = relationship("CommunicationMessage", back_populates="thread", cascade="all, delete-orphan", lazy="selectin", order_by="CommunicationMessage.created_at")

    __table_args__ = (
        Index("idx_comm_thread_parent", "parent_id", "thread_type"),
        Index("idx_comm_thread_status", "institution_id", "status"),
    )


class CommunicationMessage(Base):
    __tablename__ = "communication_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String(36), ForeignKey("communication_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    original_language = Column(String(10), nullable=False, default="en")  # en, te, hi
    translated_content = Column(Text, nullable=True)
    target_language = Column(String(10), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    thread = relationship("CommunicationThread", back_populates="messages", lazy="selectin")
    sender = relationship("User", lazy="selectin")
