"""
EduVerse AI - Visual Knowledge Map Endpoints (Phase 6.5)
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.innovation import (
    KnowledgeMapGraphResponse,
    KnowledgeNodeDetailResponse,
)
from app.services.knowledge_map_service import knowledge_map_service

router = APIRouter(prefix="/knowledge-map", tags=["Visual Knowledge Map"])


@router.get("", response_model=KnowledgeMapGraphResponse)
@router.get("/", include_in_schema=False)
@router.get("/graph", response_model=KnowledgeMapGraphResponse)
async def get_knowledge_map_graph(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the full interactive curriculum knowledge map graph overlaid with personalized student mastery states.
    """
    inst_id = current_user.institution_id or "inst-default"
    graph = await knowledge_map_service.get_map_for_student(db, current_user.id, inst_id)
    return graph


@router.get("/node/{node_id}/details", response_model=KnowledgeNodeDetailResponse)
async def get_node_details(
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve node prerequisites, unlocked topics, and study links.
    """
    try:
        details = await knowledge_map_service.get_node_details(db, node_id, current_user.id)
        return details
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
