from __future__ import annotations

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def get_products(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    category: str | None = None,
    low_stock_only: bool = False,
    name: str | None = None,
    sku: str | None = None,
) -> tuple[list[Product], int]:
    """
    Retrieve active products with pagination and filters.
    Returns (items, total_count).
    """
    conditions = [Product.is_active == True]

    if category:
        conditions.append(Product.category.ilike(f"{category}"))
    if low_stock_only:
        conditions.append(Product.stock_quantity <= Product.low_stock_threshold)
    if name:
        conditions.append(Product.name.ilike(f"%{name}%"))
    if sku:
        conditions.append(Product.sku.ilike(f"%{sku}%"))

    where_clause = and_(*conditions)

    # 1. Total count query
    count_query = select(func.count()).select_from(Product).where(where_clause)
    count_result = await db.execute(count_query)
    total_count = count_result.scalar_one()

    # 2. Paginated items query
    offset = (page - 1) * page_size
    items_query = (
        select(Product)
        .where(where_clause)
        .order_by(Product.name.asc())
        .offset(offset)
        .limit(page_size)
    )
    items_result = await db.execute(items_query)
    items = list(items_result.scalars().all())

    return items, total_count


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product:
    """Retrieve an active product by ID. Raises 404 if not found or inactive."""
    query = select(Product).where(and_(Product.id == product_id, Product.is_active == True))
    result = await db.execute(query)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Product with ID {product_id} not found."}
        )
    return product


async def check_sku_unique(db: AsyncSession, sku: str, exclude_id: int | None = None) -> None:
    """Raise 409 conflict if SKU already exists in the database (active or inactive)."""
    conditions = [Product.sku.ilike(sku)]
    if exclude_id is not None:
        conditions.append(Product.id != exclude_id)
        
    query = select(Product).where(and_(*conditions))
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "duplicate_sku", "message": f"Product SKU '{sku}' already exists."}
        )


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    """Create a new product."""
    await check_sku_unique(db, data.sku)
    
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    """Update an existing product."""
    product = await get_product_by_id(db, product_id)

    update_data = data.model_dump(exclude_unset=True)
    
    if "sku" in update_data and update_data["sku"]:
        await check_sku_unique(db, update_data["sku"], exclude_id=product_id)

    for field, value in update_data.items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


async def adjust_stock(db: AsyncSession, product_id: int, delta: int) -> Product:
    """Adjust the stock quantity of a product by a delta (can be positive or negative)."""
    product = await get_product_by_id(db, product_id)
    
    new_stock = product.stock_quantity + delta
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "insufficient_stock",
                "message": f"Cannot adjust stock by {delta}. Resulting stock quantity cannot be negative (current: {product.stock_quantity})."
            }
        )
    
    product.stock_quantity = new_stock
    await db.flush()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: int) -> None:
    """Soft delete a product by setting is_active=False."""
    product = await get_product_by_id(db, product_id)
    product.is_active = False
    await db.flush()
