"""
EduVerse AI - Attendance Management Models
Manages attendance sessions, student attendance records (present/absent/late/excused),
and immutable audit logs for attendance updates.
"""
from datetime import datetime, timezone
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    session_date = Column(Date, nullable=False, index=True)
    session_title = Column(String(200), default="Regular Lecture", nullable=False)
    session_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("class_id", "session_date", "subject_id", name="uq_class_session_date_subject"),
    )

    # Relationships
    institution = relationship("Institution", backref="attendance_sessions")
    classroom = relationship("ClassRoom", back_populates="attendance_sessions", lazy="selectin")
    subject = relationship("Subject", lazy="selectin")
    teacher = relationship("User", backref="recorded_attendance_sessions", lazy="selectin")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan", lazy="selectin")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(50), default="present", nullable=False)  # 'present', 'absent', 'late', 'excused'
    remarks = Column(String(255), nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student_attendance"),
    )

    # Relationships
    session = relationship("AttendanceSession", back_populates="records", lazy="selectin")
    student = relationship("User", backref="attendance_records", lazy="selectin")
    audit_logs = relationship("AttendanceAuditLog", back_populates="record", cascade="all, delete-orphan", lazy="selectin")


class AttendanceAuditLog(Base):
    __tablename__ = "attendance_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(36), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(String(255), nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    record = relationship("AttendanceRecord", back_populates="audit_logs", lazy="selectin")
    changer = relationship("User", lazy="selectin")
