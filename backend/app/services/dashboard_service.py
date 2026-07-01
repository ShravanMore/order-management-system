from __future__ import annotations

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import select, func, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.dealer import Dealer
from app.models.user import User, UserRole


async def get_dashboard_summary(db: AsyncSession) -> dict:
    """
    Get dashboard summary statistics:
    - Total orders and counts per status
    - Current month revenue (completed orders only)
    - Low stock products count
    - Total active dealers and employees
    """
    now = datetime.now(timezone.utc)
    current_year = now.year
    current_month = now.month
    
    # Total orders
    total_orders_result = await db.execute(select(func.count()).select_from(Order))
    total_orders = total_orders_result.scalar_one()
    
    # Orders by status
    pending_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.pending)
    )
    ongoing_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.ongoing)
    )
    completed_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.completed)
    )
    cancelled_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.cancelled)
    )
    
    # Current month revenue (completed orders only)
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            and_(
                Order.status == OrderStatus.completed,
                extract('year', Order.completed_at) == current_year,
                extract('month', Order.completed_at) == current_month
            )
        )
    )
    current_month_revenue = revenue_result.scalar_one()
    
    # Low stock products
    low_stock_result = await db.execute(
        select(func.count())
        .select_from(Product)
        .where(
            and_(
                Product.is_active == True,
                Product.stock_quantity <= Product.low_stock_threshold
            )
        )
    )
    low_stock_count = low_stock_result.scalar_one()
    
    # Active dealers
    dealers_result = await db.execute(
        select(func.count()).select_from(Dealer).where(Dealer.is_active == True)
    )
    total_dealers = dealers_result.scalar_one()
    
    # Active employees
    employees_result = await db.execute(
        select(func.count())
        .select_from(User)
        .where(and_(User.role == UserRole.employee, User.is_active == True))
    )
    total_employees = employees_result.scalar_one()
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_result.scalar_one(),
        "ongoing_orders": ongoing_result.scalar_one(),
        "completed_orders": completed_result.scalar_one(),
        "cancelled_orders": cancelled_result.scalar_one(),
        "current_month_revenue": Decimal(str(current_month_revenue)),
        "low_stock_products": low_stock_count,
        "total_active_dealers": total_dealers,
        "total_active_employees": total_employees,
    }


async def get_orders_trend(
    db: AsyncSession,
    period: str = "monthly",
    periods: int = 12
) -> dict:
    """
    Get order count and revenue trend grouped by week or month for last N periods.
    
    Args:
        period: "weekly" or "monthly"
        periods: Number of periods to retrieve (default: 12)
    """
    now = datetime.now(timezone.utc)
    
    if period == "weekly":
        # Get last N weeks
        data = []
        for i in range(periods - 1, -1, -1):
            week_start = now - timedelta(weeks=i, days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            week_end = week_start + timedelta(days=7)
            
            # Query orders in this week
            result = await db.execute(
                select(
                    func.count(Order.id),
                    func.coalesce(func.sum(Order.total_amount), 0)
                )
                .where(
                    and_(
                        Order.order_date >= week_start,
                        Order.order_date < week_end
                    )
                )
            )
            count, revenue = result.one()
            
            # Format as ISO week: YYYY-Www
            iso_year, iso_week, _ = week_start.isocalendar()
            period_label = f"{iso_year}-W{iso_week:02d}"
            
            data.append({
                "period": period_label,
                "order_count": count or 0,
                "revenue": Decimal(str(revenue))
            })
    else:  # monthly
        # Get last N months
        data = []
        for i in range(periods - 1, -1, -1):
            # Calculate target month
            target_month = now.month - i
            target_year = now.year
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            # Query orders in this month
            result = await db.execute(
                select(
                    func.count(Order.id),
                    func.coalesce(func.sum(Order.total_amount), 0)
                )
                .where(
                    and_(
                        extract('year', Order.order_date) == target_year,
                        extract('month', Order.order_date) == target_month
                    )
                )
            )
            count, revenue = result.one()
            
            period_label = f"{target_year}-{target_month:02d}"
            
            data.append({
                "period": period_label,
                "order_count": count or 0,
                "revenue": Decimal(str(revenue))
            })
    
    return {
        "period_type": period,
        "data": data
    }


async def get_top_products(db: AsyncSession, limit: int = 5) -> list[dict]:
    """
    Get best-selling products by total quantity ordered.
    """
    result = await db.execute(
        select(
            Product.id,
            Product.name,
            Product.sku,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("total_quantity"),
            func.coalesce(func.sum(OrderItem.subtotal), 0).label("total_revenue")
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .where(Product.is_active == True)
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    
    rows = result.all()
    return [
        {
            "product_id": row.id,
            "product_name": row.name,
            "product_sku": row.sku,
            "total_quantity_sold": int(row.total_quantity or 0),
            "total_revenue": Decimal(str(row.total_revenue or 0))
        }
        for row in rows
    ]


async def get_top_dealers(db: AsyncSession, limit: int = 5) -> list[dict]:
    """
    Get top dealers ranked by total order value.
    """
    result = await db.execute(
        select(
            Dealer.id,
            Dealer.name,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_value")
        )
        .join(Order, Order.dealer_id == Dealer.id)
        .where(Dealer.is_active == True)
        .group_by(Dealer.id, Dealer.name)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(limit)
    )
    
    rows = result.all()
    return [
        {
            "dealer_id": row.id,
            "dealer_name": row.name,
            "total_orders": row.order_count,
            "total_value": Decimal(str(row.total_value or 0))
        }
        for row in rows
    ]


async def get_recent_orders(db: AsyncSession, limit: int = 10) -> list[dict]:
    """
    Get most recent orders with dealer name and status.
    """
    result = await db.execute(
        select(
            Order.id,
            Order.order_number,
            Dealer.name.label("dealer_name"),
            Order.status,
            Order.total_amount,
            Order.order_date
        )
        .join(Dealer, Dealer.id == Order.dealer_id)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    
    rows = result.all()
    return [
        {
            "id": row.id,
            "order_number": row.order_number,
            "dealer_name": row.dealer_name,
            "status": row.status.value,
            "total_amount": row.total_amount,
            "order_date": row.order_date
        }
        for row in rows
    ]
