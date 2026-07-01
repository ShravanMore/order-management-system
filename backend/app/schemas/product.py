from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255, min_length=1)
    sku: str = Field(..., max_length=100, min_length=1)
    category: str = Field(..., max_length=100, min_length=1)
    description: str | None = Field(None)
    price: Decimal = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)
    unit: str = Field("piece", max_length=50, min_length=1)
    image_url: str | None = Field(None, max_length=1024)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, max_length=255, min_length=1)
    sku: str | None = Field(None, max_length=100, min_length=1)
    category: str | None = Field(None, max_length=100, min_length=1)
    description: str | None = Field(None)
    price: Decimal | None = Field(None, ge=0)
    stock_quantity: int | None = Field(None, ge=0)
    low_stock_threshold: int | None = Field(None, ge=0)
    unit: str | None = Field(None, max_length=50, min_length=1)
    image_url: str | None = Field(None, max_length=1024)


class StockAdjustmentRequest(BaseModel):
    delta: int = Field(..., description="Stock adjustment delta (can be positive or negative)")


class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total_count: int
    page: int
    page_size: int
