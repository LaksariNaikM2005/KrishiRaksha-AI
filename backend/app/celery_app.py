from celery import Celery
from app.config import settings
import os

# Create Celery instance
# broker and backend should use the Redis URL from config
celery_app = Celery(
    "krishiraksha",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.routers.detect", "app.routers.advisory"]
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_ignore_result=False,
    task_track_started=True,
)

@celery_app.task(name="generate_advisory")
def generate_advisory(detection_id: str):
    """
    Background task to generate AI advisory.
    In real usage, this would call LLM APIs or use local models.
    """
    print(f"🌾 [Celery Worker] Generating advisory for detection: {detection_id}")
    # Mock processing delay could be added here if needed
    return {"status": "success", "detection_id": detection_id, "timestamp": os.getpid()}
