"""Auth schemas and utilities."""
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import uuid

class OTPSendRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    language_preference: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluk: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class FarmCreate(BaseModel):
    name: str
    crop_type: Optional[str] = None
    crop_stage: Optional[str] = "vegetative"
    area_acres: Optional[float] = None
    boundary: Optional[dict] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    crop_type: Optional[str] = None
    crop_stage: Optional[str] = None
    area_acres: Optional[float] = None
    boundary: Optional[dict] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None

class DetectionResponse(BaseModel):
    id: str
    disease: str
    confidence: float
    severity: str
    advisory_id: Optional[str] = None
    message: str = ""

class AdvisoryResponse(BaseModel):
    id: str
    disease_name: str
    severity: str
    urgency: str
    text_en: Optional[str] = None
    text_translated: Optional[dict] = None
    audio_url_map: Optional[dict] = None
    treatment_steps: Optional[list] = None
    created_at: str

class RiskScoreResponse(BaseModel):
    farm_id: str
    overall_score: float
    weather_risk: float
    pest_risk: float
    disease_risk: float
    humidity_risk: float
    risk_category: str
    computed_at: str

class SOSTriggerRequest(BaseModel):
    lat: float
    lng: float
    message: Optional[str] = None
    farm_id: Optional[str] = None

class MarketplaceListingCreate(BaseModel):
    product_name: str
    category: str
    description: Optional[str] = None
    price: float
    unit: Optional[str] = "kg"
    stock_quantity: int = 0
    images: Optional[list] = []
    state: Optional[str] = None
    district: Optional[str] = None
    diseases_treated: Optional[list] = []

class OrderCreate(BaseModel):
    listing_id: str
    quantity: int
    delivery_address: dict

class ForumPostCreate(BaseModel):
    title: str
    body: str
    category: str = "general"
    tags: Optional[list] = []
    images: Optional[list] = []
    lat: Optional[float] = None
    lng: Optional[float] = None

class ForumCommentCreate(BaseModel):
    body: str

class TranslateRequest(BaseModel):
    text: str
    from_lang: str = "en"
    to_lang: str = "hi"
