# Additional APIs Documentation

This document covers the Employees, Dashboard, and Profile APIs.

---

## 1. Employees API

**Base Path**: `/api/v1/employees`  
**Auth**: Admin only (all endpoints)

### Endpoints

#### GET /api/v1/employees
List all employees with pagination and search.

**Query Parameters**:
- `page` (default: 1)
- `page_size` (default: 20, max: 100)
- `search` - Search by name or email (case-insensitive)

**Response**: `EmployeeListResponse`
```json
{
  "items": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "avatar_url": "https://example.com/avatar.jpg",
      "is_active": true,
      "created_at": "2026-06-29T10:00:00Z",
      "updated_at": "2026-06-29T10:00:00Z"
    }
  ],
  "total_count": 1,
  "page": 1,
  "page_size": 20
}
```

---

#### GET /api/v1/employees/{id}
Get employee details by ID.

**Response**: `EmployeeResponse`

---

#### POST /api/v1/employees
Create a new employee account.

**Request Body**:
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Features**:
- Password is hashed server-side using bcrypt
- Email uniqueness enforced (409 if duplicate)
- Email normalized to lowercase
- Role automatically set to `employee`
- Account active by default

**Response**: `EmployeeResponse` (201 Created)

---

#### PUT /api/v1/employees/{id}
Update employee information.

**Request Body** (all fields optional):
```json
{
  "full_name": "Jane Smith Updated",
  "email": "jane.new@example.com",
  "phone": "+0987654321",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Features**:
- Email uniqueness validation (409 if duplicate)
- Partial updates supported (only provided fields updated)

**Response**: `EmployeeResponse`

---

#### DELETE /api/v1/employees/{id}
Soft delete an employee.

**Features**:
- Sets `is_active = False` (soft delete)
- **Prevents deactivation** if employee has any orders (created or assigned)
- Returns 400 with error if orders exist

**Error Response** (400):
```json
{
  "detail": {
    "error": "cannot_deactivate_employee",
    "message": "Cannot deactivate employee with existing orders. Found 5 associated order(s)."
  }
}
```

**Response**: 204 No Content (success)

---

#### GET /api/v1/employees/{id}/workload
Get employee workload statistics.

**Response**: `EmployeeWorkloadResponse`
```json
{
  "employee_id": 1,
  "employee_name": "John Doe",
  "pending_orders": 3,
  "ongoing_orders": 5,
  "completed_orders": 42,
  "total_assigned_orders": 50
}
```

**Use Cases**:
- Monitor employee workload distribution
- Identify underutilized or overloaded employees
- Performance tracking

---

## 2. Dashboard API

**Base Path**: `/api/v1/dashboard`  
**Auth**: Admin only (all endpoints)

### Endpoints

#### GET /api/v1/dashboard/summary
Get comprehensive dashboard summary statistics.

**Response**: `DashboardSummaryResponse`
```json
{
  "total_orders": 150,
  "pending_orders": 10,
  "ongoing_orders": 25,
  "completed_orders": 100,
  "cancelled_orders": 15,
  "current_month_revenue": "125000.00",
  "low_stock_products": 8,
  "total_active_dealers": 45,
  "total_active_employees": 12
}
```

**Metrics**:
- **Total orders**: All-time order count
- **Orders by status**: Breakdown by pending/ongoing/completed/cancelled
- **Current month revenue**: Sum of `total_amount` for completed orders in current month (based on `completed_at`)
- **Low stock products**: Products where `stock_quantity <= low_stock_threshold`
- **Active dealers/employees**: Count of active records

---

#### GET /api/v1/dashboard/orders-trend
Get order count and revenue trend over time.

**Query Parameters**:
- `period` - "weekly" or "monthly" (default: "monthly")

**Response**: `OrdersTrendResponse`
```json
{
  "period_type": "monthly",
  "data": [
    {
      "period": "2025-07",
      "order_count": 15,
      "revenue": "75000.00"
    },
    {
      "period": "2025-08",
      "order_count": 22,
      "revenue": "110000.00"
    },
    ...
  ]
}
```

**Features**:
- Returns last 12 periods (weeks or months)
- Weekly format: `YYYY-Www` (ISO week, e.g., "2026-W26")
- Monthly format: `YYYY-MM` (e.g., "2026-06")
- Includes all orders regardless of status
- Revenue is sum of `total_amount` for all orders in period

---

#### GET /api/v1/dashboard/top-products
Get best-selling products ranked by quantity.

**Query Parameters**:
- `limit` (default: 5, max: 20)

**Response**: `TopProductsResponse`
```json
{
  "data": [
    {
      "product_id": 1,
      "product_name": "Ultrasound Machine",
      "product_sku": "USM-001",
      "total_quantity_sold": 150,
      "total_revenue": "750000.00"
    },
    ...
  ]
}
```

**Ranking**: By `total_quantity_sold` (descending)  
**Only includes**: Active products

---

#### GET /api/v1/dashboard/top-dealers
Get top dealers ranked by total order value.

**Query Parameters**:
- `limit` (default: 5, max: 20)

**Response**: `TopDealersResponse`
```json
{
  "data": [
    {
      "dealer_id": 1,
      "dealer_name": "ABC Medical Supplies",
      "total_orders": 45,
      "total_value": "500000.00"
    },
    ...
  ]
}
```

**Ranking**: By `total_value` (descending)  
**Only includes**: Active dealers

---

#### GET /api/v1/dashboard/recent-orders
Get most recent orders.

**Query Parameters**:
- `limit` (default: 10, max: 50)

**Response**: `RecentOrdersResponse`
```json
{
  "data": [
    {
      "id": 150,
      "order_number": "ORD-2026-0150",
      "dealer_name": "ABC Medical Supplies",
      "status": "ongoing",
      "total_amount": "15000.00",
      "order_date": "2026-06-29T10:00:00Z"
    },
    ...
  ]
}
```

**Ordering**: By `created_at` (descending)

---

## 3. Profile API

**Base Path**: `/api/v1/profile`  
**Auth**: Admin & Employee (all endpoints)

### Endpoints

#### GET /api/v1/profile/me
Get current authenticated user's profile.

**Response**: `UserProfile`
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "employee",
  "phone": "+1234567890",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_active": true,
  "created_at": "2026-06-29T10:00:00Z",
  "updated_at": "2026-06-29T10:00:00Z"
}
```

---

#### PUT /api/v1/profile/me
Update current user's profile.

**Request Body** (all fields optional):
```json
{
  "full_name": "John Doe Updated",
  "phone": "+0987654321",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Restrictions**:
- Can update: `full_name`, `phone`, `avatar_url`
- Cannot update: `email`, `role`, `is_active`
- Use admin's `/employees/{id}` endpoint to update email

**Response**: `UserProfile`

---

#### PUT /api/v1/profile/me/password
Change current user's password.

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePass456!"
}
```

**Validation**:
1. Verifies `current_password` matches stored hash
2. Ensures `new_password` is different from `current_password`
3. New password must meet minimum length (8 chars)

**Error Responses**:

Invalid current password (400):
```json
{
  "detail": {
    "error": "invalid_password",
    "message": "Current password is incorrect."
  }
}
```

Same password (400):
```json
{
  "detail": {
    "error": "same_password",
    "message": "New password must be different from current password."
  }
}
```

**Response**: `MessageResponse`
```json
{
  "message": "Password changed successfully."
}
```

---

## Security Notes

### Employees API
- Admin-only access ensures proper access control
- Password hashing prevents plain-text storage
- Email uniqueness prevents duplicate accounts
- Soft delete preserves referential integrity with orders
- Order association check prevents data inconsistency

### Dashboard API
- Admin-only access protects sensitive business metrics
- Real-time calculations ensure up-to-date statistics
- Efficient queries with proper indexing
- Aggregations use database-level operations

### Profile API
- Users can only modify their own profile
- Password change requires current password verification
- Email changes restricted to prevent unauthorized account takeover
- Role changes restricted to prevent privilege escalation

---

## Implementation Files

### Schemas
- `backend/app/schemas/employee.py`
- `backend/app/schemas/dashboard.py`
- `backend/app/schemas/profile.py`

### Services
- `backend/app/services/employee_service.py`
- `backend/app/services/dashboard_service.py`

### Endpoints
- `backend/app/api/v1/endpoints/employees.py`
- `backend/app/api/v1/endpoints/dashboard.py`
- `backend/app/api/v1/endpoints/profile.py`

All integrated with existing authentication, authorization, and database infrastructure.
