"""
EduVerse AI - Academic Analytics API Router (Phase 5)
Endpoints for Student Trends, Teacher Class Intelligence, and Institutional Overview.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.analytics import (
    StudentTrendAnalyticsResponse,
    ClassLevelAnalyticsResponse,
    InstitutionAnalyticsResponse,
)
from app.analytics.performance_analytics import performance_analytics_service

router = APIRouter()


@router.get("/student", response_model=StudentTrendAnalyticsResponse, summary="Get student longitudinal trends")
async def get_student_analytics(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_id = student_id if (student_id and current_user.role in [UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT]) else current_user.id
    res = await performance_analytics_service.get_student_trend_analytics(db, target_id)
    return res


@router.get("/teacher/class/{class_id}", response_model=ClassLevelAnalyticsResponse, summary="Get classroom learning analytics")
async def get_class_analytics(
    class_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await performance_analytics_service.get_class_level_analytics(db, class_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/institution", response_model=InstitutionAnalyticsResponse, summary="Get institutional academic overview")
async def get_institution_analytics(
    institution_id: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TEACHER])),
    db: AsyncSession = Depends(get_db),
):
    inst_id = institution_id or current_user.institution_id or "inst-default"
    res = await performance_analytics_service.get_institution_analytics(db, inst_id)
    return res
