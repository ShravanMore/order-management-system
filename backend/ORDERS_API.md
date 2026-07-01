# Orders API Implementation

## Overview
Complete implementation of the Orders API with full transaction safety, stock management, and status workflow enforcement.

## Endpoints

### 1. POST /api/v1/orders
**Auth**: Admin only  
**Description**: Create a new order with line items

**Features**:
- Auto-generates order number in format `ORD-YYYY-####` (zero-padded sequence)
- Validates dealer exists and is active
- Validates all products exist and have sufficient stock
- Deducts stock quantities atomically
- Computes unit_price from current product price
- Calculates subtotals and total_amount automatically
- Returns detailed error if insufficient stock

**Request Body**:
```json
{
  "dealer_id": 1,
  "order_date": "2026-06-29T10:00:00Z",
  "expected_delivery_date": "2026-07-15T10:00:00Z",
  "notes": "Urgent order",
  "items": [
    {"product_id": 1, "quantity": 5},
    {"product_id": 2, "quantity": 3}
  ]
}
```

**Response**: OrderResponse with generated order_number and computed totals

---

### 2. GET /api/v1/orders
**Auth**: Admin & Employee  
**Description**: Paginated list of orders with filtering

**Access Control**:
- **Admins**: See all orders
- **Employees**: See assigned orders OR unassigned orders (unless `show_all=true`)

**Query Parameters**:
- `page` (default: 1)
- `page_size` (default: 20, max: 100)
- `status` - Filter by OrderStatus (pending, ongoing, completed, cancelled)
- `dealer_id` - Filter by dealer
- `assigned_to_id` - Filter by assigned user (use 0 for unassigned)
- `date_from` - Filter orders from date
- `date_to` - Filter orders to date
- `show_all` - For employees: show all orders instead of just assigned/unassigned

**Response**: OrderListResponse with pagination metadata

---

### 3. GET /api/v1/orders/{id}
**Auth**: Admin & Employee (employees can only see assigned/unassigned orders)  
**Description**: Get full order details

**Includes**:
- Order information with dealer and user details
- Line items with product name and SKU
- Complete status change history from order_status_logs

**Response**: OrderDetailResponse

---

### 4. PUT /api/v1/orders/{id}
**Auth**: Admin only  
**Description**: Update order details

**Features**:
- Update dealer, assigned_to, dates, notes
- Update items list with automatic stock adjustment:
  - Restocks old items
  - Validates new items have sufficient stock
  - Deducts stock for new items
  - Recomputes total_amount based on current prices
- All changes in single transaction

**Request Body** (all fields optional):
```json
{
  "dealer_id": 2,
  "assigned_to_id": 5,
  "order_date": "2026-06-29T10:00:00Z",
  "expected_delivery_date": "2026-07-20T10:00:00Z",
  "notes": "Updated notes",
  "items": [
    {"product_id": 1, "quantity": 10},
    {"product_id": 3, "quantity": 2}
  ]
}
```

**Response**: OrderDetailResponse with updated data

---

### 5. PATCH /api/v1/orders/{id}/status
**Auth**: Admin & Employee  
**Description**: Update order status with validation

**Valid Transitions**:
- `pending` → `ongoing`, `cancelled`
- `ongoing` → `completed`, `cancelled`
- `completed` → (none - terminal state)
- `cancelled` → (none - terminal state)

**Features**:
- Enforces state machine transitions
- Automatically sets `completed_at` when status becomes `completed`
- Logs all changes to `order_status_logs` with user and timestamp
- Supports optional remarks for audit trail

**Request Body**:
```json
{
  "status": "ongoing",
  "remarks": "Started processing order"
}
```

**Response**: OrderResponse

---

### 6. DELETE /api/v1/orders/{id}
**Auth**: Admin only  
**Description**: Delete an order (pending orders only)

**Features**:
- Only allows deletion of orders with `pending` status
- Automatically restocks all products from order items
- Cascade deletes order items and status logs
- Transaction-safe

**Response**: 204 No Content

---

## Data Models

### OrderResponse
```python
{
  "id": 1,
  "order_number": "ORD-2026-0001",
  "dealer_id": 1,
  "dealer_name": "ABC Medical Supplies",
  "created_by_id": 1,
  "created_by_name": "Admin User",
  "assigned_to_id": 2,
  "assigned_to_name": "John Doe",
  "status": "ongoing",
  "order_date": "2026-06-29T10:00:00Z",
  "expected_delivery_date": "2026-07-15T10:00:00Z",
  "completed_at": null,
  "total_amount": "15000.00",
  "notes": "Urgent order",
  "created_at": "2026-06-29T10:05:00Z",
  "updated_at": "2026-06-29T10:05:00Z"
}
```

### OrderDetailResponse (extends OrderResponse)
```python
{
  ...OrderResponse fields...,
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Ultrasound Machine",
      "product_sku": "USM-001",
      "quantity": 2,
      "unit_price": "5000.00",
      "subtotal": "10000.00"
    }
  ],
  "status_logs": [
    {
      "id": 1,
      "old_status": "pending",
      "new_status": "ongoing",
      "changed_by_id": 2,
      "changed_by_name": "John Doe",
      "remarks": "Started processing",
      "created_at": "2026-06-29T11:00:00Z"
    }
  ]
}
```

---

## Transaction Safety

All operations are designed for transaction safety:

1. **Order Creation**: 
   - Validates all products and stock BEFORE any database writes
   - Creates order + items + deducts stock in single transaction
   - Rolls back completely on any failure

2. **Order Update**:
   - Restores old stock → validates new stock → creates new items → deducts new stock
   - All in single transaction

3. **Status Updates**:
   - Validates transition → updates status → creates log entry
   - Atomic operation

4. **Order Deletion**:
   - Validates status → restocks all items → deletes order
   - Cascade handles items and logs

---

## Error Handling

### Insufficient Stock (400)
```json
{
  "detail": {
    "error": "insufficient_stock",
    "message": "Insufficient stock for one or more products.",
    "products": [
      {
        "product_id": 1,
        "product_name": "Ultrasound Machine",
        "requested": 10,
        "available": 5
      }
    ]
  }
}
```

### Invalid Status Transition (400)
```json
{
  "detail": {
    "error": "invalid_status_transition",
    "message": "Cannot transition from 'completed' to 'pending'. Allowed transitions: none (terminal state)."
  }
}
```

### Cannot Delete Non-Pending Order (400)
```json
{
  "detail": {
    "error": "cannot_delete_order",
    "message": "Only orders with 'pending' status can be deleted. Current status: 'ongoing'."
  }
}
```

---

## Implementation Files

1. **backend/app/schemas/order.py** - Pydantic schemas
2. **backend/app/services/order_service.py** - Business logic
3. **backend/app/api/v1/endpoints/orders.py** - FastAPI routes
4. **backend/app/api/v1/router.py** - Router registration

All files integrate seamlessly with existing authentication, authorization, and database infrastructure.
