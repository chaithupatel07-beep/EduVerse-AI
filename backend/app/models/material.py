"""
EduVerse AI - Study Material Model
Manages uploaded educational resources (PDF, DOCX, PPTX, videos) with security metadata and RAG preparedness.
"""
from datetime import datetime, timezone
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)  # Size in bytes
    mime_type = Column(String(100), default="application/pdf", nullable=False)
    file_type = Column(String(50), default="pdf", nullable=False)  # pdf, docx, pptx, image, text
    download_count = Column(Integer, default=0, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)

    # RAG & Vector Indexing Preparedness (for Phase 4)
    rag_indexed = Column(Boolean, default=False, nullable=False)
    rag_chunks_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    institution = relationship("Institution", backref="study_materials")
    course = relationship("Course", back_populates="study_materials", lazy="selectin")
    subject = relationship("Subject", back_populates="study_materials", lazy="selectin")
    uploader = relationship("User", backref="uploaded_materials", lazy="selectin")
