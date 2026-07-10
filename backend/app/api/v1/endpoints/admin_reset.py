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

from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin-reset", tags=["admin-reset"])


class AdminResetRequest(BaseModel):
    email: EmailStr
    new_password: str


class MessageResponse(BaseModel):
    message: str


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
    admin_user.hashed_password = get_password_hash(body.new_password)
    await db.commit()
    
    return MessageResponse(
        message=f"✓ Password updated for {body.email}. DELETE admin_reset.py NOW!"
    )
