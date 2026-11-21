"""
EduVerse AI - Parent AI Assistant Endpoints (Phase 4)
Mandatory jury requirement: Dedicated parent academic advisor with verified child grounding
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.ai.parent_ai_service import parent_ai_service

router = APIRouter(prefix="/parent/ai", tags=["Parent AI Assistant"])


class ParentAIChatRequest(BaseModel):
    student_id: str = Field(..., description="Target linked child ID")
    question: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en", description="en, te, hi")


class ParentAIChatResponse(BaseModel):
    answer: str
    language: str
    student_name: str
    telemetry_summary: Dict[str, Any]
    verified_records_used: bool = True


@router.post("/chat", response_model=ParentAIChatResponse)
async def parent_ai_chat(
    req: ParentAIChatRequest,
    current_user: User = Depends(require_roles([UserRole.PARENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Dedicated AI assistant for parents.
    Enforces strict relationship verification and grounds answers in verified academic records.
    Fluent in English, Telugu (తెలుగు), and Hindi (हिंदी).
    """
    res = await parent_ai_service.answer_parent_inquiry(
        db=db,
        parent_id=current_user.id,
        student_id=req.student_id,
        question=req.question,
        language=req.language
    )
    return res


@router.get("/child-context/{student_id}")
async def get_child_academic_context(
    student_id: str,
    current_user: User = Depends(require_roles([UserRole.PARENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve live verified child academic telemetry for dashboard visualization.
    """
    telemetry = await parent_ai_service.get_child_academic_telemetry(
        db=db,
        parent_id=current_user.id,
        student_id=student_id
    )
    return telemetry


@router.get("/suggestions/{student_id}")
async def get_suggested_inquiries(
    student_id: str,
    language: Optional[str] = "en",
    current_user: User = Depends(require_roles([UserRole.PARENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get quick-action suggested questions in English, Telugu, and Hindi.
    """
    # Verify access first
    is_linked = await parent_ai_service.verify_parent_student_link(db, current_user.id, student_id)
    if not is_linked and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Student is not linked to this parent account."
        )
    suggestions = parent_ai_service.get_suggested_inquiries(language=language or "en")
    return suggestions
