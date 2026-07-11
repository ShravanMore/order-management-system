"""
TEMPORARY ENDPOINT - Delete after use!
This endpoint allows resetting the admin password without authentication.
Only use this once to fix the initial admin account, then DELETE THIS FILE.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin-reset", tags=["admin-reset"])


class AdminResetRequest(BaseModel):
    email: EmailStr
    new_password: str


class AdminCheckRequest(BaseModel):
    email: EmailStr
    password: str


class MessageResponse(BaseModel):
    message: str
    details: dict | None = None


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="⚠️ TEMPORARY: Reset admin password (NO AUTH REQUIRED)",
)
async def reset_admin_password(
    body: AdminResetRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    ⚠️ WARNING: This endpoint has NO AUTHENTICATION!
    
    Use this ONCE to reset the admin password, then DELETE THIS FILE!
    
    This endpoint:
    1. Finds the admin user by email
    2. Updates their password
    3. Should be REMOVED after first use for security
    """
    
    # Find admin user
    result = await db.execute(
        select(User).where(
            User.email == body.email,
            User.role == UserRole.admin
        )
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Admin user with email {body.email} not found"
        )
    
    # Update password
    new_hash = get_password_hash(body.new_password)
    admin_user.hashed_password = new_hash
    await db.commit()
    await db.refresh(admin_user)
    
    return MessageResponse(
        message=f"✓ Password updated for {body.email}",
        details={
            "email": admin_user.email,
            "user_id": admin_user.id,
            "hash_length": len(new_hash),
            "is_active": admin_user.is_active,
            "role": admin_user.role.value,
        }
    )


@router.post(
    "/check-password",
    response_model=MessageResponse,
    summary="⚠️ TEMPORARY: Check if password is correct (NO AUTH REQUIRED)",
)
async def check_admin_password(
    body: AdminCheckRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    ⚠️ WARNING: This endpoint has NO AUTHENTICATION!
    
    Use this to debug password issues.
    Returns whether the password matches what's in the database.
    """
    
    # Find admin user
    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {body.email} not found"
        )
    
    # Check password
    password_correct = verify_password(body.password, admin_user.hashed_password)
    
    # Also test the hash manually
    import bcrypt
    manual_check = bcrypt.checkpw(
        body.password.encode("utf-8"),
        admin_user.hashed_password.encode("utf-8")
    )
    
    return MessageResponse(
        message="Password check complete",
        details={
            "email": admin_user.email,
            "user_id": admin_user.id,
            "role": admin_user.role.value,
            "is_active": admin_user.is_active,
            "password_length": len(body.password),
            "password_bytes": len(body.password.encode("utf-8")),
            "hash_length": len(admin_user.hashed_password),
            "hash_preview": admin_user.hashed_password[:30] + "...",
            "verify_password_result": password_correct,
            "manual_bcrypt_check": manual_check,
            "both_match": password_correct == manual_check,
        }
    )
