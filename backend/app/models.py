"""SQLAlchemy ORM models for KrishiRaksha AI database."""
import uuid
from sqlalchemy import (
    Column, String, Numeric, Boolean, Integer, Text,
    DateTime, Enum, ForeignKey, JSON
)
from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
from app.database import Base
from app.time_utils import utc_now
import enum

# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    farmer = "farmer"
    officer = "officer"
    seller = "seller"
    admin = "admin"

class CropStage(str, enum.Enum):
    sowing = "sowing"
    vegetative = "vegetative"
    flowering = "flowering"
    fruiting = "fruiting"
    harvest = "harvest"

class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class Urgency(str, enum.Enum):
    routine = "routine"
    urgent = "urgent"
    emergency = "emergency"

class SOSStatus(str, enum.Enum):
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"

class MarketCategory(str, enum.Enum):
    pesticide = "pesticide"
    fungicide = "fungicide"
    fertilizer = "fertilizer"
    herbicide = "herbicide"
    equipment = "equipment"
    other = "other"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class ForumCategory(str, enum.Enum):
    disease = "disease"
    weather = "weather"
    technique = "technique"
    market = "market"
    sos = "sos"
    general = "general"

# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255))
    language_preference = Column(String(10), default="hi")
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.farmer)
    state = Column(String(100))
    district = Column(String(100))
    taluk = Column(String(100))
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    created_at = Column(DateTime, default=utc_now)

    farms = relationship("Farm", back_populates="user")
    detections = relationship("DiseaseDetection", back_populates="user")
    sos_events = relationship("SOSEvent", back_populates="user")
    forum_posts = relationship("ForumPost", back_populates="author")
    forum_comments = relationship("ForumComment", back_populates="author")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    crop_type = Column(String(100))
    crop_stage: Mapped[CropStage] = mapped_column(Enum(CropStage), default=CropStage.vegetative)
    area_acres = Column(Numeric(10, 2))
    boundary = Column(JSON)  # GeoJSON polygon (portable JSON)
    soil_type = Column(String(100))
    irrigation_type = Column(String(100))
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="farms")
    detections = relationship("DiseaseDetection", back_populates="farm")
    risk_scores = relationship("RiskScore", back_populates="farm")
    advisories = relationship("Advisory", back_populates="farm")

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id"))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    image_url = Column(Text)
    detected_disease = Column(String(255))
    confidence = Column(Numeric(5, 2))
    severity: Mapped[Severity] = mapped_column(Enum(Severity), default=Severity.medium)
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    detected_at = Column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="detections")
    user = relationship("User", back_populates="detections")
    advisory = relationship("Advisory", back_populates="detection", uselist=False)

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    overall_score = Column(Numeric(5, 2), default=0)
    weather_risk = Column(Numeric(5, 2), default=0)
    pest_risk = Column(Numeric(5, 2), default=0)
    disease_risk = Column(Numeric(5, 2), default=0)
    humidity_risk = Column(Numeric(5, 2), default=0)
    computed_at = Column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="risk_scores")

class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    detection_id = Column(String(36), ForeignKey("disease_detections.id"))
    farm_id = Column(String(36), ForeignKey("farms.id"))
    text_en = Column(Text)
    text_translated = Column(JSON)   # {hi: "...", kn: "...", te: "..."}
    audio_url_map = Column(JSON)     # {hi: "url", kn: "url"}
    treatment_steps = Column(JSON)   # [{step: 1, action: "...", product: "..."}]
    urgency: Mapped[Urgency] = mapped_column(Enum(Urgency), default=Urgency.routine)
    created_at = Column(DateTime, default=utc_now)

    detection = relationship("DiseaseDetection", back_populates="advisory")
    farm = relationship("Farm", back_populates="advisories")

class SOSEvent(Base):
    __tablename__ = "sos_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    message = Column(Text)
    status: Mapped[SOSStatus] = mapped_column(Enum(SOSStatus), default=SOSStatus.active)
    responders = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)
    resolved_at = Column(DateTime)

    user = relationship("User", back_populates="sos_events")

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    category: Mapped[MarketCategory] = mapped_column(Enum(MarketCategory), default=MarketCategory.other)
    description = Column(Text)
    price = Column(Numeric(10, 2))
    unit = Column(String(50))
    stock_quantity = Column(Integer, default=0)
    images = Column(JSON, default=list)
    is_verified = Column(Boolean, default=False)
    state = Column(String(100))
    district = Column(String(100))
    diseases_treated = Column(JSON, default=list)  # Portable list storage
    created_at = Column(DateTime, default=utc_now)

    orders = relationship("Order", back_populates="listing")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    buyer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    listing_id = Column(String(36), ForeignKey("marketplace_listings.id"), nullable=False)
    quantity = Column(Integer, default=1)
    total_price = Column(Numeric(10, 2))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending)
    delivery_address = Column(JSON)
    payment_id = Column(String(255))
    created_at = Column(DateTime, default=utc_now)

    listing = relationship("MarketplaceListing", back_populates="orders")

class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    body = Column(Text)
    category: Mapped[ForumCategory] = mapped_column(Enum(ForumCategory), default=ForumCategory.general)
    tags = Column(JSON, default=list)
    images = Column(JSON, default=list)
    upvotes = Column(Integer, default=0)
    is_expert_verified = Column(Boolean, default=False)
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    created_at = Column(DateTime, default=utc_now)

    author = relationship("User", back_populates="forum_posts")
    comments = relationship("ForumComment", back_populates="post")

class ForumComment(Base):
    __tablename__ = "forum_comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("forum_posts.id"), nullable=False)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    body = Column(Text)
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    post = relationship("ForumPost", back_populates="comments")
    author = relationship("User", back_populates="forum_comments")

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    temperature = Column(Numeric(5, 2))
    humidity = Column(Numeric(5, 2))
    wind_speed = Column(Numeric(5, 2))
    rainfall_mm = Column(Numeric(7, 2))
    uv_index = Column(Numeric(4, 2))
    recorded_at = Column(DateTime, default=utc_now, index=True)
