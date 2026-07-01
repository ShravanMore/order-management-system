# Import all models here so that SQLAlchemy's metadata (and Alembic's
# autogenerate) picks up every table automatically.
from app.models.user import User, UserRole  # noqa: F401
from app.models.dealer import Dealer  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusLog  # noqa: F401

__all__ = [
    "User",
    "UserRole",
    "Dealer",
    "Product",
    "Order",
    "OrderItem",
    "OrderStatus",
    "OrderStatusLog",
]
