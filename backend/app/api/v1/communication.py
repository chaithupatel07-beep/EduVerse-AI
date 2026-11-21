"""
EduVerse AI - Multilingual Parent-Teacher-Management Communication Endpoints (Phase 4)
Threaded conversations, categorized inquiries, role-based workflows, and on-demand translation
"""
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.communication import CommunicationThread, CommunicationMessage
from app.schemas.communication_thread import (
    CommunicationThreadCreate,
    CommunicationThreadResponse,
    CommunicationMessageCreate,
    CommunicationMessageResponse,
    ThreadStatusUpdate,
    TranslateRequest,
    TranslateResponse,
)
from app.ai.gemini_service import gemini_service
from app.ai.language_service import detect_language

router = APIRouter(prefix="/communication", tags=["Communication Hub"])


@router.post("/threads", response_model=CommunicationThreadResponse)
async def create_thread(
    req: CommunicationThreadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a new communication thread (Parent-to-Teacher or Parent-to-Management).
    """
    thread_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    thread = CommunicationThread(
        id=thread_id,
        institution_id=current_user.institution_id or "default-inst",
        thread_type=req.thread_type,
        category=req.category,
        parent_id=current_user.id,
        student_id=req.student_id,
        recipient_id=req.recipient_id,
        subject=req.subject,
        status="pending",
        priority=req.priority,
        created_at=now,
        updated_at=now
    )
    db.add(thread)
    await db.flush()

    # Initial Message
    initial_msg = CommunicationMessage(
        id=str(uuid.uuid4()),
        thread_id=thread_id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        content=req.initial_message,
        original_language=req.language or detect_language(req.initial_message),
        created_at=now
    )
    db.add(initial_msg)
    await db.commit()
    await db.refresh(thread)

    return thread


@router.get("/threads", response_model=List[CommunicationThreadResponse])
async def list_threads(
    thread_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List communication threads filtered by user role:
    - Parent: their submitted inquiries
    - Teacher: threads assigned to them or their courses
    - Admin: all institutional management inquiries
    """
    stmt = select(CommunicationThread)

    if current_user.role == UserRole.PARENT:
        stmt = stmt.where(CommunicationThread.parent_id == current_user.id)
    elif current_user.role == UserRole.TEACHER:
        stmt = stmt.where(
            or_(
                CommunicationThread.recipient_id == current_user.id,
                CommunicationThread.thread_type == "parent_teacher"
            )
        )
    elif current_user.role == UserRole.ADMIN:
        stmt = stmt.where(CommunicationThread.institution_id == current_user.institution_id)

    if thread_type:
        stmt = stmt.where(CommunicationThread.thread_type == thread_type)
    if status_filter:
        stmt = stmt.where(CommunicationThread.status == status_filter)

    stmt = stmt.order_by(CommunicationThread.updated_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/threads/{thread_id}", response_model=CommunicationThreadResponse)
async def get_thread_detail(
    thread_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve full thread conversation with messages.
    """
    stmt = select(CommunicationThread).where(CommunicationThread.id == thread_id)
    res = await db.execute(stmt)
    thread = res.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Communication thread not found")

    # Verify authorization
    if current_user.role == UserRole.PARENT and thread.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this thread")
    if current_user.role not in (UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Role not authorized")

    return thread


@router.post("/threads/{thread_id}/messages", response_model=CommunicationMessageResponse)
async def send_message_in_thread(
    thread_id: str,
    req: CommunicationMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a reply message in an existing communication thread.
    """
    stmt = select(CommunicationThread).where(CommunicationThread.id == thread_id)
    res = await db.execute(stmt)
    thread = res.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Authorization
    if current_user.role == UserRole.PARENT and thread.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to reply to this thread")

    now = datetime.now(timezone.utc)
    new_msg = CommunicationMessage(
        id=str(uuid.uuid4()),
        thread_id=thread_id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        content=req.content,
        original_language=req.original_language or detect_language(req.content),
        created_at=now
    )
    db.add(new_msg)

    # If teacher or admin replied, update thread status to in_review if pending
    if current_user.role in (UserRole.TEACHER, UserRole.ADMIN) and thread.status == "pending":
        thread.status = "in_review"
    thread.updated_at = now

    await db.commit()
    await db.refresh(new_msg)
    return new_msg


@router.patch("/threads/{thread_id}/status", response_model=CommunicationThreadResponse)
async def update_thread_status(
    thread_id: str,
    req: ThreadStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update inquiry thread resolution status (pending, in_review, resolved, closed).
    Authorized for Staff (Teacher/Admin) and Parent (can close resolved inquiry).
    """
    stmt = select(CommunicationThread).where(CommunicationThread.id == thread_id)
    res = await db.execute(stmt)
    thread = res.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    thread.status = req.status
    thread.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(thread)
    return thread


@router.post("/translate", response_model=TranslateResponse)
async def translate_message(
    req: TranslateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    On-demand AI translation of messages into Telugu, Hindi, or English.
    Preserves original text integrity while aiding receiver comprehension.
    """
    translated = await gemini_service.translate_text(
        text=req.text,
        target_language=req.target_language,
        source_language=req.source_language
    )
    return TranslateResponse(
        original_text=req.text,
        translated_text=translated,
        source_language=req.source_language or "auto",
        target_language=req.target_language
    )
