"""Advisory router: generate and retrieve AI advisories."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.models import User, Advisory, DiseaseDetection
from app.auth import get_current_user
from app.config import settings
from app.time_utils import utc_now

router = APIRouter()

DEMO_ADVISORIES = {
    "Rice Blast (Magnaporthe oryzae)": {
        "text_en": """## Rice Blast (Magnaporthe oryzae) Advisory

**Disease Name:** Rice Blast | धान का झोंका रोग (Dhaan Ka Jhonka Rog)

**Why it happened:** Rice blast is caused by the fungus Magnaporthe oryzae, which thrives in conditions of high humidity (>90%), temperatures between 24-28°C, and excessive nitrogen application. The recent rains and warm temperatures have created ideal conditions for its spread.

**Immediate Action (within 24 hours):**
1. Stop nitrogen fertilizer application immediately
2. Drain excess water from the field
3. Begin fungicide application at earliest opportunity

**Treatment Plan:**
1. **Day 1:** Spray Tricyclazole 75% WP @ 0.6g/L water or Carbendazim 50% WP @ 1g/L water
2. **Day 1:** Cover all affected and surrounding plants thoroughly
3. **Day 4:** Second spray of Isoprothiolane 40% EC @ 1.5ml/L water
4. **Day 8:** Third spray if disease persists - Azoxystrobin 23% SC @ 1ml/L water
5. **Day 14:** Monitor and do preventive spray on healthy areas

**Organic Alternative:** Apply mixture of Pseudomonas fluorescens (2.5kg/ha) + Trichoderma viride (2.5kg/ha) mixed in 500L water. Spray at 15-day intervals.

**Prevention for Next Season:**
- Use resistant varieties: IR64, BPT 5204, Swarna Sub1
- Avoid excess nitrogen - split doses preferred
- Maintain field hygiene, remove crop residues

**When to Call Agri-Officer:** If disease spreads to >30% of field within 48 hours despite treatment, or if you see neck rot (panicle stage blast)

**Estimated Treatment Cost:** ₹800–1,200 per acre""",
        "treatment_steps": [
            {"step": 1, "action": "Spray Tricyclazole 75% WP", "product": "Beam / Blast No", "dose": "0.6g per liter water", "timing": "Day 1, early morning before 8 AM", "estimated_cost_per_acre": 280},
            {"step": 2, "action": "Drain excess water", "product": "N/A", "dose": "N/A", "timing": "Immediately", "estimated_cost_per_acre": 0},
            {"step": 3, "action": "Second spray Isoprothiolane", "product": "Fuji-one 40 EC", "dose": "1.5ml per liter", "timing": "Day 4", "estimated_cost_per_acre": 320},
            {"step": 4, "action": "Monitor and third spray if needed", "product": "Azoxystrobin (Amistar)", "dose": "1ml per liter", "timing": "Day 8", "estimated_cost_per_acre": 450},
            {"step": 5, "action": "Continue monitoring weekly", "product": "None if clear", "dose": "—", "timing": "Ongoing", "estimated_cost_per_acre": 0},
        ],
        "urgency": "urgent",
    }
}

from app.events import publish_event

_advisory_cache: dict = {}

async def _create_demo_advisory(detection_id: str, advisory_id: str, user_id: str = "1"):
    """Store a demo advisory and notify socket server."""
    _advisory_cache[advisory_id] = {
        "detection_id": detection_id,
        "created_at": utc_now().isoformat(),
    }
    
    # Notify socket server
    await publish_event("advisory_ready", {
        "user_id": user_id,
        "advisory_id": advisory_id,
        "detection_id": detection_id,
        "message": "🌾 Your AI Crop Advisory is ready!",
        "timestamp": utc_now().isoformat()
    })

@router.get("/{advisory_id}")
async def get_advisory(
    advisory_id: str,
    lang: str = "en",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get advisory by ID with translations."""
    # Try database first
    result = await db.execute(select(Advisory).where(Advisory.id == advisory_id))
    advisory = result.scalar_one_or_none()

    if advisory:
        return _advisory_to_dict(advisory, lang)

    # Demo mode: return a rich pre-built advisory
    demo_key = list(DEMO_ADVISORIES.keys())[0]
    demo = DEMO_ADVISORIES[demo_key]
    return {
        "id": advisory_id,
        "disease_name": demo_key,
        "severity": "high",
        "urgency": demo["urgency"],
        "text_en": demo["text_en"],
        "text_translated": {
            "hi": "## धान का झोंका रोग सलाह\n\nयह बीमारी Magnaporthe oryzae कवक से होती है...",
            "kn": "## ಭತ್ತದ ಸ್ಫೋಟ ರೋಗ ಸಲಹೆ\n\nಈ ರೋಗ Magnaporthe oryzae ಶಿಲೀಂಧ್ರದಿಂದ ಬರುತ್ತದೆ...",
        },
        "audio_url_map": {"hi": None, "en": None},
        "treatment_steps": demo["treatment_steps"],
        "organic_steps": [
            {"step": 1, "action": "Apply Pseudomonas fluorescens @ 2.5kg/ha", "product": "P. fluorescens bioagent", "timing": "Day 1"},
            {"step": 2, "action": "Spray Neem oil @ 5ml/L + garlic extract", "product": "Cold-pressed neem oil", "timing": "Day 1 and Day 7"},
            {"step": 3, "action": "Apply Trichoderma viride to soil", "product": "Trichoderma bioagent", "timing": "Day 3"},
        ],
        "prevention": [
            "Use certified disease-resistant seed varieties",
            "Avoid excess nitrogen fertilizer",
            "Maintain proper plant spacing for air circulation",
            "Remove and burn infected crop residue",
        ],
        "escalation_triggers": [
            "Disease spreads to more than 30% of field",
            "Neck rot visible at panicle stage",
            "No improvement after 5 days of treatment",
        ],
        "estimated_cost_inr_per_acre": 1000,
        "created_at": utc_now().isoformat(),
        "farm_name": "Demo Farm",
    }

@router.post("/generate")
async def generate_advisory(
    detection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger advisory generation for a detection."""
    result = await db.execute(select(DiseaseDetection).where(DiseaseDetection.id == detection_id))
    detection = result.scalar_one_or_none()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    advisory_id = str(uuid.uuid4())
    await _create_demo_advisory(detection_id, advisory_id)
    return {"advisory_id": advisory_id, "status": "generating"}

@router.post("/voice-read/{advisory_id}")
async def get_advisory_audio(advisory_id: str, lang: str = "hi"):
    """Return audio URL for advisory text-to-speech."""
    # In production: generate TTS audio and return signed URL
    return {
        "advisory_id": advisory_id,
        "language": lang,
        "audio_url": f"https://storage.krishiraksha.ai/audio/advisory_{advisory_id}_{lang}.mp3",
        "duration_seconds": 180,
        "note": "Audio generation via Google Cloud TTS in production",
    }

def _advisory_to_dict(advisory: Advisory, lang: str) -> dict:
    return {
        "id": str(advisory.id),
        "detection_id": str(advisory.detection_id) if advisory.detection_id else None,
        "farm_id": str(advisory.farm_id) if advisory.farm_id else None,
        "severity": "high",
        "urgency": advisory.urgency.value if advisory.urgency else "routine",
        "text_en": advisory.text_en,
        "text_translated": advisory.text_translated or {},
        "audio_url_map": advisory.audio_url_map or {},
        "treatment_steps": advisory.treatment_steps or [],
        "created_at": advisory.created_at.isoformat() if advisory.created_at else None,
    }
