# schemas package
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    TokenResponse,
    UserProfile,
)
from app.schemas.dealer import (
    DealerCreate,
    DealerUpdate,
    DealerResponse,
    DealerListResponse,
)
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    StockAdjustmentRequest,
)
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderDetailResponse,
    OrderListResponse,
    OrderItemCreate,
    OrderItemResponse,
    OrderStatusLogResponse,
)
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    EmployeeWorkloadResponse,
)
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    OrdersTrendResponse,
    TopProductsResponse,
    TopDealersResponse,
    RecentOrdersResponse,
)
from app.schemas.profile import (
    ProfileUpdateRequest,
    PasswordChangeRequest,
)

__all__ = [
    "AccessTokenResponse",
    "LoginRequest",
    "MessageResponse",
    "RefreshRequest",
    "TokenResponse",
    "UserProfile",
    "DealerCreate",
    "DealerUpdate",
    "DealerResponse",
    "DealerListResponse",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductListResponse",
    "StockAdjustmentRequest",
    "OrderCreate",
    "OrderUpdate",
    "OrderStatusUpdate",
    "OrderResponse",
    "OrderDetailResponse",
    "OrderListResponse",
    "OrderItemCreate",
    "OrderItemResponse",
    "OrderStatusLogResponse",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "EmployeeListResponse",
    "EmployeeWorkloadResponse",
    "DashboardSummaryResponse",
    "OrdersTrendResponse",
    "TopProductsResponse",
    "TopDealersResponse",
    "RecentOrdersResponse",
    "ProfileUpdateRequest",
    "PasswordChangeRequest",
]
