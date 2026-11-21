"""
EduVerse AI - Communication Models
Manages institutional announcements, in-app notifications, and parent-teacher communication requests.
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
    institution = relationship("Institution", backref="announcements")
    author = relationship("User", backref="authored_announcements")


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
    user = relationship("User", backref="notifications")


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
    parent = relationship("User", foreign_keys=[parent_id], backref="sent_communication_requests")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="received_communication_requests")
    student = relationship("User", foreign_keys=[student_id])
