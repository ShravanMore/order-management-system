from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.dealer import (
    DealerCreate,
    DealerUpdate,
    DealerResponse,
    DealerListResponse,
)
from app.services import dealer_service

router = APIRouter(prefix="/dealers", tags=["dealers"])

# Dependencies for role-based access
admin_required = Depends(require_role(UserRole.admin))
any_role_required = Depends(require_role(UserRole.admin, UserRole.employee))


@router.get(
    "",
    response_model=DealerListResponse,
    summary="Get paginated list of active dealers (Admin & Employee)",
)
async def list_dealers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, any_role_required],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    name: str | None = Query(None),
    city: str | None = Query(None),
) -> DealerListResponse:
    items, total_count = await dealer_service.get_dealers(
        db, page=page, page_size=page_size, name=name, city=city
    )
    return DealerListResponse(
        items=[DealerResponse.model_validate(item) for item in items],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{id}",
    response_model=DealerResponse,
    summary="Get details of a dealer by ID (Admin & Employee)",
)
async def get_dealer(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, any_role_required],
) -> DealerResponse:
    dealer = await dealer_service.get_dealer_by_id(db, dealer_id=id)
    return DealerResponse.model_validate(dealer)


@router.post(
    "",
    response_model=DealerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new dealer (Admin Only)",
)
async def create_dealer(
    body: DealerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> DealerResponse:
    dealer = await dealer_service.create_dealer(db, data=body)
    return DealerResponse.model_validate(dealer)


@router.put(
    "/{id}",
    response_model=DealerResponse,
    summary="Update an existing dealer (Admin Only)",
)
async def update_dealer(
    id: int,
    body: DealerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> DealerResponse:
    dealer = await dealer_service.update_dealer(db, dealer_id=id, data=body)
    return DealerResponse.model_validate(dealer)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a dealer (Admin Only)",
)
async def delete_dealer(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[None, admin_required],
) -> None:
    await dealer_service.delete_dealer(db, dealer_id=id)
