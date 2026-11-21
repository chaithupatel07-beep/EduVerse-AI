"""
EduVerse AI - Gamification and Verified Achievements Endpoints (Phase 6.5)
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.innovation import GamificationProfile, PointTransaction, EarnedBadge, AchievementBadge
from app.schemas.innovation import (
    GamificationProfileResponse,
    BadgeResponse,
    LeaderboardEntry,
)
from app.services.gamification_service import gamification_service

router = APIRouter(prefix="/gamification", tags=["Gamification & Achievements"])


@router.get("/profile", response_model=GamificationProfileResponse)
async def get_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve user's gamification status: XP, level, title, streak, earned badges, and recent point transactions.
    """
    inst_id = current_user.institution_id or "inst-default"
    prof = await gamification_service.get_or_create_profile(db, current_user.id, inst_id)

    # Fetch recent transactions
    stmt_tx = select(PointTransaction).where(
        PointTransaction.profile_id == prof.id
    ).order_by(PointTransaction.created_at.desc()).limit(10)
    res_tx = await db.execute(stmt_tx)
    txs = res_tx.scalars().all()

    tx_list = [
        {"id": t.id, "amount": t.amount, "reason": t.reason, "created_at": t.created_at.isoformat()}
        for t in txs
    ]

    # Explicitly join with AchievementBadge to avoid async greenlet lazy-loading errors
    stmt_eb = (
        select(EarnedBadge, AchievementBadge)
        .join(AchievementBadge, EarnedBadge.badge_id == AchievementBadge.id)
        .where(EarnedBadge.profile_id == prof.id)
    )
    res_eb = await db.execute(stmt_eb)
    eb_rows = res_eb.all()

    earned_badges_data = [
        {
            "id": eb.id,
            "badge_id": eb.badge_id,
            "badge": {
                "id": b.id,
                "badge_code": b.badge_code,
                "name": b.name,
                "description": b.description,
                "category": b.category,
                "icon": b.icon,
                "xp_reward": b.xp_reward,
                "criteria_summary": b.criteria_summary,
            },
            "earned_at": eb.earned_at,
            "evidence_note": eb.evidence_note,
        }
        for eb, b in eb_rows
    ]

    return {
        "id": prof.id,
        "user_id": prof.user_id,
        "total_xp": prof.total_xp,
        "current_level": prof.current_level,
        "level_title": prof.level_title,
        "streak_days": prof.streak_days,
        "longest_streak_days": prof.longest_streak_days,
        "daily_goal_xp": prof.daily_goal_xp,
        "today_xp": prof.today_xp,
        "leaderboard_opt_in": prof.leaderboard_opt_in,
        "earned_badges": earned_badges_data,
        "recent_transactions": tx_list,
    }


@router.get("/achievements", response_model=List[Dict[str, Any]])
@router.get("/achievements/", include_in_schema=False)
async def get_achievement_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all system achievement badges with the user's earned status.
    """
    return await gamification_service.get_achievements(db, current_user.id)


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
@router.get("/leaderboard/", include_in_schema=False)
async def get_leaderboard(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the institution-level learning leaderboard for opted-in students.
    """
    inst_id = current_user.institution_id or "inst-default"
    return await gamification_service.get_leaderboard(db, inst_id, limit=limit)


@router.post("/toggle-leaderboard")
async def toggle_leaderboard_privacy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle leaderboard opt-in status for student privacy.
    """
    inst_id = current_user.institution_id or "inst-default"
    prof = await gamification_service.get_or_create_profile(db, current_user.id, inst_id)
    prof.leaderboard_opt_in = not prof.leaderboard_opt_in
    await db.commit()
    return {
        "leaderboard_opt_in": prof.leaderboard_opt_in,
        "message": f"Leaderboard visibility set to {prof.leaderboard_opt_in}."
    }
