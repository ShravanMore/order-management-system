from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import denylist
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole

# ---------------------------------------------------------------------------
# OAuth2 scheme — tells FastAPI where to find the bearer token
# ---------------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    scheme_name="JWT",
)

# ---------------------------------------------------------------------------
# Reusable error responses
# ---------------------------------------------------------------------------
_401 = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"error": "unauthorized", "message": "Invalid or expired token."},
    headers={"WWW-Authenticate": "Bearer"},
)

_403 = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail={"error": "forbidden", "message": "You do not have permission to perform this action."},
)


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Decode the access JWT and return the matching User row."""
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise _401

    # Must be an access token
    if payload.get("type") != "access":
        raise _401

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise _401

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise _401

    return user


# ---------------------------------------------------------------------------
# require_role — dependency factory
# ---------------------------------------------------------------------------
def require_role(*roles: UserRole) -> Callable:
    """
    Usage:
        @router.get("/admin-only")
        async def admin_route(user=Depends(require_role(UserRole.admin))):
            ...
    """
    async def _check(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise _403
        return current_user

    return _check
