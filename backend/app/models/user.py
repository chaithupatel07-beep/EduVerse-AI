from enum import Enum
from typing import List, Optional
from sqlalchemy import Boolean, ForeignKey, String, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"
    ADMIN = "admin"


class ParentStudentLink(Base, TimestampMixin):
    """Association model connecting a Parent with their Student children."""
    __tablename__ = "parent_student_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    parent_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    relationship_type: Mapped[str] = mapped_column(String(50), default="guardian")  # father, mother, guardian
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False),
        nullable=False,
        default=UserRole.STUDENT,
        index=True,
    )

    institution_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    firebase_uid: Mapped[Optional[str]] = mapped_column(
        String(128), unique=True, index=True, nullable=True
    )

    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Role specific attributes
    grade_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Student: e.g. Grade 10 / B.Tech Year 3
    subject_specialization: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # Teacher: e.g. Mathematics, AI

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)

    # Refresh token storage for secure revocation
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    institution: Mapped[Optional["Institution"]] = relationship("Institution", back_populates="users")

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
