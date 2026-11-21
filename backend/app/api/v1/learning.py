"""
EduVerse AI - Personalized Learning API Router (Phase 5)
Endpoints for Learning Profiles, Knowledge-Gaps, Study Plans, Recommendations, and Adaptive Learning.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.personalization import (
    StudentLearningProfileResponse,
    KnowledgeGapResponse,
    StudyPlanResponse,
    StudyPlanGenerateRequest,
    StudyPlanActivityStatusUpdate,
    ResourceRecommendationResponse,
    RecommendationFeedbackRequest,
    AdaptiveSessionStartRequest,
    AdaptiveSessionStartResponse,
    AdaptiveSessionSubmitRequest,
    AdaptiveSessionSubmitResponse,
)
from app.personalization.learning_profile_service import learning_profile_service
from app.analytics.knowledge_gap_service import knowledge_gap_service
from app.personalization.study_plan_service import study_plan_service
from app.personalization.recommendation_service import recommendation_service
from app.personalization.adaptive_learning_service import adaptive_learning_service

router = APIRouter()


@router.get("/profile", response_model=StudentLearningProfileResponse, summary="Get student learning profile")
async def get_learning_profile(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns learning profile for current student or specified student (if authorized teacher/parent/admin).
    """
    target_id = student_id if (student_id and current_user.role in [UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT]) else current_user.id
    prof = await learning_profile_service.get_or_create_profile(db, target_id)
    if "error" in prof:
        raise HTTPException(status_code=404, detail=prof["error"])
    return prof


@router.get("/knowledge-gaps", response_model=List[KnowledgeGapResponse], summary="Get detected knowledge gaps")
async def get_knowledge_gaps(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns classified knowledge gaps with evidence and suggested actions.
    """
    target_id = student_id if (student_id and current_user.role in [UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT]) else current_user.id
    gaps = await knowledge_gap_service.detect_and_update_gaps(db, target_id)
    return gaps


@router.get("/study-plans", response_model=List[Dict[str, Any]], summary="List student study plans")
async def list_study_plans(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists personalized study plans for a student.
    """
    target_id = student_id if (student_id and current_user.role in [UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT]) else current_user.id
    plans = await study_plan_service.list_student_study_plans(db, target_id)
    return plans


@router.post("/study-plans/generate", response_model=Dict[str, Any], summary="Generate dynamic personalized study plan")
async def generate_study_plan(
    req: StudyPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generates a personalized study plan targeting the student's active knowledge gaps.
    """
    plan = await study_plan_service.generate_study_plan(
        db,
        student_id=current_user.id,
        custom_goal=req.custom_goal,
        duration_days=req.duration_days,
    )
    if "error" in plan:
        raise HTTPException(status_code=400, detail=plan["error"])
    return plan


@router.get("/study-plans/{plan_id}", response_model=Dict[str, Any], summary="Get study plan details with activities")
async def get_study_plan_details(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = await study_plan_service.get_study_plan_details(db, plan_id)
    if "error" in plan:
        raise HTTPException(status_code=404, detail=plan["error"])
    return plan


@router.put("/study-plans/activities/{activity_id}/status", summary="Update study plan activity completion status")
async def update_activity_status(
    activity_id: str,
    req: StudyPlanActivityStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await study_plan_service.update_activity_status(db, activity_id, req.is_completed)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/recommendations", response_model=List[ResourceRecommendationResponse], summary="Get study material recommendations")
async def get_recommendations(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_id = student_id if (student_id and current_user.role in [UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT]) else current_user.id
    recs = await recommendation_service.get_or_generate_recommendations(db, target_id)
    return recs


@router.post("/recommendations/feedback", summary="Record student recommendation feedback")
async def submit_recommendation_feedback(
    req: RecommendationFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await recommendation_service.record_feedback(
        db,
        student_id=current_user.id,
        recommendation_id=req.recommendation_id,
        is_helpful=req.is_helpful,
        comments=req.comments,
    )
    return res


@router.post("/adaptive/session", response_model=AdaptiveSessionStartResponse, summary="Start adaptive learning session")
async def start_adaptive_session(
    req: AdaptiveSessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await adaptive_learning_service.start_adaptive_session(
        db,
        student_id=current_user.id,
        subject_id=req.subject_id,
        topic_name=req.topic_name,
    )
    return res


@router.post("/adaptive/submit", response_model=AdaptiveSessionSubmitResponse, summary="Submit adaptive session responses")
async def submit_adaptive_session(
    req: AdaptiveSessionSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await adaptive_learning_service.submit_adaptive_session(
        db,
        session_id=req.session_id,
        student_id=current_user.id,
        answers=req.answers,
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res
