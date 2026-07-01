from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.security import verify_password, get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserProfile, MessageResponse
from app.schemas.profile import ProfileUpdateRequest, PasswordChangeRequest

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Get current user profile (Admin & Employee)",
)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserProfile:
    """Get the authenticated user's profile information."""
    return UserProfile.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserProfile,
    summary="Update current user profile (Admin & Employee)",
)
async def update_my_profile(
    body: ProfileUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserProfile:
    """
    Update the authenticated user's profile.
    Can update: full_name, phone, avatar_url.
    Cannot update: email, role, is_active.
    """
    update_data = body.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.flush()
    await db.refresh(current_user)
    
    return UserProfile.model_validate(current_user)


@router.put(
    "/me/password",
    response_model=MessageResponse,
    summary="Change password (Admin & Employee)",
)
async def change_my_password(
    body: PasswordChangeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MessageResponse:
    """
    Change the authenticated user's password.
    Requires current password verification before updating.
    """
    # Verify current password
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_password",
                "message": "Current password is incorrect."
            }
        )
    
    # Don't allow same password
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "same_password",
                "message": "New password must be different from current password."
            }
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(body.new_password)
    await db.flush()
    
    return MessageResponse(message="Password changed successfully.")
