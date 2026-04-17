"""
KrishiRaksha AI — Database Seed Script
Run: python seed.py
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta
from app.models import (
    User, UserRole, Farm, CropStage, DiseaseDetection, Severity,
    Advisory, Urgency, SOSEvent, SOSStatus, MarketplaceListing,
    MarketCategory, Order, OrderStatus, ForumPost, ForumCategory,
    ForumComment, WeatherSnapshot, RiskScore
)
from sqlalchemy import delete
from app.config import settings
from app.database import engine, AsyncSessionLocal as SessionLocal, Base

# ─── Seed Data ────────────────────────────────────────────────────────────────

USERS = [
    {"phone": "9000000001", "name": "Rajesh Kumar", "role": UserRole.farmer,
     "language_preference": "hi", "state": "Karnataka", "district": "Mandya",
     "lat": 12.5218, "lng": 76.8950},
    {"phone": "9000000002", "name": "Dr. Suresh Naik", "role": UserRole.officer,
     "language_preference": "kn", "state": "Karnataka", "district": "Mandya",
     "lat": 12.5246, "lng": 76.8989},
    {"phone": "9000000003", "name": "AgriMart Suppliers", "role": UserRole.seller,
     "language_preference": "en", "state": "Karnataka", "district": "Bengaluru Urban",
     "lat": 12.9716, "lng": 77.5946},
    {"phone": "9000000004", "name": "Admin User", "role": UserRole.admin,
     "language_preference": "en", "state": "Karnataka", "district": "Bengaluru Urban",
     "lat": 12.9716, "lng": 77.5946},
    {"phone": "9000000005", "name": "Lakshmi Devi", "role": UserRole.farmer,
     "language_preference": "te", "state": "Andhra Pradesh", "district": "Guntur",
     "lat": 16.3067, "lng": 80.4365},
    {"phone": "9000000006", "name": "Vithal Rao", "role": UserRole.farmer,
     "language_preference": "mr", "state": "Maharashtra", "district": "Pune",
     "lat": 18.5204, "lng": 73.8567},
    {"phone": "9000000007", "name": "Gurpreet Singh", "role": UserRole.farmer,
     "language_preference": "pa", "state": "Punjab", "district": "Ludhiana",
     "lat": 30.9010, "lng": 75.8573},
    {"phone": "9000000008", "name": "Karnataka Agro Store", "role": UserRole.seller,
     "language_preference": "kn", "state": "Karnataka", "district": "Bengaluru Rural",
     "lat": 13.0827, "lng": 77.5877},
]

FARMS = [
    {"name": "Rajesh's Paddy Field", "crop_type": "paddy", "crop_stage": CropStage.vegetative,
     "area_acres": 5.5, "soil_type": "Black cotton", "irrigation_type": "Drip",
     "boundary": {"type": "Polygon", "coordinates": [[[76.89, 12.52], [76.91, 12.52], [76.91, 12.53], [76.89, 12.53], [76.89, 12.52]]]}},
    {"name": "Lakshmi's Chilli Farm", "crop_type": "chilli", "crop_stage": CropStage.flowering,
     "area_acres": 3.0, "soil_type": "Red loam", "irrigation_type": "Sprinkler",
     "boundary": {"type": "Polygon", "coordinates": [[[80.43, 16.30], [80.45, 16.30], [80.45, 16.31], [80.43, 16.31], [80.43, 16.30]]]}},
    {"name": "Vithal's Sugarcane Plot", "crop_type": "sugarcane", "crop_stage": CropStage.vegetative,
     "area_acres": 8.0, "soil_type": "Medium black", "irrigation_type": "Flood",
     "boundary": None},
    {"name": "Gurpreet's Wheat Field", "crop_type": "wheat", "crop_stage": CropStage.flowering,
     "area_acres": 12.0, "soil_type": "Alluvial", "irrigation_type": "Tube well",
     "boundary": None},
    {"name": "Rajesh's Tomato Plot", "crop_type": "tomato", "crop_stage": CropStage.fruiting,
     "area_acres": 2.0, "soil_type": "Sandy loam", "irrigation_type": "Drip",
     "boundary": None},
]

MARKET_LISTINGS = [
    {"product_name": "Tricyclazole 75% WP (Beam Fungicide)", "category": MarketCategory.fungicide,
     "description": "Most effective against Rice Blast disease. CIB&RC approved.", "price": 280, "unit": "250g",
     "stock_quantity": 150, "is_verified": True, "diseases_treated": ["rice blast", "blast"]},
    {"product_name": "Isoprothiolane 40% EC (Fuji-one)", "category": MarketCategory.fungicide,
     "description": "Systemic fungicide for Rice Blast and Sheath Blight management.", "price": 320, "unit": "500ml",
     "stock_quantity": 80, "is_verified": True, "diseases_treated": ["rice blast", "sheath blight"]},
    {"product_name": "DAP Fertilizer (18:46:0)", "category": MarketCategory.fertilizer,
     "description": "Di-Ammonium Phosphate. Ideal for basal application in paddy and wheat.", "price": 1350, "unit": "50kg bag",
     "stock_quantity": 200, "is_verified": True, "diseases_treated": []},
    {"product_name": "Chlorpyrifos 20% EC", "category": MarketCategory.pesticide,
     "description": "Broad-spectrum insecticide for stem borer, BPH, and leaf folder control.", "price": 180, "unit": "500ml",
     "stock_quantity": 120, "is_verified": True, "diseases_treated": ["stem borer", "bph", "leaf folder"]},
    {"product_name": "Mancozeb 75% WP (Dithane M-45)", "category": MarketCategory.fungicide,
     "description": "Contact fungicide for Late Blight in tomato and potato.", "price": 220, "unit": "500g",
     "stock_quantity": 95, "is_verified": True, "diseases_treated": ["late blight", "early blight"]},
    {"product_name": "Imidacloprid 70% WS", "category": MarketCategory.pesticide,
     "description": "Seed treatment insecticide for sucking pests and viral disease vectors.", "price": 450, "unit": "100g",
     "stock_quantity": 60, "is_verified": True, "diseases_treated": ["leaf curl virus", "aphids", "whitefly"]},
    {"product_name": "NPK 19:19:19 Soluble Fertilizer", "category": MarketCategory.fertilizer,
     "description": "Balanced nutrition for drip/sprinkler fertigation in vegetables.", "price": 950, "unit": "25kg bag",
     "stock_quantity": 75, "is_verified": False, "diseases_treated": []},
    {"product_name": "Glyphosate 41% SL (Roundup)", "category": MarketCategory.herbicide,
     "description": "Non-selective systemic herbicide for weed management.", "price": 285, "unit": "1L bottle",
     "stock_quantity": 200, "is_verified": True, "diseases_treated": []},
    {"product_name": "Power Knapsack Sprayer 20L", "category": MarketCategory.equipment,
     "description": "Battery-operated backpack sprayer. 8-hour battery life. Adjustable nozzle.", "price": 3500, "unit": "unit",
     "stock_quantity": 15, "is_verified": True, "diseases_treated": []},
    {"product_name": "Neem Oil Cold Pressed (Organic)", "category": MarketCategory.pesticide,
     "description": "Certified organic neem oil for integrated pest management.", "price": 180, "unit": "500ml",
     "stock_quantity": 300, "is_verified": True, "diseases_treated": ["aphids", "whitefly", "mites"]},
]

FORUM_POSTS_DATA = [
    {"title": "My paddy has brown spots — is this Blast?", "body": "I noticed small brown diamond-shaped spots on paddy leaves yesterday. The spots have grey centers and dark brown borders. My farm is near Mandya district, Karnataka. What should I do?",
     "category": ForumCategory.disease, "tags": ["paddy", "blast", "karnataka"], "lat": 12.52, "lng": 76.89, "upvotes": 23},
    {"title": "Best time to spray fungicide for tomato blight?", "body": "I have 2 acres of tomato. Started seeing dark water-soaked lesions on lower leaves. When is the best time to spray? Morning or evening? Which product is most effective?",
     "category": ForumCategory.disease, "tags": ["tomato", "blight"], "lat": 16.30, "lng": 80.43, "upvotes": 15, "is_expert_verified": True},
    {"title": "Rain forecast for next 7 days — should I delay spraying?", "body": "IMD has given 60mm rain forecast for next 3 days in Pune district. I need to spray thiamethoxam for whitefly control but worried rain will wash it off. Any advice?",
     "category": ForumCategory.weather, "tags": ["weather", "spraying", "whitefly"], "lat": 18.52, "lng": 73.85, "upvotes": 8},
    {"title": "Anyone using drip irrigation for sugarcane? What fertilizer schedule?", "body": "I shifted from flood to drip irrigation this year for sugarcane. Need advice on fertigation schedule — how much DAP, urea, potash and at what intervals?",
     "category": ForumCategory.technique, "tags": ["sugarcane", "drip", "fertigation"], "lat": 18.52, "lng": 73.85, "upvotes": 32, "is_expert_verified": True},
    {"title": "Wheat prices crashing — should we look at alternate crops?", "body": "MSP for wheat is good but market prices are low. Some farmers in my taluk are switching to mustard or chickpea. What alternatives work in Punjab climate?",
     "category": ForumCategory.market, "tags": ["wheat", "market", "punjab"], "lat": 30.90, "lng": 75.85, "upvotes": 19},
]

DETECTIONS_DATA = [
    {"disease": "Rice Blast (Magnaporthe oryzae)", "confidence": 87.3, "severity": Severity.high,
     "lat": 12.5218, "lng": 76.8950},
    {"disease": "Tomato Late Blight (Phytophthora infestans)", "confidence": 91.5, "severity": Severity.critical,
     "lat": 16.3067, "lng": 80.4365},
    {"disease": "Powdery Mildew (Erysiphe spp.)", "confidence": 72.1, "severity": Severity.medium,
     "lat": 12.5246, "lng": 76.8989},
    {"disease": "Bacterial Leaf Blight", "confidence": 82.4, "severity": Severity.high,
     "lat": 12.9716, "lng": 77.5946},
    {"disease": "Stem Borer (Scirpophaga incertulas)", "confidence": 78.6, "severity": Severity.medium,
     "lat": 17.3850, "lng": 78.4867},
]

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        print("Cleaning up existing data...")
        await db.execute(delete(ForumComment))
        await db.execute(delete(ForumPost))
        await db.execute(delete(Order))
        await db.execute(delete(MarketplaceListing))
        await db.execute(delete(Advisory))
        await db.execute(delete(RiskScore))
        await db.execute(delete(DiseaseDetection))
        await db.execute(delete(Farm))
        await db.execute(delete(User))
        await db.execute(delete(WeatherSnapshot))
        await db.commit()

        print("Seeding users...")
        user_objects = []
        for u in USERS:
            user = User(**u)
            db.add(user)
            user_objects.append(user)
        await db.commit()
        for u in user_objects:
            await db.refresh(u)

        farmer1 = user_objects[0]
        farmer2 = user_objects[1]
        seller1 = user_objects[2]

        print("Seeding farms...")
        farm_objects = []
        farm_owners = [farmer1, farmer2, farmer1, farmer2, farmer1]
        for i, f in enumerate(FARMS):
            farm = Farm(user_id=farm_owners[i % len(farm_owners)].id, **f)
            db.add(farm)
            farm_objects.append(farm)
        await db.commit()
        for f in farm_objects:
            await db.refresh(f)

        print("Seeding marketplace listings...")
        for l in MARKET_LISTINGS:
            listing = MarketplaceListing(
                seller_id=seller1.id,
                state="Karnataka",
                district="Mandya",
                **l
            )
            db.add(listing)
        await db.commit()

        print("Seeding forum posts...")
        post_objects = []
        for i, p in enumerate(FORUM_POSTS_DATA):
            post = ForumPost(author_id=user_objects[i % len(user_objects)].id, **p)
            db.add(post)
            post_objects.append(post)
        await db.commit()
        for p in post_objects:
            await db.refresh(p)

        print("Seeding risk scores...")
        for farm in farm_objects:
            risk = RiskScore(
                farm_id=farm.id,
                overall_score=random.uniform(30, 80),
                weather_risk=random.uniform(20, 70),
                pest_risk=random.uniform(10, 60),
                disease_risk=random.uniform(30, 90),
                humidity_risk=random.uniform(40, 80),
                computed_at=datetime.utcnow()
            )
            db.add(risk)
        await db.commit()

        print("Seed complete!")
        print("\nDemo Credentials:")
        print("  Farmer:  phone=+91-9000000001, OTP=123456")
        print("  Officer: phone=+91-9000000002, OTP=123456")

if __name__ == "__main__":
    import traceback
    try:
        asyncio.run(seed())
    except Exception:
        traceback.print_exc()
