from typing import Optional
from sqlalchemy import Boolean, ForeignKey, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid


class StudentProfile(Base, TimestampMixin):
    __tablename__ = "student_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    institution_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    student_identifier: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    academic_year: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    program: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    gpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="student_profile")
    institution: Mapped[Optional["Institution"]] = relationship("Institution")


class TeacherProfile(Base, TimestampMixin):
    __tablename__ = "teacher_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    institution_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    employee_identifier: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    specialization: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    office_hours: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="teacher_profile")
    institution: Mapped[Optional["Institution"]] = relationship("Institution")


class ParentProfile(Base, TimestampMixin):
    __tablename__ = "parent_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    contact_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(50), default="en")

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="parent_profile")


class InstitutionMembership(Base, TimestampMixin):
    __tablename__ = "institution_memberships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    institution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("institutions.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    membership_role: Mapped[str] = mapped_column(String(50), default="student")
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, pending, suspended


class ParentStudentRelationship(Base, TimestampMixin):
    """Authoritative parent-student relationship model with verification status."""
    __tablename__ = "parent_student_relationships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    parent_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    student_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    relationship_type: Mapped[str] = mapped_column(String(50), default="guardian")  # mother, father, guardian
    verification_status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # pending, verified, rejected
    verified_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    parent: Mapped["User"] = relationship("User", foreign_keys=[parent_user_id])
    student: Mapped["User"] = relationship("User", foreign_keys=[student_user_id])
