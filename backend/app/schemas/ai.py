"""
EduVerse AI - Generative AI and RAG Schemas (Phase 4)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class SourceCitation(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    document_name: str
    material_id: Optional[str] = None
    chunk_id: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None
    excerpt: Optional[str] = None


class AIChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    conversation_type: str = Field(default="student_assistant", description="student_assistant, parent_assistant, teacher_tool")
    message: str = Field(..., min_length=1, max_length=4000)
    language: str = Field(default="en", description="en, te, hi")
    course_id: Optional[str] = None
    subject_id: Optional[str] = None
    student_id: Optional[str] = None  # Validated server-side for parents
    use_rag: bool = Field(default=True, description="Retrieve context from uploaded study materials")


class AIMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    sender: str  # user, assistant, system
    content: str
    language: str
    sources: Optional[List[Dict[str, Any]]] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class AIConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    institution_id: str
    conversation_type: str
    student_id: Optional[str] = None
    course_id: Optional[str] = None
    subject_id: Optional[str] = None
    title: str
    language: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages: List[AIMessageResponse] = []


class AISummarizeRequest(BaseModel):
    material_id: str
    target_language: str = Field(default="en", description="en, te, hi")
    max_length_words: int = Field(default=300, ge=50, le=1000)


class AISummarizeResponse(BaseModel):
    material_id: str
    document_title: str
    language: str
    summary: str
    key_takeaways: List[str] = []
    generated_by: str = "EduVerse AI Engine"


class AIQuizQuestionItem(BaseModel):
    question_text: str
    question_type: str = "mcq"  # mcq, short_answer
    options: List[str] = []
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None
    difficulty: str = "medium"


class AIQuizGenerateRequest(BaseModel):
    subject_name: str
    topic: str
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: str = Field(default="medium", description="easy, medium, hard")
    language: str = Field(default="en", description="en, te, hi")
    study_material_id: Optional[str] = None


class AIQuizGenerateResponse(BaseModel):
    subject_name: str
    topic: str
    difficulty: str
    language: str
    questions: List[AIQuizQuestionItem]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class AILessonPlanRequest(BaseModel):
    subject_name: str
    grade_level: str
    topic: str
    duration_minutes: int = Field(default=45, ge=15, le=180)
    learning_objectives: Optional[List[str]] = None
    language: str = Field(default="en", description="en, te, hi")


class AILessonPlanResponse(BaseModel):
    subject_name: str
    grade_level: str
    topic: str
    duration_minutes: int
    language: str
    objectives: List[str]
    timeline_sections: List[Dict[str, Any]]
    activities: List[str]
    assessment_ideas: List[str]
    homework_suggestion: str


class DocumentIndexResponse(BaseModel):
    material_id: str
    chunks_created: int
    total_tokens: int
    chroma_collection: str
    status: str = "indexed"


class LanguagePreferenceRequest(BaseModel):
    language: str = Field(..., pattern="^(en|te|hi)$", description="Supported: en, te, hi")


class LanguagePreferenceResponse(BaseModel):
    user_id: str
    preferred_language: str
    updated_at: datetime
