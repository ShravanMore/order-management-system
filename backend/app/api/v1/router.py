from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    dealers,
    products,
    orders,
    employees,
    dashboard,
    profile,
    admin_reset,  # TEMPORARY - DELETE AFTER USE
)

api_router = APIRouter()

# ── Feature routers ────────────────────────────────────────────────────────
api_router.include_router(auth.router)
api_router.include_router(dealers.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(employees.router)
api_router.include_router(dashboard.router)
api_router.include_router(profile.router)

# ⚠️ TEMPORARY - DELETE AFTER RESETTING ADMIN PASSWORD
api_router.include_router(admin_reset.router)

# Health (versioned)
from fastapi.responses import JSONResponse  # noqa: E402


@api_router.get("/health", tags=["health"])
async def health_check() -> JSONResponse:
    return JSONResponse({"status": "ok"})
