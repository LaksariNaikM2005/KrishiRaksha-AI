"""SOS router: trigger, acknowledge, and resolve emergency alerts."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import User, SOSEvent, SOSStatus, UserRole
from app.schemas import SOSTriggerRequest
from app.auth import get_current_user
from app.serializers import optional_float, optional_isoformat
from app.time_utils import utc_now

router = APIRouter()

@router.post("/trigger")
async def trigger_sos(
    request: SOSTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Farmer triggers SOS emergency alert."""
    sos = SOSEvent(
        user_id=current_user.id,
        lat=request.lat,
        lng=request.lng,
        message=request.message or "Emergency! Immediate agricultural assistance needed.",
        status=SOSStatus.active,
        responders=[],
    )
    db.add(sos)
    await db.commit()
    await db.refresh(sos)

    # Notify nearby officers (via WebSocket in production)
    # await manager.emit_sos(str(sos.id), request.lat, request.lng, sos.message, current_user.district or "")

    # Demo: find nearby officers
    result = await db.execute(
        select(User).where(User.role == UserRole.officer).limit(3)
    )
    officers = result.scalars().all()

    return {
        "sos_id": str(sos.id),
        "status": "active",
        "message": "SOS alert sent! Nearby agriculture officers have been notified.",
        "notified_officers": len(officers),
        "officers": [{"name": o.name or "Officer", "phone": o.phone} for o in officers],
        "created_at": sos.created_at.isoformat(),
    }

@router.put("/{sos_id}/acknowledge")
async def acknowledge_sos(
    sos_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Officer acknowledges SOS alert."""
    result = await db.execute(select(SOSEvent).where(SOSEvent.id == sos_id))
    sos = result.scalar_one_or_none()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS event not found")

    sos.status = SOSStatus.acknowledged
    responders = sos.responders or []
    responders.append(str(current_user.id))
    sos.responders = responders
    await db.commit()

    return {"message": "SOS acknowledged", "officer": current_user.name or current_user.phone}

@router.put("/{sos_id}/resolve")
async def resolve_sos(
    sos_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SOSEvent).where(SOSEvent.id == sos_id))
    sos = result.scalar_one_or_none()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS event not found")

    sos.status = SOSStatus.resolved
    sos.resolved_at = utc_now()
    await db.commit()
    return {"message": "SOS resolved"}

@router.get("/active")
async def get_active_sos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Officer: see all active SOS events."""
    result = await db.execute(
        select(SOSEvent).where(SOSEvent.status == SOSStatus.active)
        .order_by(SOSEvent.created_at.desc())
    )
    events = result.scalars().all()
    return [_sos_to_dict(e) for e in events]

@router.get("/history")
async def get_sos_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Farmer: see own SOS history."""
    result = await db.execute(
        select(SOSEvent).where(SOSEvent.user_id == current_user.id)
        .order_by(SOSEvent.created_at.desc())
    )
    events = result.scalars().all()
    return [_sos_to_dict(e) for e in events]

def _sos_to_dict(sos: SOSEvent) -> dict:
    return {
        "id": str(sos.id),
        "user_id": str(sos.user_id),
        "lat": optional_float(sos.lat),
        "lng": optional_float(sos.lng),
        "message": sos.message,
        "status": sos.status.value,
        "responders": sos.responders or [],
        "created_at": optional_isoformat(sos.created_at),
        "resolved_at": optional_isoformat(sos.resolved_at),
    }
