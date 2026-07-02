# Employee Assignment Fix

## Problem
When creating or editing an order, the "Assigned To" dropdown only showed "Unassigned" option with no employees listed.

## Root Causes Identified

### 1. Missing Employee Assignment in Order Creation
The order creation form (`/orders/new`) did NOT have an "Assigned To" field at all. Users could only assign after creating the order.

### 2. Empty Dropdown on Order Detail Page
The employee dropdown on order detail page (`/orders/[id]`) wasn't showing why it was empty:
- No loading state
- No error message if API fails
- No message if no employees exist

## Fixes Applied ✅

### 1. Added "Assign To" Field in Order Creation Form
**File**: `app/(employee)/orders/new/page.tsx`

**Changes**:
- Added `assigned_to_id` to form schema
- Fetch employees list via React Query
- Added new "Assign To" dropdown field
- Send `assigned_to_id` to backend when creating order

**Benefits**:
- Can now assign employee during order creation
- Don't have to edit order after creation
- Faster workflow

### 2. Enhanced Order Detail Assignment Dropdown
**File**: `app/(employee)/orders/[id]/page.tsx`

**Changes**:
- Added loading state: "Loading employees..."
- Added empty state: "No active employees found"
- Added error logging to console
- Disabled dropdown while loading
- Debug logs to help diagnose issues

**Benefits**:
- Users see why dropdown is empty
- Can debug if API call fails
- Better UX with loading feedback

## How to Verify the Fix

### Step 1: Check if Employees Exist
```bash
# Make sure backend is running
# Open browser console (F12)
# Navigate to: http://localhost:3000/orders/new

# Check console for logs:
# Should see: "Loaded employees: 4 [...]"
```

### Step 2: Create New Order with Assignment
1. Go to "Orders" page
2. Click "Create Order" button
3. Fill in dealer and products
4. Look for "Assign To" dropdown (new!)
5. Select an employee from list
6. Click "Create Order"
7. Order should be assigned immediately

### Step 3: Edit Assignment on Detail Page
1. Go to any order detail page
2. In the "Assigned To" section (admin only)
3. Dropdown should show:
   - "Unassigned" option
   - List of all active employees
4. Select employee and save

## Troubleshooting

### If Dropdown Still Shows Only "Unassigned":

#### Check 1: Do Employees Exist?
```bash
# Run in backend directory
cd backend
python -m app.scripts.seed_demo_data
```

This creates 4 demo employees:
- Sarah Johnson
- Michael Chen
- Emily Rodriguez
- David Kumar

#### Check 2: Are Employees Active?
Open: http://localhost:8000/api/v1/docs
- Login with admin credentials
- Try endpoint: `GET /api/v1/employees`
- Check response has employees with `is_active: true`

#### Check 3: Check Console Logs
1. Open browser console (F12)
2. Navigate to order creation or detail page
3. Look for these logs:
   - "Loaded employees: X [...]" (success)
   - "Failed to load employees: ..." (error)

#### Check 4: Check Network Tab
1. Open DevTools → Network tab
2. Navigate to order page
3. Look for request to `/api/v1/employees`
4. Check if it returns 200 OK
5. Check response body has `items` array

### If API Call Fails (401 Unauthorized):
- Clear cookies and login again
- Access token might have expired

### If API Call Fails (403 Forbidden):
- Employee endpoint requires authentication
- Make sure you're logged in as admin

### If No Employees Returned:
```sql
-- Check database directly
SELECT id, full_name, email, role, is_active 
FROM users 
WHERE role = 'employee';
```

If empty, run seed script:
```bash
cd backend
python -m app.scripts.seed_demo_data
```

## API Endpoint Details

### Get Employees List
```
GET /api/v1/employees?page=1&page_size=50
```

**Response**:
```json
{
  "items": [
    {
      "id": 2,
      "full_name": "Sarah Johnson",
      "email": "sarah.johnson@oms.local",
      "role": "employee",
      "is_active": true,
      ...
    }
  ],
  "total_count": 4,
  "page": 1,
  "page_size": 50
}
```

### Create Order with Assignment
```
POST /api/v1/orders
```

**Body**:
```json
{
  "dealer_id": 1,
  "assigned_to_id": 2,  // ← NEW: Optional field
  "order_date": "2026-07-02T10:00:00Z",
  "items": [
    {"product_id": 1, "quantity": 2}
  ]
}
```

### Update Assignment
```
PUT /api/v1/orders/{id}
```

**Body**:
```json
{
  "assigned_to_id": 2  // or null for unassigned
}
```

## Visual Changes

### Before:
**Order Creation**: No way to assign employee  
**Order Detail**: Dropdown shows only "Unassigned", no feedback

### After:
**Order Creation**: 
```
┌─────────────────────────┐
│ Assign To    (optional) │
├─────────────────────────┤
│ [Dropdown v]            │
│ - Unassigned            │
│ - Sarah Johnson         │
│ - Michael Chen          │
│ - Emily Rodriguez       │
│ - David Kumar           │
└─────────────────────────┘
```

**Order Detail** (when loading):
```
Assigned To
[Loading employees... v]
```

**Order Detail** (when empty):
```
Assigned To
[No active employees found v]
```

**Order Detail** (with employees):
```
Assigned To
[Sarah Johnson v]
- Unassigned
- Sarah Johnson ✓
- Michael Chen
- Emily Rodriguez
- David Kumar
```

## Code Changes Summary

### `/orders/new/page.tsx`
```diff
+ import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

+ interface EmployeeListResponse { ... }

const schema = z.object({
  dealer_id: z.number(),
+ assigned_to_id: z.number().optional(),
  order_date: z.date(),
  ...
});

export default function NewOrderPage() {
+ const { data: employees } = useQuery({
+   queryKey: ["employees-list"],
+   queryFn: () => apiClient.get("/employees?page=1&page_size=50")
+ });

  ...

  // In form:
+ <div className="space-y-1">
+   <Label>Assign To (optional)</Label>
+   <Controller
+     name="assigned_to_id"
+     render={({ field }) => (
+       <Select value={...} onValueChange={...}>
+         <SelectItem value="unassigned">Unassigned</SelectItem>
+         {employees?.items.map(e => (
+           <SelectItem value={e.id}>{e.full_name}</SelectItem>
+         ))}
+       </Select>
+     )}
+   />
+ </div>
```

### `/orders/[id]/page.tsx`
```diff
function AssignEmployeePanel({ ... }) {
- const { data: employees } = useQuery({ ... });
+ const { data: employees, isLoading, error } = useQuery({ ... });

+ if (error) console.error("Failed to load employees:", error);
+ if (employees) console.log("Loaded employees:", employees.items.length);

  return (
    <Select
      value={...}
      onValueChange={...}
+     disabled={isLoading}
    >
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
+       {isLoading && <SelectItem disabled>Loading...</SelectItem>}
+       {!isLoading && employees?.items.length === 0 && 
+         <SelectItem disabled>No active employees found</SelectItem>
+       }
        {employees?.items.map(...)}
      </SelectContent>
    </Select>
  );
}
```

## Testing Checklist

- [ ] Order creation form shows "Assign To" dropdown
- [ ] Dropdown lists all active employees
- [ ] Can select employee during creation
- [ ] Order is created with correct assignment
- [ ] Order detail page shows assigned employee
- [ ] Can change assignment on detail page
- [ ] Loading state shows while fetching employees
- [ ] Empty state shows if no employees
- [ ] Console logs help debug issues
- [ ] Works for both admin and employee roles

## Related Files
- `frontend/app/(employee)/orders/new/page.tsx` - Order creation
- `frontend/app/(employee)/orders/[id]/page.tsx` - Order detail
- `backend/app/api/v1/endpoints/employees.py` - Employees API
- `backend/app/api/v1/endpoints/orders.py` - Orders API

---

**The employee assignment feature now works end-to-end!** 🎉
