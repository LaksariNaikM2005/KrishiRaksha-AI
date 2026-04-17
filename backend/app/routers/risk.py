"""Risk monitoring router: farm risk scores and regional heatmap."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import random
from app.time_utils import utc_now

from app.database import get_db
from app.models import User, Farm, RiskScore
from app.auth import get_current_user
from app.config import settings

router = APIRouter()

@router.get("/farm/{farm_id}")
async def get_farm_risk(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current risk score for a specific farm."""
    # Try database
    result = await db.execute(
        select(RiskScore).where(RiskScore.farm_id == farm_id)
        .order_by(desc(RiskScore.computed_at))
        .limit(1)
    )
    score = result.scalar_one_or_none()

    if score:
        return _risk_to_dict(score)

    # Demo: generate realistic risk scores
    return _demo_risk_score(farm_id)

@router.get("/regional")
async def get_regional_risk(
    lat: float = 15.3173,
    lng: float = 75.7139,
    radius_km: float = 50,
    crop_type: str | None = None,
):
    """Get regional risk heatmap data as GeoJSON."""
    # Generate hex grid GeoJSON for demo
    features = []
    for i in range(-3, 4):
        for j in range(-3, 4):
            cell_lat = lat + (i * 0.3)
            cell_lng = lng + (j * 0.35)
            risk = random.uniform(20, 90)
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [cell_lng - 0.15, cell_lat - 0.12],
                        [cell_lng + 0.15, cell_lat - 0.12],
                        [cell_lng + 0.15, cell_lat + 0.12],
                        [cell_lng - 0.15, cell_lat + 0.12],
                        [cell_lng - 0.15, cell_lat - 0.12],
                    ]]
                },
                "properties": {
                    "risk_score": round(risk, 1),
                    "risk_category": _score_to_category(risk),
                    "dominant_risk": random.choice(["weather", "pest", "disease"]),
                    "crop_type": crop_type or "mixed",
                    "lat": cell_lat,
                    "lng": cell_lng,
                }
            })

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "center_lat": lat,
            "center_lng": lng,
            "radius_km": radius_km,
            "generated_at": utc_now().isoformat(),
        }
    }

@router.post("/compute")
async def compute_risk(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger manual risk re-computation for a farm."""
    result = await db.execute(select(Farm).where(Farm.id == farm_id))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Compute risk (demo/stub)
    risk_data = _demo_risk_score(farm_id)

    risk = RiskScore(
        farm_id=farm_id,
        overall_score=risk_data["overall_score"],
        weather_risk=risk_data["weather_risk"],
        pest_risk=risk_data["pest_risk"],
        disease_risk=risk_data["disease_risk"],
        humidity_risk=risk_data["humidity_risk"],
        computed_at=utc_now(),
    )
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    return _risk_to_dict(risk)

def _demo_risk_score(farm_id: str) -> dict:
    seed = sum(ord(c) for c in farm_id) % 100
    weather_risk = 30 + (seed % 50)
    pest_risk = 20 + ((seed * 3) % 60)
    disease_risk = 40 + ((seed * 7) % 45)
    humidity_risk = 25 + ((seed * 11) % 55)
    overall = (weather_risk + pest_risk + disease_risk + humidity_risk) / 4
    return {
        "farm_id": farm_id,
        "overall_score": round(overall, 1),
        "weather_risk": round(weather_risk, 1),
        "pest_risk": round(pest_risk, 1),
        "disease_risk": round(disease_risk, 1),
        "humidity_risk": round(humidity_risk, 1),
        "soil_health": round(70 - (seed % 30), 1),
        "historical_trend": round(30 + (seed % 40), 1),
        "risk_category": _score_to_category(overall),
        "computed_at": utc_now().isoformat(),
    }

def _score_to_category(score: float) -> str:
    if score >= 75: return "critical"
    if score >= 55: return "high"
    if score >= 35: return "medium"
    return "low"

def _risk_to_dict(score: RiskScore) -> dict:
    return {
        "farm_id": str(score.farm_id),
        "overall_score": float(score.overall_score),
        "weather_risk": float(score.weather_risk),
        "pest_risk": float(score.pest_risk),
        "disease_risk": float(score.disease_risk),
        "humidity_risk": float(score.humidity_risk),
        "risk_category": _score_to_category(float(score.overall_score)),
        "computed_at": score.computed_at.isoformat() if score.computed_at else None,
    }
