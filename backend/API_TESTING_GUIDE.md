# API Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the Order Management System API through the Swagger UI.

**Server**: http://localhost:8000  
**Swagger UI**: http://localhost:8000/api/v1/docs  
**ReDoc**: http://localhost:8000/api/v1/redoc

---

## Prerequisites

### 1. Start the Server
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Run Database Migrations
```bash
cd backend
alembic upgrade head
```

### 3. Seed Demo Data
```bash
cd backend
python -m app.scripts.seed_demo_data
```

**Demo Credentials:**
- **Admin**: `admin@oms.local` / `Admin@1234`
- **Employee**: `sarah.johnson@oms.local` / `Employee@123`

---

## Test Scenarios

### Scenario 1: Authentication Flow ✅

#### 1.1 Login (POST /api/v1/auth/login)
1. Navigate to http://localhost:8000/api/v1/docs
2. Find `POST /api/v1/auth/login`
3. Click "Try it out"
4. Enter credentials:
```json
{
  "email": "admin@oms.local",
  "password": "Admin@1234"
}
```
5. Click "Execute"

**Expected Result:**
- Status: `200 OK`
- Response contains:
  - `access_token` (JWT string)
  - `refresh_token` (JWT string)
  - `token_type`: "bearer"
  - `user` object with profile details

**Verification Points:**
- ✅ Tokens are valid JWT format (three parts separated by dots)
- ✅ User object contains correct email and role
- ✅ No password in response

#### 1.2 Authorize Swagger UI
1. Copy the `access_token` from the login response
2. Click the "Authorize" button at the top of Swagger UI
3. In the dialog, enter: `Bearer <access_token>`
4. Click "Authorize"
5. Click "Close"

**Expected Result:**
- Padlock icons change to "locked" state
- All subsequent requests include Authorization header

#### 1.3 Get Current User (GET /api/v1/auth/me)
1. Find `GET /api/v1/auth/me`
2. Click "Try it out" → "Execute"

**Expected Result:**
- Status: `200 OK`
- Returns current user profile
- Matches the user from login response

---

### Scenario 2: Pagination Testing ✅

#### 2.1 Products Pagination
**Test Default Pagination:**
1. Find `GET /api/v1/products`
2. Execute without parameters

**Expected Result:**
- Status: `200 OK`
- Response structure:
```json
{
  "items": [...],
  "total_count": 20,
  "page": 1,
  "page_size": 20
}
```
- `items` array length ≤ `page_size`

**Test Custom Page Size:**
1. Execute with `page_size=5`

**Expected Result:**
- Returns exactly 5 items (or fewer if not enough data)
- `page_size` in response is 5

**Test Page Navigation:**
1. Execute with `page=2&page_size=5`

**Expected Result:**
- Returns different items than page 1
- `page` in response is 2

#### 2.2 Dealers Pagination
1. Find `GET /api/v1/dealers`
2. Test with different page sizes (10, 20, 50)

**Expected Result:**
- Pagination works consistently
- `total_count` remains constant across pages
- No duplicate items across pages

#### 2.3 Orders Pagination
1. Find `GET /api/v1/orders`
2. Test pagination with filters:
   - `status=pending&page_size=10`
   - `page=2&page_size=5`

**Expected Result:**
- Filtered results are paginated correctly
- `total_count` reflects filtered count, not total orders

---

### Scenario 3: Stock Management ✅

#### 3.1 Check Initial Product Stock
1. Find `GET /api/v1/products/{id}`
2. Get product ID 1 (or any product)
3. Note the `stock_quantity` value

**Example:** Initial stock = 15 units

#### 3.2 Create Order with Stock Deduction
1. Find `POST /api/v1/orders`
2. Create an order:
```json
{
  "dealer_id": 1,
  "order_date": "2026-06-29T10:00:00Z",
  "expected_delivery_date": "2026-07-15T00:00:00Z",
  "notes": "Test order for stock verification",
  "items": [
    {
      "product_id": 1,
      "quantity": 5
    }
  ]
}
```
3. Execute and note the order ID from response

**Expected Result:**
- Status: `201 Created`
- Response contains:
  - `order_number` in format `ORD-2026-####`
  - `total_amount` = product price × 5
  - Status is `pending`

#### 3.3 Verify Stock Was Deducted
1. Get product ID 1 again: `GET /api/v1/products/1`
2. Check `stock_quantity`

**Expected Result:**
- New stock = Initial stock - 5
- Example: 15 - 5 = 10 units

#### 3.4 Test Insufficient Stock Error
1. Create another order with quantity > current stock
```json
{
  "dealer_id": 1,
  "order_date": "2026-06-29T10:00:00Z",
  "items": [
    {
      "product_id": 1,
      "quantity": 100
    }
  ]
}
```

**Expected Result:**
- Status: `400 Bad Request`
- Error response:
```json
{
  "detail": {
    "error": "insufficient_stock",
    "message": "Insufficient stock for one or more products.",
    "products": [
      {
        "product_id": 1,
        "product_name": "...",
        "requested": 100,
        "available": 10
      }
    ]
  }
}
```

---

### Scenario 4: Order Status Transitions ✅

#### 4.1 Valid Transition: Pending → Ongoing
1. Get an order with `pending` status (from previous test or list)
2. Find `PATCH /api/v1/orders/{id}/status`
3. Update status:
```json
{
  "status": "ongoing",
  "remarks": "Started processing order"
}
```

**Expected Result:**
- Status: `200 OK`
- Order status changed to `ongoing`
- `completed_at` is still `null`

#### 4.2 Valid Transition: Ongoing → Completed
1. Update the same order:
```json
{
  "status": "completed",
  "remarks": "Order fulfilled"
}
```

**Expected Result:**
- Status: `200 OK`
- Order status changed to `completed`
- `completed_at` is now set to current timestamp

#### 4.3 Invalid Transition: Completed → Pending
1. Try to update the completed order:
```json
{
  "status": "pending"
}
```

**Expected Result:**
- Status: `400 Bad Request`
- Clear error message:
```json
{
  "detail": {
    "error": "invalid_status_transition",
    "message": "Cannot transition from 'completed' to 'pending'. Allowed transitions: none (terminal state)."
  }
}
```

#### 4.4 Valid Cancellation: Pending → Cancelled
1. Create a new order
2. Immediately cancel it:
```json
{
  "status": "cancelled",
  "remarks": "Customer requested cancellation"
}
```

**Expected Result:**
- Status: `200 OK`
- Order status changed to `cancelled`
- Can verify in order details endpoint

---

### Scenario 5: Employee Access Control ✅

#### 5.1 Login as Employee
1. Logout (or open incognito window)
2. Login with employee credentials:
```json
{
  "email": "sarah.johnson@oms.local",
  "password": "Employee@123"
}
```
3. Authorize Swagger UI with employee token

#### 5.2 Test Read Access
**Should Work:**
- ✅ `GET /api/v1/products` - Can view products
- ✅ `GET /api/v1/dealers` - Can view dealers
- ✅ `GET /api/v1/orders` - Can view assigned orders
- ✅ `GET /api/v1/profile/me` - Can view own profile

#### 5.3 Test Write Restrictions
**Should Fail (403 Forbidden):**
- ❌ `POST /api/v1/products` - Cannot create products
- ❌ `POST /api/v1/orders` - Cannot create orders
- ❌ `DELETE /api/v1/dealers/{id}` - Cannot delete dealers
- ❌ `GET /api/v1/employees` - Cannot access employee management

**Should Work:**
- ✅ `PATCH /api/v1/orders/{id}/status` - Can update order status
- ✅ `PUT /api/v1/profile/me` - Can update own profile

---

### Scenario 6: Data Filtering ✅

#### 6.1 Filter Products by Category
1. `GET /api/v1/products?category=Electrotherapy`

**Expected Result:**
- Returns only products with category "Electrotherapy"
- `total_count` reflects filtered count

#### 6.2 Filter Low Stock Products
1. `GET /api/v1/products?low_stock_only=true`

**Expected Result:**
- Returns only products where `stock_quantity ≤ low_stock_threshold`
- Should return at least 3 products (as per seed data)

#### 6.3 Search Products by Name
1. `GET /api/v1/products?name=ultrasound`

**Expected Result:**
- Returns products with "ultrasound" in name (case-insensitive)

#### 6.4 Filter Orders by Status
1. `GET /api/v1/orders?status=completed`

**Expected Result:**
- Returns only completed orders
- Each order has `completed_at` timestamp

#### 6.5 Filter Orders by Date Range
1. `GET /api/v1/orders?date_from=2026-06-01T00:00:00Z&date_to=2026-06-30T23:59:59Z`

**Expected Result:**
- Returns only orders within June 2026
- `order_date` of all items is within range

---

### Scenario 7: Dashboard Analytics ✅

#### 7.1 Dashboard Summary
1. `GET /api/v1/dashboard/summary`

**Expected Result:**
- Status: `200 OK`
- Response contains:
```json
{
  "total_orders": 30,
  "pending_orders": 2,
  "ongoing_orders": 8,
  "completed_orders": 18,
  "cancelled_orders": 2,
  "current_month_revenue": "125000.00",
  "low_stock_products": 3,
  "total_active_dealers": 8,
  "total_active_employees": 4
}
```
- All counts are positive integers
- Revenue is decimal with 2 places

#### 7.2 Orders Trend
1. `GET /api/v1/dashboard/orders-trend?period=monthly`

**Expected Result:**
- Returns 12 months of data
- Each period has `order_count` and `revenue`
- Period format: `YYYY-MM`

2. Test weekly trend:
   `GET /api/v1/dashboard/orders-trend?period=weekly`

**Expected Result:**
- Returns 12 weeks of data
- Period format: `YYYY-Www` (e.g., "2026-W26")

#### 7.3 Top Products
1. `GET /api/v1/dashboard/top-products?limit=5`

**Expected Result:**
- Returns top 5 products by quantity sold
- Sorted descending by `total_quantity_sold`
- Each includes `total_revenue`

#### 7.4 Top Dealers
1. `GET /api/v1/dashboard/top-dealers?limit=5`

**Expected Result:**
- Returns top 5 dealers by order value
- Sorted descending by `total_value`
- Each includes `total_orders` count

---

### Scenario 8: Profile Management ✅

#### 8.1 Update Own Profile
1. `PUT /api/v1/profile/me`
```json
{
  "full_name": "Sarah Johnson Updated",
  "phone": "+1-555-9999"
}
```

**Expected Result:**
- Status: `200 OK`
- Profile updated successfully
- Verify with `GET /api/v1/profile/me`

#### 8.2 Change Password
1. `PUT /api/v1/profile/me/password`
```json
{
  "current_password": "Employee@123",
  "new_password": "NewPassword@456"
}
```

**Expected Result:**
- Status: `200 OK`
- Message: "Password changed successfully."

2. Test login with new password
3. Change password back for consistency

#### 8.3 Test Invalid Password Change
1. Try with wrong current password:
```json
{
  "current_password": "WrongPassword",
  "new_password": "NewPassword@456"
}
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: "Current password is incorrect."

---

### Scenario 9: Employee Management (Admin Only) ✅

#### 9.1 Create Employee
1. Login as admin
2. `POST /api/v1/employees`
```json
{
  "full_name": "Test Employee",
  "email": "test.employee@oms.local",
  "password": "TestPass@123",
  "phone": "+1-555-0199"
}
```

**Expected Result:**
- Status: `201 Created`
- Employee created with hashed password
- Role is automatically `employee`

#### 9.2 Get Employee Workload
1. `GET /api/v1/employees/{id}/workload` (use Sarah Johnson's ID)

**Expected Result:**
```json
{
  "employee_id": 2,
  "employee_name": "Sarah Johnson",
  "pending_orders": 0,
  "ongoing_orders": 2,
  "completed_orders": 5,
  "total_assigned_orders": 7
}
```

#### 9.3 Test Deactivation Protection
1. Try to delete an employee with orders:
   `DELETE /api/v1/employees/{id}`

**Expected Result:**
- Status: `400 Bad Request`
- Error: "Cannot deactivate employee with existing orders. Found X associated order(s)."

---

## Testing Checklist

### ✅ Authentication
- [ ] Login returns valid tokens
- [ ] Invalid credentials rejected
- [ ] Token refresh works
- [ ] Logout revokes token
- [ ] Protected endpoints require auth

### ✅ Pagination
- [ ] Default page size works (20)
- [ ] Custom page sizes work (5, 10, 50)
- [ ] Page navigation works
- [ ] Total count is accurate
- [ ] No duplicate items across pages

### ✅ Stock Management
- [ ] Order creation deducts stock
- [ ] Insufficient stock error is clear
- [ ] Multiple items deducted correctly
- [ ] Order deletion restocks items
- [ ] Stock never goes negative

### ✅ Status Transitions
- [ ] pending → ongoing works
- [ ] ongoing → completed works
- [ ] completed → (any) rejected
- [ ] cancelled → (any) rejected
- [ ] Error messages are clear
- [ ] completed_at set correctly

### ✅ Access Control
- [ ] Admin has full access
- [ ] Employee has limited access
- [ ] Employees see only assigned orders
- [ ] Forbidden responses are 403
- [ ] Unauthorized responses are 401

### ✅ Data Integrity
- [ ] Email uniqueness enforced
- [ ] SKU uniqueness enforced
- [ ] Cannot delete with dependencies
- [ ] Soft deletes work correctly
- [ ] Timestamps are UTC

### ✅ Error Handling
- [ ] 400 for bad requests
- [ ] 401 for auth failures
- [ ] 403 for authorization failures
- [ ] 404 for not found
- [ ] 409 for conflicts
- [ ] Error messages are descriptive

---

## Common Issues & Solutions

### Issue: Server won't start
**Solution:** Check if port 8000 is already in use
```bash
netstat -ano | findstr :8000
```

### Issue: Database connection failed
**Solution:** Verify PostgreSQL is running and .env has correct credentials

### Issue: Token expired
**Solution:** Use refresh token endpoint or login again

### Issue: 422 Validation Error
**Solution:** Check request body matches schema in Swagger UI

---

## Report Format

When reporting test results, use this format:

```
### Test: [Scenario Name]
**Status**: ✅ Pass / ❌ Fail
**Endpoint**: [Method] [Path]
**Request**: [Body if applicable]
**Expected**: [Expected behavior]
**Actual**: [What actually happened]
**Issue**: [Description of problem if failed]
```

---

## Automated Testing (Future)

Consider implementing:
- [ ] Integration tests with pytest
- [ ] API contract tests
- [ ] Load testing with Locust
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline tests

---

**Happy Testing!** 🚀
