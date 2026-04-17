"""KrishiRaksha AI FastAPI Application"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
from loguru import logger

from app.config import settings
from app.database import engine, Base
from app.ws.manager import ConnectionManager
from app.routers import (
    auth, farms, detect, risk, advisory,
    voice, location, sos, market, forum,
    translate, analytics
)

# WebSocket connection manager (shared across routers)
manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("🌾 KrishiRaksha AI starting up...")
    # Create DB tables if not using Alembic migrations
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables ready")
    yield
    logger.info("🌾 KrishiRaksha AI shutting down...")

app = FastAPI(
    title="KrishiRaksha AI",
    description="AI-Powered Crop Risk Monitoring & Protection Advisory System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api/auth",      tags=["Auth"])
app.include_router(farms.router,      prefix="/api/farms",     tags=["Farms"])
app.include_router(detect.router,     prefix="/api/detect",    tags=["Disease Detection"])
app.include_router(risk.router,       prefix="/api/risk",      tags=["Risk Monitoring"])
app.include_router(advisory.router,   prefix="/api/advisory",  tags=["Advisory"])
app.include_router(voice.router,      prefix="/api/voice",     tags=["Voice"])
app.include_router(location.router,   prefix="/api/location",  tags=["Location & Weather"])
app.include_router(sos.router,        prefix="/api/sos",       tags=["SOS"])
app.include_router(market.router,     prefix="/api/market",    tags=["Marketplace"])
app.include_router(forum.router,      prefix="/api/forum",     tags=["Forum"])
app.include_router(translate.router,  prefix="/api",           tags=["Translation"])
app.include_router(analytics.router,  prefix="/api/analytics", tags=["Analytics"])

# ─── WebSocket ────────────────────────────────────────────────────────────────
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket, token: str | None = None):
    """WebSocket endpoint for real-time alerts."""
    client_id = await manager.connect(websocket, token)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle client messages (e.g., join room, ping)
            if data.get("type") == "join_room":
                manager.join_room(client_id, data.get("room"))
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(client_id)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "krishiraksha-api", "version": "1.0.0"}

@app.get("/")
async def root():
    return {
        "message": "🌾 KrishiRaksha AI — Apni Fasal Ka Raksha Karo",
        "docs": "/docs",
        "version": "1.0.0"
    }
