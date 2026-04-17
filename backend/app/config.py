"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str = "krishiraksha-secret"
    demo_mode: bool = True

    # JWT
    jwt_secret: str = "krishiraksha-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    # Database
    database_url: str = "postgresql+asyncpg://krishiraksha:krishiraksha@localhost:5432/krishiraksha"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "krishiraksha"
    minio_secure: bool = False

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""

    # AI Keys
    gemini_api_key: str = ""
    openai_api_key: str = ""
    google_cloud_api_key: str = ""

    # Weather
    openweathermap_api_key: str = ""

    # SMS / Notifications
    fast2sms_api_key: str = ""
    fcm_server_key: str = ""

    # Internal URLs
    socket_server_url: str = "http://localhost:3001"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
