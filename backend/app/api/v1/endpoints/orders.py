from __future__ import annotations

from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderDetailResponse,
    OrderListResponse,
    OrderItemResponse,
    OrderStatusLogResponse,
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])

# Dependencies for role-based access
admin_required = Depends(require_role(UserRole.admin))
any_role_required = Depends(require_role(UserRole.admin, UserRole.employee))


def _build_order_response(order) -> OrderResponse:
    """Helper to build OrderResponse from Order model."""
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        dealer_id=order.dealer_id,
        dealer_name=order.dealer.name,
        created_by_id=order.created_by_id,
        created_by_name=order.created_by.full_name,
        assigned_to_id=order.assigned_to_id,
        assigned_to_name=order.assigned_to.full_name if order.assigned_to else None,
        status=order.status,
        order_date=order.order_date,
        expected_delivery_date=order.expected_delivery_date,
        completed_at=order.completed_at,
        total_amount=order.total_amount,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def _build_order_detail_response(order) -> OrderDetailResponse:
    """Helper to build OrderDetailResponse with items and logs."""
    items = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_sku=item.product.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]
    
    logs = [
        OrderStatusLogResponse(
            id=log.id,
            old_status=log.old_status,
            new_status=log.new_status,
            changed_by_id=log.changed_by_id,
            changed_by_name=log.changed_by.full_name,
            remarks=log.remarks,
            created_at=log.created_at,
        )
        for log in order.status_logs
    ]
    
    return OrderDetailResponse(
        id=order.id,
        order_number=order.order_number,
        dealer_id=order.dealer_id,
        dealer_name=order.dealer.name,
        created_by_id=order.created_by_id,
        created_by_name=order.created_by.full_name,
        assigned_to_id=order.assigned_to_id,
        assigned_to_name=order.assigned_to.full_name if order.assigned_to else None,
        status=order.status,
        order_date=order.order_date,
        expected_delivery_date=order.expected_delivery_date,
        completed_at=order.completed_at,
        total_amount=order.total_amount,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        status_logs=logs,
    )


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order (Admin Only)",
)
async def create_order(
    body: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, admin_required],
) -> OrderResponse:
    """
    Create a new order with line items. 
    - Generates unique order number (ORD-YYYY-####)
    - Validates stock availability
    - Deducts stock from products
    - Computes totals automatically
    """
    order = await order_service.create_order(db, data=body, created_by_id=current_user.id)
    
    # Refetch with relationships for response
    order = await order_service.get_order_by_id(db, order.id, current_user)
    return _build_order_response(order)


@router.get(
    "",
    response_model=OrderListResponse,
    summary="Get paginated list of orders (Admin & Employee)",
)
async def list_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, any_role_required],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: OrderStatus | None = Query(None, description="Filter by order status"),
    dealer_id: int | None = Query(None, ge=1, description="Filter by dealer ID"),
    assigned_to_id: int | None = Query(
        None,
        description="Filter by assigned user ID (use 0 for unassigned)"
    ),
    date_from: datetime | None = Query(None, description="Filter orders from this date"),
    date_to: datetime | None = Query(None, description="Filter orders up to this date"),
    show_all: bool = Query(
        False,
        description="For employees: show all orders instead of just assigned/unassigned"
    ),
) -> OrderListResponse:
    """
    List orders with filtering and pagination.
    - Admins see all orders by default
    - Employees see assigned or unassigned orders (unless show_all=True)
    """
    items, total_count = await order_service.get_orders(
        db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status_filter=status,
        dealer_id=dealer_id,
        assigned_to_id=assigned_to_id,
        date_from=date_from,
        date_to=date_to,
        show_all=show_all,
    )
    
    return OrderListResponse(
        items=[_build_order_response(order) for order in items],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{id}",
    response_model=OrderDetailResponse,
    summary="Get order details with items and status history (Admin & Employee)",
)
async def get_order(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, any_role_required],
) -> OrderDetailResponse:
    """
    Get full order details including:
    - Order information with dealer and user details
    - Line items with product information
    - Status change history
    """
    order = await order_service.get_order_by_id(db, order_id=id, current_user=current_user)
    return _build_order_detail_response(order)


@router.put(
    "/{id}",
    response_model=OrderDetailResponse,
    summary="Update an order (Admin Only)",
)
async def update_order(
    id: int,
    body: OrderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, admin_required],
) -> OrderDetailResponse:
    """
    Update order details.
    - If items are changed, automatically restocks old items and deducts new ones
    - Recomputes total_amount based on current product prices
    """
    order = await order_service.update_order(db, order_id=id, data=body)
    
    # Refetch with all relationships
    order = await order_service.get_order_by_id(db, order.id, current_user)
    return _build_order_detail_response(order)


@router.patch(
    "/{id}/status",
    response_model=OrderResponse,
    summary="Update order status (Admin & Employee)",
)
async def update_order_status(
    id: int,
    body: OrderStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, any_role_required],
) -> OrderResponse:
    """
    Update order status with validation.
    
    Valid transitions:
    - pending → ongoing, cancelled
    - ongoing → completed, cancelled
    - completed → (none - terminal state)
    - cancelled → (none - terminal state)
    
    Automatically sets completed_at when status is 'completed'.
    Logs all status changes to order_status_logs.
    """
    order = await order_service.update_order_status(
        db, order_id=id, data=body, changed_by_id=current_user.id
    )
    
    # Refetch with relationships
    order = await order_service.get_order_by_id(db, order.id, current_user)
    return _build_order_response(order)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an order (Admin Only, pending orders only)",
)
async def delete_order(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, admin_required],
) -> None:
    """
    Delete an order.
    - Only allowed for orders with 'pending' status
    - Automatically restocks all products from the order
    """
    await order_service.delete_order(db, order_id=id)
