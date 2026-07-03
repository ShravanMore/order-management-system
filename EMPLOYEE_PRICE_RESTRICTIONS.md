# Employee Price Restrictions - Financial Information Hidden

## Overview
Implemented role-based access control to hide all financial information from employees. Only admins can see prices, amounts, and subtotals.

## Changes Made

### 1. Products Page
**File**: `frontend/app/(employee)/products/page.tsx`

**Desktop Table**:
- ❌ Employees: Price column removed
- ✅ Admins: Price column visible

**Mobile Cards**:
- ❌ Employees: Price not shown
- ✅ Admins: Price displayed below product name

**Before (Employee view)**:
```
Product Name    Category    Price     Stock
Widget X        Medical     ₹5,000    50 units
```

**After (Employee view)**:
```
Product Name    Category    Stock
Widget X        Medical     50 units
```

### 2. Orders List Page
**File**: `frontend/app/(employee)/orders/page.tsx`

**Desktop Table**:
- ❌ Employees: Amount column removed
- ✅ Admins: Amount column visible (right-aligned)

**Mobile Cards**:
- ❌ Employees: Amount not shown
- ✅ Admins: Amount displayed at bottom right

**Before (Employee view)**:
```
ORD-2026-0001    Dealer Name    15 Jun 2026    ₹125,000
```

**After (Employee view)**:
```
ORD-2026-0001    Dealer Name    15 Jun 2026
```

### 3. Order Detail Modal
**File**: `frontend/components/orders/order-detail-modal.tsx`

#### Details Tab:
- ❌ Employees: Total Amount field hidden
- ✅ Admins: Total Amount shown prominently

#### Products Tab:
**Table Columns**:
- ❌ Employees: Shows only Product Name, SKU, and Quantity
- ✅ Admins: Shows Product Name, SKU, Quantity, Unit Price, Subtotal, and Total

**Before (Employee view)**:
```
Product         Qty    Unit Price    Subtotal
Widget X        5      ₹5,000        ₹25,000
Widget Y        2      ₹10,000       ₹20,000
                              Total: ₹45,000
```

**After (Employee view)**:
```
Product         Qty
Widget X        5
Widget Y        2
```

#### Edit Mode (Admin only):
- Product list shows subtotals for admin
- Employees cannot access edit mode anyway

## Implementation Pattern

### Conditional Rendering:
```typescript
// Column definition
...(isAdmin
  ? [
      {
        key: "price",
        header: "Price",
        cell: (row: Product) => <span>{fmt(row.price)}</span>,
      } satisfies ColumnDef<Product>,
    ]
  : []),
```

### Mobile Cards:
```typescript
{isAdmin && (
  <p className="font-semibold">{fmt(product.price)}</p>
)}
```

## What Employees Can See

### Products:
- ✅ Product name and SKU
- ✅ Category
- ✅ Stock quantity and low stock warnings
- ✅ Active/Inactive status
- ❌ Prices (hidden)

### Orders List:
- ✅ Order number
- ✅ Dealer name
- ✅ Status badge
- ✅ Assigned employee
- ✅ Order date
- ❌ Total amount (hidden)

### Order Details:
- ✅ Order information (dealer, dates, notes)
- ✅ Product names and quantities
- ✅ Status history
- ✅ Assignment information
- ❌ Product prices (hidden)
- ❌ Subtotals (hidden)
- ❌ Total amount (hidden)

## What Admins Can See

Admins see **everything** including:
- ✅ All product prices
- ✅ Order amounts
- ✅ Product unit prices
- ✅ Line item subtotals
- ✅ Order totals
- ✅ Financial summaries

## Security Notes

### Frontend Only
- This is a **UI-level restriction** only
- Backend API still returns financial data
- Employees could theoretically see prices by inspecting network requests

### For Full Security (Future Enhancement):
Would need to:
1. Update backend schemas to conditionally exclude price fields for employees
2. Modify API endpoints to filter financial data based on user role
3. Create separate response schemas for admin vs employee

### Current Approach Benefits:
- ✅ Clean UI without distractions for employees
- ✅ Simple implementation
- ✅ Easy to maintain
- ✅ No backend changes required
- ✅ Consistent across all views

## Testing Checklist

### Test as Admin:
- [ ] Products page shows price column (desktop)
- [ ] Products mobile cards show prices
- [ ] Orders list shows amount column (desktop)
- [ ] Orders mobile cards show amounts
- [ ] Order detail modal shows total amount
- [ ] Order products tab shows unit prices and subtotals
- [ ] Order products tab shows total row

### Test as Employee:
- [ ] Products page: NO price column visible
- [ ] Products mobile cards: NO prices shown
- [ ] Orders list: NO amount column visible
- [ ] Orders mobile cards: NO amounts shown
- [ ] Order detail modal: NO total amount field
- [ ] Order products tab: ONLY names and quantities shown
- [ ] Order products tab: NO price/subtotal columns
- [ ] Order products tab: NO total row

### Test Responsiveness:
- [ ] Desktop table hides columns correctly
- [ ] Mobile cards hide prices correctly
- [ ] Tablet view (768px) transitions properly

## Files Modified
- ✅ `frontend/app/(employee)/products/page.tsx` - Hidden price column and mobile card prices
- ✅ `frontend/app/(employee)/orders/page.tsx` - Hidden amount column and mobile card amounts
- ✅ `frontend/components/orders/order-detail-modal.tsx` - Hidden all financial info in modal

## User Accounts for Testing
- **Admin**: admin@oms.local / Admin@1234
- **Employee**: sarah.johnson@oms.local / Employee@123
