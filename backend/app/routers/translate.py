"""Translation router: multi-language support routing."""
from fastapi import APIRouter
from app.schemas import TranslateRequest

router = APIRouter()

SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English", "native_name": "English", "tts_supported": True, "stt_supported": True},
    {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "tts_supported": True, "stt_supported": True},
    {"code": "kn", "name": "Kannada", "native_name": "ಕನ್ನಡ", "tts_supported": True, "stt_supported": True},
    {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "tts_supported": True, "stt_supported": True},
    {"code": "ta", "name": "Tamil", "native_name": "தமிழ்", "tts_supported": True, "stt_supported": True},
    {"code": "ml", "name": "Malayalam", "native_name": "മലയാളം", "tts_supported": True, "stt_supported": False},
    {"code": "mr", "name": "Marathi", "native_name": "मराठी", "tts_supported": True, "stt_supported": True},
    {"code": "gu", "name": "Gujarati", "native_name": "ગુજરાતી", "tts_supported": True, "stt_supported": False},
    {"code": "pa", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ", "tts_supported": False, "stt_supported": False},
    {"code": "bn", "name": "Bengali", "native_name": "বাংলা", "tts_supported": True, "stt_supported": False},
    {"code": "or", "name": "Odia", "native_name": "ଓଡ଼ିଆ", "tts_supported": False, "stt_supported": False},
]

# Simple demo translations
DEMO_TRANSLATIONS = {
    ("en", "hi"): {
        "Rice Blast": "धान का झोंका रोग",
        "High severity": "उच्च गंभीरता",
        "Apply fungicide": "कवकनाशी लगाएं",
    },
}

@router.post("/translate")
async def translate_text(request: TranslateRequest):
    """Translate text between languages using IndicTrans2."""
    key = (request.from_lang, request.to_lang)
    mapped = DEMO_TRANSLATIONS.get(key, {})
    # Check if text matches any demo key
    for src, tgt in mapped.items():
        if src.lower() in request.text.lower():
            return {"translated_text": tgt, "from_lang": request.from_lang, "to_lang": request.to_lang}

    # Passthrough in demo mode
    return {
        "translated_text": request.text,
        "from_lang": request.from_lang,
        "to_lang": request.to_lang,
        "note": "IndicTrans2 integration pending. Text passed through in demo mode.",
    }

@router.get("/languages")
async def list_languages():
    """List all supported languages."""
    return {"languages": SUPPORTED_LANGUAGES}
