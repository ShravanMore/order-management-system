from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.core.security import get_password_hash


async def get_employees(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> tuple[list[User], int]:
    """
    Retrieve employees with pagination and optional search by name/email.
    Returns (items, total_count).
    """
    conditions = [User.role == UserRole.employee]
    
    if search:
        search_pattern = f"%{search}%"
        conditions.append(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )

    where_clause = and_(*conditions)

    # Count query
    count_query = select(func.count()).select_from(User).where(where_clause)
    count_result = await db.execute(count_query)
    total_count = count_result.scalar_one()

    # Items query
    offset = (page - 1) * page_size
    items_query = (
        select(User)
        .where(where_clause)
        .order_by(User.full_name.asc())
        .offset(offset)
        .limit(page_size)
    )
    items_result = await db.execute(items_query)
    items = list(items_result.scalars().all())

    return items, total_count


async def get_employee_by_id(db: AsyncSession, employee_id: int) -> User:
    """Retrieve an employee by ID. Raises 404 if not found or not an employee."""
    query = select(User).where(
        and_(User.id == employee_id, User.role == UserRole.employee)
    )
    result = await db.execute(query)
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Employee with ID {employee_id} not found."}
        )
    return employee


async def check_email_unique(
    db: AsyncSession,
    email: str,
    exclude_id: int | None = None
) -> None:
    """Raise 409 conflict if email already exists."""
    conditions = [User.email.ilike(email)]
    if exclude_id is not None:
        conditions.append(User.id != exclude_id)
        
    query = select(User).where(and_(*conditions))
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "duplicate_email", "message": f"Email '{email}' is already in use."}
        )


async def create_employee(db: AsyncSession, data: EmployeeCreate) -> User:
    """Create a new employee."""
    await check_email_unique(db, data.email)
    
    employee = User(
        full_name=data.full_name,
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        role=UserRole.employee,
        phone=data.phone,
        avatar_url=data.avatar_url,
        is_active=True
    )
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


async def update_employee(
    db: AsyncSession,
    employee_id: int,
    data: EmployeeUpdate
) -> User:
    """Update an existing employee."""
    employee = await get_employee_by_id(db, employee_id)

    update_data = data.model_dump(exclude_unset=True)
    
    if "email" in update_data and update_data["email"]:
        await check_email_unique(db, update_data["email"], exclude_id=employee_id)
        update_data["email"] = update_data["email"].lower()

    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.flush()
    await db.refresh(employee)
    return employee


async def deactivate_employee(db: AsyncSession, employee_id: int) -> None:
    """
    Soft delete an employee by setting is_active=False.
    Prevents deactivation if employee has existing orders.
    """
    employee = await get_employee_by_id(db, employee_id)
    
    # Check if employee has any orders (created or assigned)
    orders_query = select(func.count()).select_from(Order).where(
        or_(
            Order.created_by_id == employee_id,
            Order.assigned_to_id == employee_id
        )
    )
    result = await db.execute(orders_query)
    order_count = result.scalar_one()
    
    if order_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "cannot_deactivate_employee",
                "message": f"Cannot deactivate employee with existing orders. Found {order_count} associated order(s)."
            }
        )
    
    employee.is_active = False
    await db.flush()


async def get_employee_workload(db: AsyncSession, employee_id: int) -> dict:
    """
    Get workload statistics for an employee.
    Returns counts of pending/ongoing/completed orders assigned to them.
    """
    employee = await get_employee_by_id(db, employee_id)
    
    # Count orders by status
    pending_query = select(func.count()).select_from(Order).where(
        and_(Order.assigned_to_id == employee_id, Order.status == OrderStatus.pending)
    )
    ongoing_query = select(func.count()).select_from(Order).where(
        and_(Order.assigned_to_id == employee_id, Order.status == OrderStatus.ongoing)
    )
    completed_query = select(func.count()).select_from(Order).where(
        and_(Order.assigned_to_id == employee_id, Order.status == OrderStatus.completed)
    )
    total_query = select(func.count()).select_from(Order).where(
        Order.assigned_to_id == employee_id
    )
    
    pending_result = await db.execute(pending_query)
    ongoing_result = await db.execute(ongoing_query)
    completed_result = await db.execute(completed_query)
    total_result = await db.execute(total_query)
    
    return {
        "employee_id": employee.id,
        "employee_name": employee.full_name,
        "pending_orders": pending_result.scalar_one(),
        "ongoing_orders": ongoing_result.scalar_one(),
        "completed_orders": completed_result.scalar_one(),
        "total_assigned_orders": total_result.scalar_one(),
    }


async def calculate_salary_for_month(
    db: AsyncSession,
    employee_id: int,
    year: int,
    month: int
) -> dict:
    """
    Calculate salary breakdown for an employee for a specific month.
    Returns:
        - base_salary
        - commission_rate
        - completed_orders_count
        - completed_orders_value
        - commission_earned
        - total_salary
        - has_salary_setup (False if base_salary or commission_percentage not set)
    """
    employee = await get_employee_by_id(db, employee_id)
    
    # Check if salary setup exists
    has_salary_setup = (
        employee.base_salary is not None 
        and employee.commission_percentage is not None
    )
    
    base_salary = employee.base_salary or Decimal("0")
    commission_rate = employee.commission_percentage or Decimal("0")
    
    # Calculate commission from completed orders in the specified month
    # completed_at is when the order was marked as completed
    query = (
        select(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            and_(
                Order.assigned_to_id == employee_id,
                Order.status == OrderStatus.completed,
                extract('year', Order.completed_at) == year,
                extract('month', Order.completed_at) == month,
            )
        )
    )
    
    result = await db.execute(query)
    row = result.one()
    completed_orders_count = row[0]
    completed_orders_value = Decimal(str(row[1]))
    
    # Calculate commission
    commission_earned = (completed_orders_value * commission_rate) / Decimal("100")
    total_salary = base_salary + commission_earned
    
    return {
        "year": year,
        "month": month,
        "base_salary": str(base_salary),
        "commission_rate": str(commission_rate),
        "completed_orders_count": completed_orders_count,
        "completed_orders_value": str(completed_orders_value),
        "commission_earned": str(commission_earned),
        "total_salary": str(total_salary),
        "has_salary_setup": has_salary_setup,
    }
