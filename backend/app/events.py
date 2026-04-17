import httpx
import json
import socket
from urllib.parse import urlparse
from loguru import logger
from redis.asyncio import Redis
from app.config import settings


def _tcp_port_open(host: str, port: int, timeout: float = 0.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

async def publish_event(channel: str, message: dict):
    """
    Publish event via Redis (preferred) or HTTP Fallback to Socket Server.
    """
    message_json = json.dumps(message)

    redis_url = settings.redis_url
    redis_target = urlparse(redis_url)
    redis_host = redis_target.hostname or "localhost"
    redis_port = redis_target.port or 6379
    
    # 1. Try Redis
    if _tcp_port_open(redis_host, redis_port):
        try:
            redis = Redis.from_url(redis_url)
            await redis.publish(channel, message_json)
            await redis.close()
            logger.debug(f"Event published via Redis: {channel}")
            return True
        except Exception as exc:
            logger.warning(f"Redis publish failed, trying HTTP fallback: {exc}")
    else:
        logger.warning(f"Redis unavailable at {redis_host}:{redis_port}; skipping Redis publish for {channel}")

    # 2. Try HTTP Fallback to Socket Server
    try:
        # settings.socket_server_url should be defined in config.py
        # Defaulting to localhost:3001 if not set
        socket_url = getattr(settings, "socket_server_url", "http://localhost:3001")
        socket_target = urlparse(socket_url)
        socket_host = socket_target.hostname or "localhost"
        socket_port = socket_target.port or 3001

        if not _tcp_port_open(socket_host, socket_port):
            logger.warning(f"Socket server unavailable at {socket_host}:{socket_port}; dropping event {channel}")
            return False

        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.post(
                f"{socket_url}/api/internal/publish",
                json={"channel": channel, "message": message}
            )
            if response.status_code == 200:
                logger.debug(f"Event published via HTTP fallback: {channel}")
                return True
            logger.warning(f"HTTP fallback failed with status {response.status_code}")
    except Exception as e:
        logger.warning(f"Failed to publish event to socket server: {e}")

    return False
