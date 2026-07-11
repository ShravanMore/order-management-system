from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import denylist
from app.core.deps import get_current_user, oauth2_scheme
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    TokenResponse,
    UserProfile,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Shared error responses (keeps handlers DRY)
# ---------------------------------------------------------------------------
def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": "invalid_credentials", "message": "Incorrect email or password."},
        headers={"WWW-Authenticate": "Bearer"},
    )


def _invalid_token(message: str = "Invalid or expired token.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": "invalid_token", "message": message},
        headers={"WWW-Authenticate": "Bearer"},
    )


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse, summary="Login with email + password")
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    # Debug logging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Login attempt for email: {body.email}")
    
    result = await db.execute(select(User).where(User.email == body.email))
    user: User | None = result.scalar_one_or_none()
    
    if user is None:
        logger.warning(f"User not found: {body.email}")
        raise _invalid_credentials()
    
    logger.info(f"User found: id={user.id}, email={user.email}, is_active={user.is_active}")
    
    password_valid = verify_password(body.password, user.hashed_password)
    logger.info(f"Password verification result: {password_valid}")
    
    if not password_valid:
        logger.warning(f"Invalid password for user: {body.email}")
        raise _invalid_credentials()

    if not user.is_active:
        logger.warning(f"Inactive user attempted login: {body.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "account_disabled", "message": "Your account has been disabled."},
        )

    logger.info(f"Login successful for user: {body.email}")
    return TokenResponse(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=create_refresh_token(user.id, user.role.value),
        user=UserProfile.model_validate(user),
    )


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------
@router.post("/refresh", response_model=AccessTokenResponse, summary="Exchange refresh token for a new access token")
async def refresh(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AccessTokenResponse:
    try:
        payload = decode_token(body.refresh_token)
    except jwt.PyJWTError:
        raise _invalid_token()

    if payload.get("type") != "refresh":
        raise _invalid_token("Not a refresh token.")

    jti: str | None = payload.get("jti")
    if jti and denylist.is_revoked(jti):
        raise _invalid_token("Token has been revoked.")

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise _invalid_token()

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise _invalid_token()

    return AccessTokenResponse(
        access_token=create_access_token(user.id, user.role.value),
    )


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserProfile, summary="Get current user profile")
async def me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserProfile:
    return UserProfile.model_validate(current_user)


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------
@router.post("/logout", response_model=MessageResponse, summary="Logout (revoke refresh token)")
async def logout(
    body: RefreshRequest,
) -> MessageResponse:
    """
    Accepts the refresh token and adds its JTI to the denylist so it can
    never be exchanged for a new access token. Access tokens are short-lived
    and will expire naturally.
    """
    try:
        payload = decode_token(body.refresh_token)
    except jwt.PyJWTError:
        # Already invalid — treat as success (idempotent logout)
        return MessageResponse(message="Logged out successfully.")

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "bad_request", "message": "Not a refresh token."},
        )

    jti: str | None = payload.get("jti")
    if jti:
        denylist.revoke(jti)

    return MessageResponse(message="Logged out successfully.")
