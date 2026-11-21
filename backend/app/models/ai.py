"""
EduVerse AI - Generative AI and RAG Database Models (Phase 4)
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_type = Column(String(50), nullable=False, default="student_assistant")  # student_assistant, parent_assistant, teacher_tool
    student_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    language = Column(String(10), nullable=False, default="en")  # en, te, hi
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", lazy="selectin", order_by="AIMessage.created_at")

    __table_args__ = (
        Index("idx_ai_conv_user_type", "user_id", "conversation_type"),
    )


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    language = Column(String(10), nullable=False, default="en")  # en, te, hi
    sources = Column(JSON, nullable=True)  # List of citations: [{doc_name, chunk_id, page, score}]
    metadata_json = Column(JSON, nullable=True)  # {model, latency_ms, tokens, verified_facts}
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    conversation = relationship("AIConversation", back_populates="messages", lazy="selectin")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_id = Column(String(36), ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    token_count = Column(Integer, default=0, nullable=False)
    chroma_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    material = relationship("StudyMaterial", lazy="selectin")

    __table_args__ = (
        Index("idx_doc_chunk_mat_idx", "material_id", "chunk_index"),
    )


class UserLanguagePreference(Base):
    __tablename__ = "user_language_preferences"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    preferred_language = Column(String(10), default="en", nullable=False)  # en, te, hi
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", lazy="selectin")
