from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status

from app.models.order import Order, OrderItem, OrderStatus, OrderStatusLog
from app.models.product import Product
from app.models.dealer import Dealer
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderUpdate, OrderStatusUpdate


async def _generate_order_number(db: AsyncSession) -> str:
    """Generate unique order number in format ORD-YYYY-####"""
    year = datetime.now(timezone.utc).year
    prefix = f"ORD-{year}-"
    
    # Find the highest sequence number for this year
    result = await db.execute(
        select(Order.order_number)
        .where(Order.order_number.like(f"{prefix}%"))
        .order_by(Order.order_number.desc())
        .limit(1)
    )
    last_order_number = result.scalar_one_or_none()
    
    if last_order_number:
        # Extract sequence and increment
        sequence = int(last_order_number.split("-")[-1]) + 1
    else:
        sequence = 1
    
    return f"{prefix}{sequence:04d}"


async def _validate_stock_availability(
    db: AsyncSession,
    items: list[tuple[int, int]]  # [(product_id, quantity), ...]
) -> dict[int, Product]:
    """
    Validate that all products exist and have sufficient stock.
    Returns dict of {product_id: Product} for later use.
    Raises HTTPException if validation fails.
    """
    product_ids = [item[0] for item in items]
    
    # Fetch all products at once
    result = await db.execute(
        select(Product).where(
            and_(
                Product.id.in_(product_ids),
                Product.is_active == True
            )
        )
    )
    products = {p.id: p for p in result.scalars().all()}
    
    # Check all products exist
    missing_ids = set(product_ids) - set(products.keys())
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "product_not_found",
                "message": f"Products with IDs {sorted(missing_ids)} not found or inactive."
            }
        )
    
    # Check stock availability
    insufficient_stock = []
    for product_id, quantity in items:
        product = products[product_id]
        if product.stock_quantity < quantity:
            insufficient_stock.append({
                "product_id": product_id,
                "product_name": product.name,
                "requested": quantity,
                "available": product.stock_quantity
            })
    
    if insufficient_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "insufficient_stock",
                "message": "Insufficient stock for one or more products.",
                "products": insufficient_stock
            }
        )
    
    return products


async def _validate_dealer_exists(db: AsyncSession, dealer_id: int) -> Dealer:
    """Validate dealer exists and is active."""
    result = await db.execute(
        select(Dealer).where(
            and_(Dealer.id == dealer_id, Dealer.is_active == True)
        )
    )
    dealer = result.scalar_one_or_none()
    
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "dealer_not_found",
                "message": f"Dealer with ID {dealer_id} not found or inactive."
            }
        )
    
    return dealer


async def _validate_user_exists(db: AsyncSession, user_id: int) -> User:
    """Validate user exists and is active."""
    result = await db.execute(
        select(User).where(
            and_(User.id == user_id, User.is_active == True)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "user_not_found",
                "message": f"User with ID {user_id} not found or inactive."
            }
        )
    
    return user


async def create_order(
    db: AsyncSession,
    data: OrderCreate,
    created_by_id: int
) -> Order:
    """
    Create a new order with items, generate order number, compute totals,
    and deduct stock quantities. Everything in a single transaction.
    """
    # Validate dealer
    await _validate_dealer_exists(db, data.dealer_id)
    
    # Prepare items list for validation
    items_data = [(item.product_id, item.quantity) for item in data.items]
    
    # Validate stock availability
    products = await _validate_stock_availability(db, items_data)
    
    # Generate order number
    order_number = await _generate_order_number(db)
    
    # Create order
    order = Order(
        order_number=order_number,
        dealer_id=data.dealer_id,
        created_by_id=created_by_id,
        order_date=data.order_date,
        expected_delivery_date=data.expected_delivery_date,
        notes=data.notes,
        status=OrderStatus.pending,
        total_amount=Decimal("0.00")
    )
    db.add(order)
    await db.flush()  # Get order.id
    
    # Create order items and compute total
    total_amount = Decimal("0.00")
    for item_data in data.items:
        product = products[item_data.product_id]
        unit_price = product.price
        subtotal = unit_price * item_data.quantity
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            subtotal=subtotal
        )
        db.add(order_item)
        
        # Deduct stock
        product.stock_quantity -= item_data.quantity
        
        total_amount += subtotal
    
    # Update order total
    order.total_amount = total_amount
    
    await db.flush()
    await db.refresh(order)
    
    return order


async def get_orders(
    db: AsyncSession,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    status_filter: OrderStatus | None = None,
    dealer_id: int | None = None,
    assigned_to_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    show_all: bool = False,
) -> tuple[list[Order], int]:
    """
    Retrieve orders with pagination and filtering.
    - Admins see all orders
    - Employees see assigned orders OR unassigned (unless show_all=True for admin-like access)
    """
    conditions = []
    
    # Role-based filtering
    if current_user.role == UserRole.employee and not show_all:
        # Employee sees: assigned to them OR unassigned orders
        conditions.append(
            or_(
                Order.assigned_to_id == current_user.id,
                Order.assigned_to_id.is_(None)
            )
        )
    
    # Apply filters
    if status_filter:
        conditions.append(Order.status == status_filter)
    if dealer_id:
        conditions.append(Order.dealer_id == dealer_id)
    if assigned_to_id is not None:
        if assigned_to_id == 0:  # Special case: unassigned
            conditions.append(Order.assigned_to_id.is_(None))
        else:
            conditions.append(Order.assigned_to_id == assigned_to_id)
    if date_from:
        conditions.append(Order.order_date >= date_from)
    if date_to:
        conditions.append(Order.order_date <= date_to)
    
    where_clause = and_(*conditions) if conditions else True
    
    # Count query
    count_query = select(func.count()).select_from(Order).where(where_clause)
    count_result = await db.execute(count_query)
    total_count = count_result.scalar_one()
    
    # Items query with eager loading
    offset = (page - 1) * page_size
    items_query = (
        select(Order)
        .options(
            joinedload(Order.dealer),
            joinedload(Order.created_by),
            joinedload(Order.assigned_to)
        )
        .where(where_clause)
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items_result = await db.execute(items_query)
    items = list(items_result.unique().scalars().all())
    
    return items, total_count


async def get_order_by_id(
    db: AsyncSession,
    order_id: int,
    current_user: User
) -> Order:
    """
    Retrieve order with full details including items and status logs.
    Employees can only see orders assigned to them or unassigned.
    """
    query = (
        select(Order)
        .options(
            joinedload(Order.dealer),
            joinedload(Order.created_by),
            joinedload(Order.assigned_to),
            selectinload(Order.items).joinedload(OrderItem.product),
            selectinload(Order.status_logs).joinedload(OrderStatusLog.changed_by)
        )
        .where(Order.id == order_id)
    )
    
    result = await db.execute(query)
    order = result.unique().scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Order with ID {order_id} not found."}
        )
    
    # Check employee access
    if current_user.role == UserRole.employee:
        if order.assigned_to_id is not None and order.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "forbidden",
                    "message": "You can only view orders assigned to you or unassigned orders."
                }
            )
    
    return order


async def update_order(
    db: AsyncSession,
    order_id: int,
    data: OrderUpdate
) -> Order:
    """
    Update an order. If items are updated, recompute totals and adjust stock.
    """
    # Fetch order with items
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Order with ID {order_id} not found."}
        )
    
    # Validate dealer if changed
    if data.dealer_id is not None:
        await _validate_dealer_exists(db, data.dealer_id)
        order.dealer_id = data.dealer_id
    
    # Validate assigned_to if changed
    if data.assigned_to_id is not None:
        await _validate_user_exists(db, data.assigned_to_id)
        order.assigned_to_id = data.assigned_to_id
    
    # Update simple fields
    if data.order_date is not None:
        order.order_date = data.order_date
    if data.expected_delivery_date is not None:
        order.expected_delivery_date = data.expected_delivery_date
    if data.notes is not None:
        order.notes = data.notes
    
    # Handle items update
    if data.items is not None:
        # Build old items map for stock restoration
        old_items_map = {item.product_id: item.quantity for item in order.items}
        
        # Prepare new items
        new_items_data = [(item.product_id, item.quantity) for item in data.items]
        
        # Validate stock for new items (accounting for stock we'll restore)
        products = await _validate_stock_availability(db, new_items_data)
        
        # Restore stock from old items
        for product_id, old_quantity in old_items_map.items():
            result = await db.execute(select(Product).where(Product.id == product_id))
            product = result.scalar_one_or_none()
            if product:
                product.stock_quantity += old_quantity
        
        # Delete old items
        for item in order.items:
            await db.delete(item)
        
        # Create new items
        total_amount = Decimal("0.00")
        for item_data in data.items:
            product = products[item_data.product_id]
            unit_price = product.price
            subtotal = unit_price * item_data.quantity
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=unit_price,
                subtotal=subtotal
            )
            db.add(order_item)
            
            # Deduct stock
            product.stock_quantity -= item_data.quantity
            
            total_amount += subtotal
        
        # Update total
        order.total_amount = total_amount
    
    await db.flush()
    await db.refresh(order)
    
    return order


_VALID_TRANSITIONS = {
    OrderStatus.pending: [OrderStatus.ongoing, OrderStatus.cancelled],
    OrderStatus.ongoing: [OrderStatus.completed, OrderStatus.cancelled],
    OrderStatus.completed: [],  # Terminal state
    OrderStatus.cancelled: [],  # Terminal state
}


async def update_order_status(
    db: AsyncSession,
    order_id: int,
    data: OrderStatusUpdate,
    changed_by_id: int
) -> Order:
    """
    Update order status with validation of state transitions.
    Log the change in order_status_logs.
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Order with ID {order_id} not found."}
        )
    
    old_status = order.status
    new_status = data.status
    
    # Check if transition is valid
    if new_status not in _VALID_TRANSITIONS.get(old_status, []):
        allowed = ", ".join(s.value for s in _VALID_TRANSITIONS.get(old_status, []))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_status_transition",
                "message": f"Cannot transition from '{old_status.value}' to '{new_status.value}'. "
                          f"Allowed transitions: {allowed or 'none (terminal state)'}."
            }
        )
    
    # Update status
    order.status = new_status
    
    # Set completed_at if completed
    if new_status == OrderStatus.completed:
        order.completed_at = datetime.now(timezone.utc)
    
    # Create status log
    status_log = OrderStatusLog(
        order_id=order.id,
        old_status=old_status.value,
        new_status=new_status.value,
        changed_by_id=changed_by_id,
        remarks=data.remarks
    )
    db.add(status_log)
    
    await db.flush()
    await db.refresh(order)
    
    return order


async def delete_order(db: AsyncSession, order_id: int) -> None:
    """
    Delete order (only if pending). Restock all products first.
    """
    # Fetch order with items
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Order with ID {order_id} not found."}
        )
    
    # Only allow deletion of pending orders
    if order.status != OrderStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "cannot_delete_order",
                "message": f"Only orders with 'pending' status can be deleted. Current status: '{order.status.value}'."
            }
        )
    
    # Restock products
    for item in order.items:
        result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = result.scalar_one_or_none()
        if product:
            product.stock_quantity += item.quantity
    
    # Delete order (cascade will handle items and logs)
    await db.delete(order)
    await db.flush()
