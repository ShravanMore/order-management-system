from __future__ import annotations

from pydantic import BaseModel, Field


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(None, max_length=255, min_length=1)
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=1024)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
