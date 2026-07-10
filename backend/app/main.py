from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Startup tasks
# ---------------------------------------------------------------------------
async def run_migrations_and_seed():
    """Run database migrations and seed admin user on startup."""
    import subprocess
    import sys
    from sqlalchemy import select
    from app.core.security import get_password_hash
    from app.db.session import AsyncSessionLocal
    from app.models.user import User, UserRole
    
    try:
        # Run Alembic migrations
        logger.info("Running database migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            logger.info("✓ Database migrations completed successfully")
            logger.info(result.stdout)
        else:
            logger.warning(f"Migration warning: {result.stderr}")
            # Don't fail startup if migrations already applied
        
        # Seed admin user
        logger.info("Checking for admin user...")
        async with AsyncSessionLocal() as db:
            stmt = select(User).where(User.email == settings.ADMIN_EMAIL)
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                logger.info(f"✓ Admin user already exists: {settings.ADMIN_EMAIL}")
            else:
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
                logger.info(f"✓ Admin user created — id={admin.id} email={admin.email}")
                
    except Exception as e:
        logger.error(f"Startup initialization error: {e}")
        # Don't crash the app, just log the error
        # This allows the health check to still work


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: Run migrations and seed data
    logger.info("Starting application initialization...")
    await run_migrations_and_seed()
    logger.info("Application startup complete")
    yield
    # Shutdown: clean up resources here
    logger.info("Application shutdown")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="REST API for the Physiotherapy Equipment Order Management System",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root health (outside versioned prefix for infra probes)
from fastapi.responses import JSONResponse  # noqa: E402


@app.get("/health", tags=["health"], include_in_schema=False)
async def root_health() -> JSONResponse:
    return JSONResponse({"status": "ok"})
