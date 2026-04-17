"""WebSocket connection manager for real-time events."""
from fastapi import WebSocket
from typing import Dict, Set, Optional
import json
import asyncio
from loguru import logger

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_rooms: Dict[str, Set[str]] = {}  # client_id → set of rooms
        self.room_members: Dict[str, Set[str]] = {}  # room → set of client_ids
        self._counter = 0

    async def connect(self, websocket: WebSocket, token: str | None = None) -> str:
        """Accept a WebSocket connection and return client ID."""
        await websocket.accept()
        self._counter += 1
        client_id = f"client_{self._counter}"
        self.active_connections[client_id] = websocket
        self.user_rooms[client_id] = set()

        # If token provided, join personal room
        if token:
            try:
                from app.auth import decode_token
                payload = decode_token(token)
                user_id = payload.get("sub")
                if user_id:
                    self.join_room(client_id, f"user_{user_id}")
            except Exception:
                pass

        logger.info(f"WebSocket connected: {client_id} (total: {len(self.active_connections)})")
        return client_id

    def disconnect(self, client_id: str):
        """Remove a disconnected client."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.user_rooms:
            for room in self.user_rooms[client_id]:
                if room in self.room_members:
                    self.room_members[room].discard(client_id)
            del self.user_rooms[client_id]
        logger.info(f"WebSocket disconnected: {client_id}")

    def join_room(self, client_id: str, room: str):
        """Add a client to a room."""
        if client_id not in self.user_rooms:
            self.user_rooms[client_id] = set()
        self.user_rooms[client_id].add(room)
        if room not in self.room_members:
            self.room_members[room] = set()
        self.room_members[room].add(client_id)

    async def send_to_client(self, client_id: str, event: dict):
        """Send event to a specific client."""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(event)
            except Exception as e:
                logger.warning(f"Failed to send to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_to_room(self, room: str, event: dict):
        """Broadcast event to all clients in a room."""
        if room not in self.room_members:
            return
        for client_id in list(self.room_members[room]):
            await self.send_to_client(client_id, event)

    async def broadcast_all(self, event: dict):
        """Broadcast to all connected clients."""
        for client_id in list(self.active_connections.keys()):
            await self.send_to_client(client_id, event)

    async def emit_advisory_ready(self, user_id: str, advisory_id: str, farm_id: str, severity: str):
        await self.broadcast_to_room(f"user_{user_id}", {
            "type": "advisory_ready",
            "advisory_id": advisory_id,
            "farm_id": farm_id,
            "severity": severity,
        })

    async def emit_sos(self, sos_id: str, lat: float, lng: float, message: str, district: str):
        await self.broadcast_to_room(f"district_{district}", {
            "type": "sos_new",
            "sos_id": sos_id,
            "lat": lat,
            "lng": lng,
            "message": message,
        })

    async def emit_weather_alert(self, districts: list, alert_type: str, message: str):
        for district in districts:
            await self.broadcast_to_room(f"district_{district}", {
                "type": "weather_alert",
                "alert_type": alert_type,
                "message": message,
                "affected_districts": districts,
            })
