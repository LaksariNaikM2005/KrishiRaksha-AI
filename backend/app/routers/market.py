"""Marketplace router: listings, orders, and AI recommendations."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models import User, MarketplaceListing, Order, OrderStatus, MarketCategory
from app.schemas import MarketplaceListingCreate, OrderCreate
from app.auth import get_current_user
from app.serializers import optional_float, optional_isoformat

router = APIRouter()

@router.get("/listings")
async def list_products(
    category: Optional[str] = None,
    district: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(MarketplaceListing)
    if category:
        query = query.where(MarketplaceListing.category == category)
    if district:
        query = query.where(MarketplaceListing.district == district)
    result = await db.execute(query.limit(50))
    listings = result.scalars().all()
    return [_listing_to_dict(l) for l in listings]

@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MarketplaceListing).where(MarketplaceListing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _listing_to_dict(listing)

@router.post("/listings")
async def create_listing(
    data: MarketplaceListingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    listing = MarketplaceListing(seller_id=current_user.id, **data.model_dump())
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return _listing_to_dict(listing)

@router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: str,
    data: MarketplaceListingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MarketplaceListing).where(
        MarketplaceListing.id == listing_id, MarketplaceListing.seller_id == current_user.id
    ))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found or unauthorized")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(listing, k, v)
    await db.commit()
    return _listing_to_dict(listing)

@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MarketplaceListing).where(
        MarketplaceListing.id == listing_id, MarketplaceListing.seller_id == current_user.id
    ))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(listing)
    await db.commit()
    return {"message": "Deleted"}

@router.get("/recommended")
async def get_ai_recommendations(
    detection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI recommends products for a specific disease detection."""
    # Demo recommendations
    return {
        "detection_id": detection_id,
        "recommended_products": [
            {
                "rank": 1,
                "product_name": "Tricyclazole 75% WP (Beam Fungicide)",
                "category": "fungicide",
                "reason": "Most effective against Rice Blast disease",
                "recommended_dose": "0.6g per liter of water",
                "application_timing": "Early morning, 2-3 applications",
                "price_per_unit": 280,
                "unit": "250g packet",
                "available_district": "Bengaluru Rural",
                "seller": "AgriMart Suppliers",
                "is_verified": True,
            },
            {
                "rank": 2,
                "product_name": "Isoprothiolane 40% EC (Fuji-one)",
                "category": "fungicide",
                "reason": "Excellent systemic fungicide for Blast control",
                "recommended_dose": "1.5ml per liter",
                "application_timing": "4 days after first spray",
                "price_per_unit": 320,
                "unit": "500ml bottle",
                "available_district": "Bengaluru Rural",
                "seller": "Karnataka Agri Store",
                "is_verified": True,
            },
        ]
    }

@router.post("/orders")
async def place_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MarketplaceListing).where(MarketplaceListing.id == data.listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Product not found")

    order = Order(
        buyer_id=current_user.id,
        listing_id=data.listing_id,
        quantity=data.quantity,
        total_price=float(listing.price) * data.quantity,
        delivery_address=data.delivery_address,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return {"order_id": str(order.id), "total_price": float(order.total_price), "status": "pending"}

@router.get("/orders")
async def list_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.buyer_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    return [{"id": str(o.id), "status": o.status.value, "total_price": float(o.total_price)} for o in result.scalars().all()]

@router.post("/payment/create")
async def create_payment(listing_id: str, amount: float, current_user: User = Depends(get_current_user)):
    return {
        "order_id": f"order_{uuid.uuid4().hex[:12]}",
        "amount": int(amount * 100),
        "currency": "INR",
        "razorpay_key": "rzp_test_demo",
        "note": "Razorpay integration: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real payments",
    }

@router.post("/payment/verify")
async def verify_payment(payment_id: str, order_id: str, signature: str):
    return {"verified": True, "payment_id": payment_id}

def _listing_to_dict(l: MarketplaceListing) -> dict:
    return {
        "id": str(l.id),
        "product_name": l.product_name,
        "category": l.category.value if l.category else None,
        "description": l.description,
        "price": optional_float(l.price) if l.price is not None else 0,
        "unit": l.unit,
        "stock_quantity": l.stock_quantity,
        "images": l.images or [],
        "is_verified": l.is_verified,
        "state": l.state,
        "district": l.district,
        "diseases_treated": l.diseases_treated or [],
        "created_at": optional_isoformat(l.created_at),
    }
