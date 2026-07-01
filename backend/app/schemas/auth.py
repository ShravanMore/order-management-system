from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------

class UserProfile(BaseModel):
    """Public-facing user representation — never includes hashed_password."""
    id: int
    full_name: str
    email: str
    role: UserRole
    phone: str | None
    avatar_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Auth request / response schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Plain str for email so reserved-TLD addresses (e.g. .local) are accepted."""
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfile


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
