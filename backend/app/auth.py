"""Auth middleware and JWT utilities."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.config import settings
from app.time_utils import utc_now
import random
import redis.asyncio as aioredis
from typing import Optional

security = HTTPBearer(auto_error=False)

def create_access_token(user_id: str, role: str) -> str:
    expire = utc_now() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles):
    async def check_role(user: User = Depends(get_current_user)):
        if user.role.value not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return check_role

# ─── OTP Store (Redis or in-memory for demo) ──────────────────────────────────
_otp_store: dict = {}  # in-memory fallback for demo

def generate_otp(phone: str) -> str:
    """Generate and store OTP for a phone number."""
    # Demo mode: always return 123456 for demo phones
    if phone in ["+91-9000000001", "+91-9000000002", "+91-9000000003", "+91-9000000004",
                 "9000000001", "9000000002", "9000000003", "9000000004"]:
        otp = "123456"
    else:
        otp = str(random.randint(100000, 999999))
    _otp_store[phone] = otp
    return otp

def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP for a phone number."""
    stored = _otp_store.get(phone)
    if stored and stored == otp:
        del _otp_store[phone]
        return True
    return False
