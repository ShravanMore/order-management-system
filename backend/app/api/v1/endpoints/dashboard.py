from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, Query

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    OrdersTrendResponse,
    TopProductsResponse,
    TopDealersResponse,
    RecentOrdersResponse,
)
from app.services import dashboard_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Admin only for all dashboard endpoints
admin_required = Depends(require_role(UserRole.admin))


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get dashboard summary statistics (Admin Only)",
)
async def get_dashboard_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> DashboardSummaryResponse:
    """
    Get comprehensive dashboard summary including:
    - Total orders and counts per status
    - Current month revenue (completed orders only)
    - Low stock products count
    - Total active dealers and employees
    """
    summary = await dashboard_service.get_dashboard_summary(db)
    return DashboardSummaryResponse(**summary)


@router.get(
    "/orders-trend",
    response_model=OrdersTrendResponse,
    summary="Get orders trend over time (Admin Only)",
)
async def get_orders_trend(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
    period: str = Query("monthly", pattern="^(weekly|monthly)$", description="Grouping period"),
) -> OrdersTrendResponse:
    """
    Get order count and revenue trend grouped by week or month.
    Returns data for the last 12 periods.
    """
    trend = await dashboard_service.get_orders_trend(db, period=period)
    return OrdersTrendResponse(**trend)


@router.get(
    "/top-products",
    response_model=TopProductsResponse,
    summary="Get best-selling products (Admin Only)",
)
async def get_top_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
    limit: int = Query(5, ge=1, le=20, description="Number of products to return"),
) -> TopProductsResponse:
    """
    Get best-selling products ranked by total quantity ordered.
    """
    products = await dashboard_service.get_top_products(db, limit=limit)
    return TopProductsResponse(data=products)


@router.get(
    "/top-dealers",
    response_model=TopDealersResponse,
    summary="Get top dealers by order value (Admin Only)",
)
async def get_top_dealers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
    limit: int = Query(5, ge=1, le=20, description="Number of dealers to return"),
) -> TopDealersResponse:
    """
    Get top dealers ranked by total order value.
    """
    dealers = await dashboard_service.get_top_dealers(db, limit=limit)
    return TopDealersResponse(data=dealers)


@router.get(
    "/recent-orders",
    response_model=RecentOrdersResponse,
    summary="Get most recent orders (Admin Only)",
)
async def get_recent_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
    limit: int = Query(10, ge=1, le=50, description="Number of orders to return"),
) -> RecentOrdersResponse:
    """
    Get most recent orders with dealer name and status.
    """
    orders = await dashboard_service.get_recent_orders(db, limit=limit)
    return RecentOrdersResponse(data=orders)
