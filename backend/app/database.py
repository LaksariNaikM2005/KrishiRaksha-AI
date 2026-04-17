"""Database setup with SQLAlchemy async engine."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import re

# Convert sync URL to async
def make_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url

# Fallback to SQLite if Postgres is unreachable or URL is missing
DATABASE_URL = make_async_url(settings.database_url)
if not DATABASE_URL or "localhost" in DATABASE_URL:
    # Try to detect if postgres is actually there
    import socket
    try:
        with socket.create_connection(("localhost", 5432), timeout=1):
            pass
    except (socket.timeout, ConnectionRefusedError):
        # Fallback to local sqlite
        DATABASE_URL = "sqlite+aiosqlite:///./krishiraksha.db"
        print(f"Warning: Postgres not found. Falling back to SQLite: {DATABASE_URL}")

engine_args = {
    "echo": settings.app_env == "development",
}

if "sqlite" not in DATABASE_URL:
    engine_args.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_async_engine(DATABASE_URL, **engine_args)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI dependency for database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
