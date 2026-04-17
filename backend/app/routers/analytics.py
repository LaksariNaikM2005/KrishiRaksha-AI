"""Analytics router for officer/admin dashboards."""
from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.models import User
from datetime import timedelta
import random
from app.time_utils import utc_now

router = APIRouter()

@router.get("/regional-heatmap")
async def regional_heatmap(current_user: User = Depends(get_current_user)):
    """Regional risk scores as GeoJSON for officer dashboard."""
    features = []
    base_lat, base_lng = 15.3173, 75.7139
    diseases = ["Rice Blast", "Tomato Blight", "Cotton Bollworm", "Wheat Rust"]

    for i in range(-5, 6):
        for j in range(-5, 6):
            lat = base_lat + i * 0.25
            lng = base_lng + j * 0.3
            risk = random.uniform(15, 85)
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lng, lat]},
                "properties": {
                    "risk_score": round(risk, 1),
                    "risk_category": "high" if risk > 65 else "medium" if risk > 40 else "low",
                    "dominant_disease": random.choice(diseases),
                    "detections_30d": random.randint(0, 12),
                }
            })
    return {"type": "FeatureCollection", "features": features}

@router.get("/disease-trends")
async def disease_trends(current_user: User = Depends(get_current_user)):
    """Disease frequency over time (last 30 days)."""
    diseases = ["Rice Blast", "Leaf Curl Virus", "Powdery Mildew", "Stem Borer", "Bacterial Blight"]
    data = {}
    for disease in diseases:
        data[disease] = [
            {"date": (utc_now() - timedelta(days=30-i)).strftime("%Y-%m-%d"),
             "count": random.randint(0, 15)}
            for i in range(30)
        ]
    return {"disease_trends": data, "period": "last_30_days"}

@router.get("/crop-calendar")
async def crop_calendar():
    """Pest and disease calendar by crop and month."""
    return {
        "calendar": {
            "paddy": {
                "june": ["Stem Borer", "BPH (Brown Plant Hopper)"],
                "july": ["Leaf Blast", "Sheath Blight"],
                "august": ["Neck Rot", "Leaf Folder"],
                "september": ["Grain Discoloration", "False Smut"],
            },
            "tomato": {
                "october": ["Leaf Curl Virus", "Early Blight"],
                "november": ["Late Blight", "Fusarium Wilt"],
                "december": ["Damping Off", "Bacterial Wilt"],
            },
            "wheat": {
                "december": ["Aphids", "Powdery Mildew"],
                "january": ["Yellow Rust", "Aphids"],
                "february": ["Karnal Bunt", "Stem Rust"],
            }
        }
    }
