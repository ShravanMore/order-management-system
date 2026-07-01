"""
In-memory refresh-token denylist.

Stores the JTI (JWT ID) of every revoked refresh token.
Sufficient for a single-process deployment; swap for a Redis SET for
multi-process / multi-instance deployments without changing the interface.
"""

from __future__ import annotations

_revoked_jtis: set[str] = set()


def revoke(jti: str) -> None:
    """Add a JTI to the denylist (logout)."""
    _revoked_jtis.add(jti)


def is_revoked(jti: str) -> bool:
    """Return True if the token has been revoked."""
    return jti in _revoked_jtis
