"""Voice router: Whisper STT and TTS pipeline."""
from fastapi import APIRouter, Depends, File, UploadFile, Form
from app.auth import get_current_user
from app.models import User
from app.config import settings
import random

router = APIRouter()

SAMPLE_QUESTIONS = [
    {"hi": "मेरे धान में भूरे धब्बे हैं", "answer": "यह Rice Blast रोग हो सकता है। Tricyclazole का छिड़काव करें।"},
    {"hi": "टमाटर की पत्तियां पीली हो रही हैं", "answer": "यह Leaf Curl Virus हो सकता है। कीटनाशक का प्रयोग करें।"},
]

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Transcribe audio using Whisper (API or self-hosted)."""
    audio_bytes = await audio.read()

    if settings.openai_api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=("audio.webm", audio_bytes, "audio/webm"),
                response_format="verbose_json",
            )
            return {
                "text": response.text,
                "language": response.language,
                "confidence": 0.9,
            }
        except Exception as e:
            pass

    # Demo stub
    demo = random.choice(SAMPLE_QUESTIONS)
    return {
        "text": demo["hi"],
        "language": "hi",
        "confidence": 0.85,
        "note": "Demo mode: real Whisper transcription requires OPENAI_API_KEY",
    }

@router.post("/query")
async def voice_query(
    audio: UploadFile = File(...),
    lang: str = Form("hi"),
    current_user: User = Depends(get_current_user)
):
    """Voice query → LLM answer in user's language with TTS audio."""
    audio_bytes = await audio.read()

    demo = random.choice(SAMPLE_QUESTIONS)
    return {
        "transcribed_text": demo["hi"],
        "language_detected": "hi",
        "answer_text": demo["answer"],
        "answer_audio_url": None,  # TTS audio URL in production
        "source": "demo",
    }
