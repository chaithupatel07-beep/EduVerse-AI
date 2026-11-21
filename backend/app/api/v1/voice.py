"""
EduVerse AI - Multilingual Voice AI Assistant Endpoints (Phase 6.5)
"""
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.innovation import VoiceProcessRequest, VoiceProcessResponse
from app.services.voice_service import voice_service

router = APIRouter(prefix="/voice", tags=["Voice Multilingual Assistant"])


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice_query(
    req: VoiceProcessRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Process speech-to-text transcript, generate multilingual spoken answer, and return TTS configuration.
    Supports Telugu (te-IN), Hindi (hi-IN), and English (en-US).
    """
    try:
        return await voice_service.process_voice_query(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
