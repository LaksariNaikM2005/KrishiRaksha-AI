"""Farms router: CRUD for farm management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models import User, Farm
from app.schemas import FarmCreate, FarmUpdate
from app.auth import get_current_user
from app.serializers import optional_float, optional_isoformat

router = APIRouter()

@router.post("")
async def create_farm(
    farm_data: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    farm = Farm(
        user_id=current_user.id,
        **farm_data.model_dump()
    )
    db.add(farm)
    await db.commit()
    await db.refresh(farm)
    return _farm_to_dict(farm)

@router.get("")
async def list_farms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Farm).where(Farm.user_id == current_user.id))
    farms = result.scalars().all()
    return [_farm_to_dict(f) for f in farms]

@router.get("/{farm_id}")
async def get_farm(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Farm).where(
        Farm.id == farm_id, Farm.user_id == current_user.id
    ))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return _farm_to_dict(farm)

@router.put("/{farm_id}")
async def update_farm(
    farm_id: str,
    updates: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Farm).where(
        Farm.id == farm_id, Farm.user_id == current_user.id
    ))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(farm, field, value)
    await db.commit()
    await db.refresh(farm)
    return _farm_to_dict(farm)

@router.delete("/{farm_id}")
async def delete_farm(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Farm).where(
        Farm.id == farm_id, Farm.user_id == current_user.id
    ))
    farm = result.scalar_one_or_none()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    await db.delete(farm)
    await db.commit()
    return {"message": "Farm deleted"}

def _farm_to_dict(farm: Farm) -> dict:
    return {
        "id": str(farm.id),
        "user_id": str(farm.user_id),
        "name": farm.name,
        "crop_type": farm.crop_type,
        "crop_stage": farm.crop_stage.value if farm.crop_stage else None,
        "area_acres": optional_float(farm.area_acres),
        "boundary": farm.boundary,
        "soil_type": farm.soil_type,
        "irrigation_type": farm.irrigation_type,
        "created_at": optional_isoformat(farm.created_at),
    }
