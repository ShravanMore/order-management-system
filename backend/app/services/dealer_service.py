from __future__ import annotations

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.dealer import Dealer
from app.schemas.dealer import DealerCreate, DealerUpdate


async def get_dealers(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    name: str | None = None,
    city: str | None = None,
) -> tuple[list[Dealer], int]:
    """
    Retrieve active dealers with pagination and filtering by name/city.
    Returns (items, total_count).
    """
    conditions = [Dealer.is_active == True]
    
    if name:
        conditions.append(Dealer.name.ilike(f"%{name}%"))
    if city:
        conditions.append(Dealer.city.ilike(f"%{city}%"))

    where_clause = and_(*conditions)

    # 1. Total count query
    count_query = select(func.count()).select_from(Dealer).where(where_clause)
    count_result = await db.execute(count_query)
    total_count = count_result.scalar_one()

    # 2. Paginated items query
    offset = (page - 1) * page_size
    items_query = (
        select(Dealer)
        .where(where_clause)
        .order_by(Dealer.name.asc())
        .offset(offset)
        .limit(page_size)
    )
    items_result = await db.execute(items_query)
    items = list(items_result.scalars().all())

    return items, total_count


async def get_dealer_by_id(db: AsyncSession, dealer_id: int) -> Dealer:
    """Retrieve an active dealer by ID. Raises 404 if not found or inactive."""
    query = select(Dealer).where(and_(Dealer.id == dealer_id, Dealer.is_active == True))
    result = await db.execute(query)
    dealer = result.scalar_one_or_none()
    
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Dealer with ID {dealer_id} not found."}
        )
    return dealer


async def create_dealer(db: AsyncSession, data: DealerCreate) -> Dealer:
    """Create a new dealer."""
    dealer = Dealer(**data.model_dump())
    db.add(dealer)
    await db.flush()  # flushes to detect integrity violations early
    await db.refresh(dealer)  # populate database defaults & generated attributes
    return dealer


async def update_dealer(db: AsyncSession, dealer_id: int, data: DealerUpdate) -> Dealer:
    """Update an existing dealer."""
    dealer = await get_dealer_by_id(db, dealer_id)

    # Apply updates
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dealer, field, value)

    await db.flush()
    await db.refresh(dealer)  # refresh database generated fields (like updated_at)
    return dealer


async def delete_dealer(db: AsyncSession, dealer_id: int) -> None:
    """Soft delete a dealer by setting is_active=False."""
    dealer = await get_dealer_by_id(db, dealer_id)
    dealer.is_active = False
    await db.flush()
