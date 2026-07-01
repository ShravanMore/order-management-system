from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.order import OrderStatus


# ── Order Item Schemas ────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., ge=1)
    quantity: int = Field(..., ge=1)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


# ── Order Schemas ─────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    dealer_id: int = Field(..., ge=1)
    order_date: datetime
    expected_delivery_date: datetime | None = None
    notes: str | None = None
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    dealer_id: int | None = Field(None, ge=1)
    assigned_to_id: int | None = None
    order_date: datetime | None = None
    expected_delivery_date: datetime | None = None
    notes: str | None = None
    items: list[OrderItemCreate] | None = Field(None, min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    remarks: str | None = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    dealer_id: int
    dealer_name: str
    created_by_id: int
    created_by_name: str
    assigned_to_id: int | None
    assigned_to_name: str | None
    status: OrderStatus
    order_date: datetime
    expected_delivery_date: datetime | None
    completed_at: datetime | None
    total_amount: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderDetailResponse(OrderResponse):
    items: list[OrderItemResponse]
    status_logs: list[OrderStatusLogResponse]


class OrderStatusLogResponse(BaseModel):
    id: int
    old_status: str
    new_status: str
    changed_by_id: int
    changed_by_name: str
    remarks: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total_count: int
    page: int
    page_size: int
