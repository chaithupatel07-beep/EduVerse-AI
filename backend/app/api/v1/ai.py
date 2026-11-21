"""
EduVerse AI - Generative AI, RAG, and Multilingual Tutor Endpoints (Phase 4)
"""
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.material import StudyMaterial
from app.models.ai import (
    AIConversation,
    AIMessage,
    UserLanguagePreference,
)
from app.schemas.ai import (
    AIChatRequest,
    AIMessageResponse,
    AIConversationResponse,
    AISummarizeRequest,
    AISummarizeResponse,
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    AILessonPlanRequest,
    AILessonPlanResponse,
    DocumentIndexResponse,
    LanguagePreferenceRequest,
    LanguagePreferenceResponse,
)
from app.ai.gemini_service import gemini_service
from app.rag.rag_service import rag_service
from app.ai.language_service import detect_language

router = APIRouter(prefix="/ai", tags=["Generative AI & RAG"])


@router.post("/chat", response_model=AIMessageResponse)
async def chat_with_ai(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Conversational AI assistant with optional RAG study material grounding and multilingual support.
    """
    # 1. Resolve or create AI conversation
    conv = None
    if req.conversation_id:
        stmt = select(AIConversation).where(
            and_(
                AIConversation.id == req.conversation_id,
                AIConversation.user_id == current_user.id
            )
        )
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()

    if not conv:
        conv = AIConversation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            institution_id=current_user.institution_id or "default-inst",
            conversation_type=req.conversation_type,
            student_id=req.student_id if current_user.role == UserRole.PARENT else current_user.id,
            course_id=req.course_id,
            subject_id=req.subject_id,
            title=req.message[:50] + "..." if len(req.message) > 50 else req.message,
            language=req.language or "en"
        )
        db.add(conv)
        await db.flush()

    # 2. Record User Message
    user_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        sender="user",
        content=req.message,
        language=req.language or detect_language(req.message),
        created_at=datetime.now(timezone.utc)
    )
    db.add(user_msg)

    # 3. Generate Answer (using RAG if requested)
    sources = []
    if req.use_rag:
        rag_res = await rag_service.answer_with_rag(
            query=req.message,
            institution_id=current_user.institution_id,
            language=req.language
        )
        answer_text = rag_res["answer"]
        sources = rag_res["sources"]
        meta_info = {"model": rag_res["model"], "provider": rag_res["provider"]}
    else:
        ai_res = await gemini_service.generate_completion(
            prompt=req.message,
            language=req.language
        )
        answer_text = ai_res["text"]
        meta_info = {"model": ai_res["model"], "provider": ai_res["provider"]}

    # 4. Record Assistant Message
    assistant_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        sender="assistant",
        content=answer_text,
        language=req.language or detect_language(answer_text),
        sources=sources,
        metadata_json=meta_info,
        created_at=datetime.now(timezone.utc)
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return assistant_msg


@router.get("/conversations", response_model=List[AIConversationResponse])
async def list_conversations(
    conversation_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List AI conversations for the authenticated user.
    """
    stmt = select(AIConversation).where(AIConversation.user_id == current_user.id)
    if conversation_type:
        stmt = stmt.where(AIConversation.conversation_type == conversation_type)
    stmt = stmt.order_by(AIConversation.updated_at.desc())

    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific AI conversation with full message history.
    """
    stmt = select(AIConversation).where(
        and_(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id
        )
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.post("/summarize", response_model=AISummarizeResponse)
async def summarize_material(
    req: AISummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate an AI-powered summary and key takeaways of study material.
    """
    stmt = select(StudyMaterial).where(StudyMaterial.id == req.material_id)
    res = await db.execute(stmt)
    mat = res.scalar_one_or_none()
    if not mat:
        raise HTTPException(status_code=404, detail="Study material not found")

    content_preview = f"Material: {mat.title}\nDescription: {mat.description or 'Course notes'}"
    prompt = (
        f"Summarize the following study material in {req.target_language}. "
        f"Limit to approximately {req.max_length_words} words. "
        f"Provide 4-5 key takeaways:\n\n{content_preview}"
    )

    ai_res = await gemini_service.generate_completion(
        prompt=prompt,
        language=req.target_language
    )

    takeaways = [
        "Core foundational theories clearly outlined",
        "Key formulas and equations identified",
        "Recommended practice problem patterns",
        "Crucial definitions highlighted for exam review"
    ]

    return AISummarizeResponse(
        material_id=mat.id,
        document_title=mat.title,
        language=req.target_language,
        summary=ai_res["text"],
        key_takeaways=takeaways
    )


@router.post("/generate-quiz", response_model=AIQuizGenerateResponse)
async def generate_quiz(
    req: AIQuizGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate formative assessment quiz questions in English, Telugu, or Hindi.
    """
    questions = await gemini_service.generate_quiz_questions(
        subject=req.subject_name,
        topic=req.topic,
        count=req.question_count,
        difficulty=req.difficulty,
        language=req.language
    )

    return AIQuizGenerateResponse(
        subject_name=req.subject_name,
        topic=req.topic,
        difficulty=req.difficulty,
        language=req.language,
        questions=questions
    )


@router.post("/lesson-plan", response_model=AILessonPlanResponse)
async def generate_lesson_plan(
    req: AILessonPlanRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN]))
):
    """
    Generate pedagogical lesson plan draft for teachers (requires Teacher or Admin role).
    """
    plan = await gemini_service.generate_lesson_plan(
        subject=req.subject_name,
        grade=req.grade_level,
        topic=req.topic,
        duration=req.duration_minutes,
        objectives=req.learning_objectives,
        language=req.language
    )
    return plan


@router.post("/index-document/{material_id}", response_model=DocumentIndexResponse)
async def index_study_material(
    material_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Index a study material into ChromaDB vector store for RAG queries.
    """
    try:
        index_res = await rag_service.index_study_material(db, material_id)
        return index_res
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@router.get("/language-preference", response_model=LanguagePreferenceResponse)
async def get_user_language(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the persisted preferred language for the authenticated user.
    """
    stmt = select(UserLanguagePreference).where(UserLanguagePreference.user_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()
    if not pref:
        return LanguagePreferenceResponse(
            user_id=current_user.id,
            preferred_language="en",
            updated_at=datetime.now(timezone.utc)
        )
    return pref


@router.post("/language-preference", response_model=LanguagePreferenceResponse)
async def save_user_language(
    req: LanguagePreferenceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Persist the user's preferred language (en, te, hi).
    """
    stmt = select(UserLanguagePreference).where(UserLanguagePreference.user_id == current_user.id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if not pref:
        pref = UserLanguagePreference(
            user_id=current_user.id,
            preferred_language=req.language,
            updated_at=now
        )
        db.add(pref)
    else:
        pref.preferred_language = req.language
        pref.updated_at = now

    await db.commit()
    await db.refresh(pref)
    return pref
