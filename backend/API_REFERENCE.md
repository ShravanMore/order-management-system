# Complete API Reference

## Overview

This is a comprehensive REST API for the Physiotherapy Equipment Order Management System built with FastAPI.

**Base URL**: `/api/v1`  
**Authentication**: JWT Bearer Token  
**API Documentation**: `/api/v1/docs` (Swagger UI)

---

## Authentication Endpoints

### POST /api/v1/auth/login
Login with email and password. Returns access and refresh tokens.

**Auth**: None (public)

**Request**:
```json
{
  "email": "admin@oms.local",
  "password": "Admin@1234"
}
```

**Response**: `TokenResponse` with both tokens and user profile

---

### POST /api/v1/auth/refresh
Exchange refresh token for new access token.

**Auth**: None (public)

**Request**:
```json
{
  "refresh_token": "eyJ..."
}
```

**Response**: `AccessTokenResponse` with new access token

---

### GET /api/v1/auth/me
Get current authenticated user's profile.

**Auth**: Required (Admin & Employee)

---

### POST /api/v1/auth/logout
Revoke refresh token (logout).

**Auth**: None (public)

**Request**:
```json
{
  "refresh_token": "eyJ..."
}
```

---

## Dealers API

**Base Path**: `/api/v1/dealers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dealers` | Admin & Employee | List dealers (paginated, filterable) |
| GET | `/dealers/{id}` | Admin & Employee | Get dealer details |
| POST | `/dealers` | Admin | Create dealer |
| PUT | `/dealers/{id}` | Admin | Update dealer |
| DELETE | `/dealers/{id}` | Admin | Soft delete dealer |

**Filters**: `name`, `city`

---

## Products API

**Base Path**: `/api/v1/products`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | Admin & Employee | List products (paginated, filterable) |
| GET | `/products/{id}` | Admin & Employee | Get product details |
| POST | `/products` | Admin | Create product |
| PUT | `/products/{id}` | Admin | Update product |
| PATCH | `/products/{id}/stock` | Admin | Adjust stock quantity |
| DELETE | `/products/{id}` | Admin | Soft delete product |

**Filters**: `category`, `name`, `sku`, `low_stock_only`

---

## Orders API

**Base Path**: `/api/v1/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders` | Admin & Employee | List orders (paginated, filterable) |
| GET | `/orders/{id}` | Admin & Employee | Get order details with items & logs |
| POST | `/orders` | Admin | Create order (auto-deducts stock) |
| PUT | `/orders/{id}` | Admin | Update order (adjusts stock) |
| PATCH | `/orders/{id}/status` | Admin & Employee | Update order status |
| DELETE | `/orders/{id}` | Admin | Delete pending order (restocks) |

**Filters**: `status`, `dealer_id`, `assigned_to_id`, `date_from`, `date_to`, `show_all`

**Order Status Flow**:
- `pending` → `ongoing`, `cancelled`
- `ongoing` → `completed`, `cancelled`
- `completed` → (terminal)
- `cancelled` → (terminal)

---

## Employees API

**Base Path**: `/api/v1/employees`  
**Auth**: Admin only (all endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/employees` | Admin | List employees (paginated, searchable) |
| GET | `/employees/{id}` | Admin | Get employee details |
| POST | `/employees` | Admin | Create employee |
| PUT | `/employees/{id}` | Admin | Update employee |
| DELETE | `/employees/{id}` | Admin | Deactivate employee (if no orders) |
| GET | `/employees/{id}/workload` | Admin | Get employee workload stats |

**Search**: `search` (by name or email)

---

## Dashboard API

**Base Path**: `/api/v1/dashboard`  
**Auth**: Admin only (all endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Overall statistics (orders, revenue, stock) |
| GET | `/dashboard/orders-trend` | Order count & revenue over time |
| GET | `/dashboard/top-products` | Best-selling products by quantity |
| GET | `/dashboard/top-dealers` | Top dealers by order value |
| GET | `/dashboard/recent-orders` | Most recent orders |

**Trend Periods**: `weekly` (last 12 weeks) or `monthly` (last 12 months)

---

## Profile API

**Base Path**: `/api/v1/profile`  
**Auth**: Admin & Employee (all endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/me` | Get own profile |
| PUT | `/profile/me` | Update own profile (name, phone, avatar) |
| PUT | `/profile/me/password` | Change own password (requires current password) |

---

## Data Models

### User Roles
- `admin` - Full system access
- `employee` - Limited access (assigned orders, read-only on dealers/products)

### Order Status
- `pending` - Order created, not yet processing
- `ongoing` - Order being processed
- `completed` - Order fulfilled (sets `completed_at`)
- `cancelled` - Order cancelled

### Common Response Fields

**Pagination**:
```json
{
  "items": [...],
  "total_count": 100,
  "page": 1,
  "page_size": 20
}
```

**Error Response**:
```json
{
  "detail": {
    "error": "error_code",
    "message": "Human-readable message"
  }
}
```

---

## Authentication Flow

1. **Login**: POST `/auth/login` → Receive `access_token` + `refresh_token`
2. **API Calls**: Include `Authorization: Bearer {access_token}` header
3. **Token Expired**: POST `/auth/refresh` with `refresh_token` → Get new `access_token`
4. **Logout**: POST `/auth/logout` with `refresh_token` → Revoke token

**Token Lifespans**:
- Access Token: 30 minutes
- Refresh Token: 7 days

---

## Key Features

### Transaction Safety
All operations that modify multiple records (order creation, updates, deletions) happen within database transactions. Failures roll back completely.

### Stock Management
- Order creation: Validates and deducts stock atomically
- Order updates: Restocks old items, validates and deducts new items
- Order deletion: Restocks all items (pending orders only)
- Product adjustments: Prevents negative stock

### Access Control
- Role-based permissions at endpoint level
- Employees see only assigned/unassigned orders (unless `show_all=true`)
- Users can only modify their own profile (email changes via admin)
- Order deletion restricted to pending status

### Data Integrity
- Soft deletes preserve referential integrity
- Cannot delete dealers/products with active orders
- Cannot deactivate employees with existing orders
- Email uniqueness enforced
- SKU uniqueness enforced

### Audit Trail
- Order status changes logged with user, timestamp, remarks
- `created_at` and `updated_at` timestamps on all entities
- Order number generation with year-based sequences

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `unauthorized` | 401 | Invalid or expired token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `duplicate_email` | 409 | Email already in use |
| `duplicate_sku` | 409 | SKU already exists |
| `insufficient_stock` | 400 | Not enough product stock |
| `invalid_status_transition` | 400 | Invalid order status change |
| `cannot_delete_order` | 400 | Cannot delete non-pending order |
| `cannot_deactivate_employee` | 400 | Employee has existing orders |
| `invalid_credentials` | 401 | Wrong email or password |
| `invalid_password` | 400 | Wrong current password |

---

## Testing the API

### Using Swagger UI
Navigate to `/api/v1/docs` for interactive API documentation.

### Using cURL

**Login**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@oms.local", "password": "Admin@1234"}'
```

**Authenticated Request**:
```bash
curl -X GET http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer {access_token}"
```

---

## Rate Limiting & Production Considerations

**Current Implementation**:
- In-memory token denylist (single-process only)
- No rate limiting

**Production Recommendations**:
1. Use Redis for token denylist (multi-process support)
2. Implement rate limiting per IP/user
3. Add request logging and monitoring
4. Configure CORS origins properly
5. Use environment-specific configs
6. Enable HTTPS only
7. Set up database connection pooling
8. Add request/response compression

---

## API Versioning

Current version: `v1`

All endpoints prefixed with `/api/v1`. Future versions will use `/api/v2`, etc., allowing backward compatibility.

---

## Support & Documentation

- **OpenAPI Schema**: `/api/v1/openapi.json`
- **Swagger UI**: `/api/v1/docs`
- **ReDoc**: `/api/v1/redoc`
- **Health Check**: `/health` (outside versioned API)

---

## Quick Reference: Endpoint Count

- **Auth**: 4 endpoints
- **Dealers**: 5 endpoints
- **Products**: 6 endpoints
- **Orders**: 6 endpoints
- **Employees**: 6 endpoints
- **Dashboard**: 5 endpoints
- **Profile**: 3 endpoints

**Total**: 35 REST endpoints
