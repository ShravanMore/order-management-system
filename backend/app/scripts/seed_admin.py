"""
Seed script — creates the default admin user if one doesn't exist.

Run from backend/ with:
    python -m app.scripts.seed_admin

Credentials are read from Settings (which reads .env), so they can be
overridden by setting ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_FULL_NAME in .env.
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        existing: User | None = result.scalar_one_or_none()

        if existing:
            print(f"[seed_admin] Admin user already exists: {settings.ADMIN_EMAIL}")
            return

        admin = User(
            full_name=settings.ADMIN_FULL_NAME,
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        print(
            f"[seed_admin] Admin user created — id={admin.id}  email={admin.email}"
        )


if __name__ == "__main__":
    asyncio.run(seed())
    sys.exit(0)
