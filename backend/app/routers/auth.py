"""Auth router: OTP send/verify, JWT, user profile."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserRole
from app.schemas import OTPSendRequest, OTPVerifyRequest, UserProfileUpdate
from app.auth import generate_otp, verify_otp, create_access_token, get_current_user
from app.config import settings
from app.serializers import optional_float, optional_isoformat
from loguru import logger
import aiohttp

router = APIRouter()


def _normalize_phone_for_fast2sms(phone: str) -> str:
    """Return a 10-digit Indian mobile number accepted by Fast2SMS."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("91") and len(digits) > 10:
        digits = digits[-10:]
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    return digits


async def _send_otp_sms(phone: str, otp: str) -> None:
    """Send OTP via Fast2SMS in production mode."""
    if not settings.fast2sms_api_key:
        raise HTTPException(status_code=503, detail="SMS provider not configured")

    normalized_phone = _normalize_phone_for_fast2sms(phone)
    message = f"KrishiRaksha OTP: {otp}. Valid for 10 minutes."

    # Fast2SMS expects auth key in header and comma-separated numbers.
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": settings.fast2sms_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "route": "v3",
        "sender_id": "TXTIND",
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": normalized_phone,
    }

    timeout = aiohttp.ClientTimeout(total=10)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, json=payload, headers=headers) as response:
                response_data = await response.json(content_type=None)
                if response.status >= 400:
                    logger.error("Fast2SMS HTTP error {}: {}", response.status, response_data)
                    raise HTTPException(status_code=503, detail="Failed to send OTP")

                if response_data.get("return") is not True:
                    logger.error("Fast2SMS API failure: {}", response_data)
                    raise HTTPException(status_code=503, detail="Failed to send OTP")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("OTP SMS send failed: {}", exc)
        raise HTTPException(status_code=503, detail="Failed to send OTP") from exc

@router.post("/otp/send")
async def send_otp(request: OTPSendRequest):
    """Send OTP to phone number (demo: always returns 895674 for demo phones)."""
    phone = request.phone.strip()
    otp = generate_otp(phone)

    if settings.app_env != "production" or settings.demo_mode:
        # In demo mode, return OTP in response (don't send SMS)
        return {"message": "OTP sent", "demo_otp": otp, "phone": phone}

    await _send_otp_sms(phone, otp)
    return {"message": "OTP sent to your phone"}

@router.post("/otp/verify", response_model=dict)
async def verify_otp_endpoint(request: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP and return JWT token. Creates user if first time."""
    phone = request.phone.strip()

    if not verify_otp(phone, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Get or create user
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if not user:
        # Assign demo roles based on phone for demo accounts
        role_map = {
            "9000000001": UserRole.farmer,
            "9000000002": UserRole.officer,
            "9000000003": UserRole.seller,
            "9000000004": UserRole.admin,
        }
        clean_phone = phone.replace("+91-", "").replace("+91", "")
        role = role_map.get(clean_phone, UserRole.farmer)

        user = User(
            phone=phone,
            role=role,
            language_preference="hi",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(str(user.id), user.role.value)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "phone": user.phone,
            "name": user.name,
            "role": user.role.value,
            "language_preference": user.language_preference,
            "state": user.state,
            "district": user.district,
        }
    }

@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "phone": current_user.phone,
        "name": current_user.name,
        "role": current_user.role.value,
        "language_preference": current_user.language_preference,
        "state": current_user.state,
        "district": current_user.district,
        "taluk": current_user.taluk,
        "lat": optional_float(current_user.lat),
        "lng": optional_float(current_user.lng),
        "created_at": optional_isoformat(current_user.created_at),
    }

@router.put("/me")
async def update_profile(
    updates: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return {"message": "Profile updated", "user": {"name": current_user.name}}
