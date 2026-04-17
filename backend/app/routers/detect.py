"""Disease detection router with YOLOv8 stub + real image processing."""
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io
import hashlib
import uuid
from pathlib import Path
from typing import Any, Dict, List

from app.database import get_db
from app.models import User, Farm, DiseaseDetection, Severity
from app.auth import get_current_user
from app.config import settings
from app.time_utils import utc_now

router = APIRouter()

# Mock disease database for demo/stub mode
DEMO_DISEASES: List[Dict[str, Any]] = [
    {"name": "Rice Blast (Magnaporthe oryzae)", "name_hi": "धान का झोंका रोग",
     "crops": ["rice", "paddy"], "severity": "high", "confidence": 87.3},
    {"name": "Tomato Late Blight (Phytophthora infestans)", "name_hi": "टमाटर का झुलसा",
     "crops": ["tomato"], "severity": "critical", "confidence": 91.5},
    {"name": "Cotton Bollworm (Helicoverpa armigera)", "name_hi": "कपास का बॉलवर्म",
     "crops": ["cotton"], "severity": "high", "confidence": 84.2},
    {"name": "Wheat Rust (Puccinia striiformis)", "name_hi": "गेहूं का रतुआ",
     "crops": ["wheat"], "severity": "medium", "confidence": 78.6},
    {"name": "Powdery Mildew (Erysiphe spp.)", "name_hi": "पाउडरी मिल्ड्यू",
     "crops": ["wheat", "tomato", "chilli"], "severity": "medium", "confidence": 72.1},
    {"name": "Leaf Curl Virus (TYLCV)", "name_hi": "पत्ती मोड़ वायरस",
     "crops": ["tomato", "chilli"], "severity": "high", "confidence": 89.0},
    {"name": "Stem Borer (Scirpophaga incertulas)", "name_hi": "तना छेदक",
     "crops": ["rice", "paddy", "sugarcane"], "severity": "medium", "confidence": 82.4},
    {"name": "Bacterial Leaf Blight (Xanthomonas oryzae)", "name_hi": "जीवाणु पर्ण झुलसा",
     "crops": ["rice", "paddy"], "severity": "high", "confidence": 85.7},
]

@router.post("/image")
async def detect_disease_from_image(
    image: UploadFile = File(...),
    farm_id: str = Form(None),
    lat: float = Form(None),
    lng: float = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload leaf image and run disease detection (YOLOv8 or stub)."""
    # Validate file type
    if not (image.content_type and image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="File must be an image")

    if image.size and image.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    # Read image bytes
    image_bytes = await image.read()

    # Validate farm belongs to user
    farm = None
    if farm_id:
        result = await db.execute(select(Farm).where(Farm.id == farm_id))
        farm = result.scalar_one_or_none()

    # Run detection (stub for demo, real YOLOv8 when model available)
    detection_result = await _run_detection(image_bytes, farm)

    # Save image to storage (stub URL for demo)
    image_url = f"https://storage.krishiraksha.ai/detections/{uuid.uuid4()}.jpg"

    # Save detection to DB
    severity_map = {"low": Severity.low, "medium": Severity.medium,
                    "high": Severity.high, "critical": Severity.critical}
    detection = DiseaseDetection(
        user_id=current_user.id,
        farm_id=farm_id,
        image_url=image_url,
        detected_disease=detection_result["disease"],
        confidence=detection_result["confidence"],
        severity=severity_map.get(detection_result["severity"], Severity.medium),
        lat=lat,
        lng=lng,
        detected_at=utc_now(),
    )
    db.add(detection)
    await db.commit()
    await db.refresh(detection)

    # Enqueue advisory generation (Celery task)
    advisory_id = await _enqueue_advisory_generation(str(detection.id), current_user, farm)

    return {
        "detection_id": str(detection.id),
        "disease": detection_result["disease"],
        "disease_hi": detection_result.get("disease_hi", ""),
        "confidence": detection_result["confidence"],
        "severity": detection_result["severity"],
        "inference_source": detection_result.get("inference_source", "unknown"),
        "advisory_id": advisory_id,
        "message": "Detection complete. Advisory is being generated...",
        "affected_area_percent": detection_result.get("affected_area_percent", 15),
    }

@router.post("/voice")
async def detect_from_voice(
    audio: UploadFile = File(...),
    farm_id: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit voice description of symptoms and get advisory."""
    # Stub transcription for demo
    transcription = "पत्तियों पर भूरे धब्बे हैं और पत्तियां पीली हो रही हैं"
    # In production: call Whisper API, then LLM for symptom extraction

    detection = DiseaseDetection(
        user_id=current_user.id,
        farm_id=farm_id,
        detected_disease="Leaf Spot Disease (suspected from voice)",
        confidence=65.0,
        severity=Severity.medium,
        detected_at=utc_now(),
    )
    db.add(detection)
    await db.commit()
    await db.refresh(detection)

    advisory_id = await _enqueue_advisory_generation(str(detection.id), current_user, None)

    return {
        "transcription": transcription,
        "detection_id": str(detection.id),
        "disease": "Leaf Spot Disease (suspected)",
        "severity": "medium",
        "advisory_id": advisory_id,
        "message": "Voice analysis complete. Advisory generating...",
    }

async def _run_detection(image_bytes: bytes, farm=None) -> dict:
    """Run YOLOv8 detection; fallback to deterministic demo stub if enabled."""
    # Real YOLOv8 inference (preferred whenever weights are available).
    try:
        from ultralytics import YOLO
        from PIL import Image

        model_candidates = [
            Path(__file__).resolve().parents[2] / "models" / "weights" / "krishiraksha_yolov8n-cls.pt",
            Path(__file__).resolve().parents[2] / "models" / "weights" / "krishiraksha_yolov8n.pt",
            Path(__file__).resolve().parents[2] / "yolov8n-cls.pt",
            Path(__file__).resolve().parents[2] / "yolov8n.pt",
        ]
        model_path = next((candidate for candidate in model_candidates if candidate.exists()), None)
        if model_path is None:
            raise FileNotFoundError("No trained YOLO weights found")

        import torch

        original_torch_load = torch.load

        def trusted_torch_load(*args, **kwargs):
            kwargs.setdefault("weights_only", False)
            return original_torch_load(*args, **kwargs)

        torch.load = trusted_torch_load  # type: ignore[assignment]

        model = YOLO(str(model_path))
        img = Image.open(io.BytesIO(image_bytes))
        results = model.predict(img, verbose=False)

        if results:
            result = results[0]
            if getattr(result, "probs", None) is not None:
                cls_id = int(result.probs.top1)
                confidence = float(result.probs.top1conf) * 100
                disease_name = result.names[cls_id]
                return {
                    "disease": disease_name,
                    "confidence": confidence,
                    "severity": _conf_to_severity(confidence),
                    "inference_source": "yolo",
                }

            if getattr(result, "boxes", None):
                box = result.boxes[0]
                cls_id = int(box.cls[0])
                confidence = float(box.conf[0]) * 100
                disease_name = result.names[cls_id]
                return {
                    "disease": disease_name,
                    "confidence": confidence,
                    "severity": _conf_to_severity(confidence),
                    "inference_source": "yolo",
                }

    except Exception:
        pass

    if settings.demo_mode:
        # Deterministic demo behavior: same image -> same result.
        digest = hashlib.sha256(image_bytes).digest()

        # Smart stub: narrow candidate diseases by farm crop type.
        if farm and farm.crop_type:
            crop = farm.crop_type.lower()
            matching = [d for d in DEMO_DISEASES if any(c in crop for c in d["crops"])]
            candidates = matching if matching else DEMO_DISEASES
        else:
            candidates = DEMO_DISEASES

        idx = int.from_bytes(digest[:4], "big") % len(candidates)
        disease = candidates[idx]

        # Deterministic confidence jitter in [-5, +5].
        conf_jitter = ((digest[4] / 255.0) * 10.0) - 5.0
        confidence = max(0.0, min(100.0, disease["confidence"] + conf_jitter))

        # Deterministic affected area in [10, 45].
        affected_area = 10 + (digest[5] % 36)

        return {
            "disease": disease["name"],
            "disease_hi": disease["name_hi"],
            "confidence": round(confidence, 1),
            "severity": disease["severity"],
            "inference_source": "demo",
            "affected_area_percent": affected_area,
        }

    return {
        "disease": "Unknown Disease",
        "confidence": 60.0,
        "severity": "medium",
        "inference_source": "unknown",
    }

async def _enqueue_advisory_generation(detection_id: str, user, farm) -> str:
    """Enqueue Celery task or generate synchronously in demo mode."""
    advisory_id = str(uuid.uuid4())
    if settings.demo_mode:
        # Generate a pre-built advisory for demo
        from app.routers.advisory import _create_demo_advisory
        await _create_demo_advisory(detection_id, advisory_id)
    else:
        try:
            from app.celery_app import generate_advisory
            generate_advisory.delay(detection_id)
        except Exception:
            pass
    return advisory_id

def _conf_to_severity(confidence: float) -> str:
    if confidence >= 85: return "high"
    if confidence >= 70: return "medium"
    return "low"
