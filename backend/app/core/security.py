from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing  (bcrypt directly — avoids passlib/bcrypt 4.x compat issue)
# ---------------------------------------------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------
_ALGORITHM = settings.JWT_ALGORITHM


def _build_token(
    user_id: int,
    role: str,
    token_type: str,
    expire_delta: timedelta,
) -> str:
    """Encode a JWT with a unique JTI so it can be individually revoked."""
    now = datetime.now(tz=timezone.utc)
    payload: dict = {
        "sub": str(user_id),
        "role": role,
        "type": token_type,
        "jti": str(uuid.uuid4()),   # unique token id — used by the denylist
        "iat": now,
        "exp": now + expire_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=_ALGORITHM)


def create_access_token(user_id: int, role: str) -> str:
    return _build_token(
        user_id,
        role,
        token_type="access",
        expire_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int, role: str) -> str:
    return _build_token(
        user_id,
        role,
        token_type="refresh",
        expire_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.

    Raises jwt.PyJWTError on any failure (expired, bad signature, etc.).
    Callers should catch this and convert to an appropriate HTTP error.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[_ALGORITHM],
    )
