from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    StockAdjustmentRequest,
)
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])

# Dependencies for role-based access
admin_required = Depends(require_role(UserRole.admin))
any_role_required = Depends(require_role(UserRole.admin, UserRole.employee))


@router.get(
    "",
    response_model=ProductListResponse,
    summary="Get paginated list of active products with search and filters (Admin & Employee)",
)
async def list_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, any_role_required],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    low_stock_only: bool = Query(False),
    name: str | None = Query(None),
    sku: str | None = Query(None),
) -> ProductListResponse:
    items, total_count = await product_service.get_products(
        db,
        page=page,
        page_size=page_size,
        category=category,
        low_stock_only=low_stock_only,
        name=name,
        sku=sku,
    )
    return ProductListResponse(
        items=[ProductResponse.model_validate(item) for item in items],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{id}",
    response_model=ProductResponse,
    summary="Get details of a product by ID (Admin & Employee)",
)
async def get_product(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, any_role_required],
) -> ProductResponse:
    product = await product_service.get_product_by_id(db, product_id=id)
    return ProductResponse.model_validate(product)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (Admin Only)",
)
async def create_product(
    body: ProductCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> ProductResponse:
    product = await product_service.create_product(db, data=body)
    return ProductResponse.model_validate(product)


@router.put(
    "/{id}",
    response_model=ProductResponse,
    summary="Update an existing product (Admin Only)",
)
async def update_product(
    id: int,
    body: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> ProductResponse:
    product = await product_service.update_product(db, product_id=id, data=body)
    return ProductResponse.model_validate(product)


@router.patch(
    "/{id}/stock",
    response_model=ProductResponse,
    summary="Adjust product stock quantity by a delta (Admin Only)",
)
async def adjust_product_stock(
    id: int,
    body: StockAdjustmentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> ProductResponse:
    product = await product_service.adjust_stock(db, product_id=id, delta=body.delta)
    return ProductResponse.model_validate(product)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a product (Admin Only)",
)
async def delete_product(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> None:
    await product_service.delete_product(db, product_id=id)
