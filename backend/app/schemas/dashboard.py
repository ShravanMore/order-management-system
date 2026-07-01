from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_orders: int
    pending_orders: int
    ongoing_orders: int
    completed_orders: int
    cancelled_orders: int
    current_month_revenue: Decimal
    low_stock_products: int
    total_active_dealers: int
    total_active_employees: int


class OrdersTrendItem(BaseModel):
    period: str  # e.g., "2026-W26" for weekly or "2026-06" for monthly
    order_count: int
    revenue: Decimal


class OrdersTrendResponse(BaseModel):
    period_type: str  # "weekly" or "monthly"
    data: list[OrdersTrendItem]


class TopProductItem(BaseModel):
    product_id: int
    product_name: str
    product_sku: str
    total_quantity_sold: int
    total_revenue: Decimal


class TopProductsResponse(BaseModel):
    data: list[TopProductItem]


class TopDealerItem(BaseModel):
    dealer_id: int
    dealer_name: str
    total_orders: int
    total_value: Decimal


class TopDealersResponse(BaseModel):
    data: list[TopDealerItem]


class RecentOrderItem(BaseModel):
    id: int
    order_number: str
    dealer_name: str
    status: str
    total_amount: Decimal
    order_date: datetime


class RecentOrdersResponse(BaseModel):
    data: list[RecentOrderItem]
