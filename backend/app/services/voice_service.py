"""
EduVerse AI - Multilingual Voice AI Assistant Service (Phase 6.5)
Features:
- Speech-to-Text transcript processing
- Language identification and response synthesis for Telugu (te-IN), Hindi (hi-IN), and English (en-US)
- Browser speech synthesis audio metadata generation (pitch, rate, voice profile)
- Consent-first non-persistent audio processing
"""
import logging
from typing import Dict, Any, Optional

from app.ai.gemini_service import gemini_service
from app.ai.language_service import detect_language
from app.schemas.innovation import VoiceProcessRequest, VoiceProcessResponse

logger = logging.getLogger("eduverse.voice")

VOICE_CONFIGS = {
    "te": {
        "lang_code": "te-IN",
        "voice_name": "Microsoft Mohan Online (Natural) - Telugu (India)",
        "pitch": 1.0,
        "rate": 0.95
    },
    "hi": {
        "lang_code": "hi-IN",
        "voice_name": "Microsoft Swara Online (Natural) - Hindi (India)",
        "pitch": 1.0,
        "rate": 0.95
    },
    "en": {
        "lang_code": "en-US",
        "voice_name": "Google US English",
        "pitch": 1.0,
        "rate": 1.0
    }
}


class VoiceService:
    async def process_voice_query(self, req: VoiceProcessRequest) -> VoiceProcessResponse:
        """
        Processes voice transcript, invokes generative completion in target language,
        and provides client-side speech synthesis configuration.
        """
        detected = req.detected_language or detect_language(req.audio_transcript)
        target_lang = req.target_language or detected

        system_instruction = (
            f"You are the EduVerse AI Voice Assistant. "
            f"You are speaking directly to a {req.role}. "
            f"Provide a clear, articulate, spoken-word answer in {target_lang}. "
            f"Keep the answer concise (2-3 sentences), easy to understand when spoken aloud, "
            f"and pedagogically encouraging."
        )

        res = await gemini_service.generate_completion(
            prompt=f"Voice Query:\n\"{req.audio_transcript}\"",
            system_instruction=system_instruction,
            language=target_lang,
            temperature=0.3
        )

        speech_config = VOICE_CONFIGS.get(target_lang, VOICE_CONFIGS["en"])

        return VoiceProcessResponse(
            query_transcript=req.audio_transcript,
            query_language=detected,
            response_text=res["text"],
            response_language=target_lang,
            audio_speech_config=speech_config,
            provider=res.get("provider", "eduverse-speech-engine")
        )


voice_service = VoiceService()
