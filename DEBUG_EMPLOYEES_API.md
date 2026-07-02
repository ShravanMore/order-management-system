# Debug: Employees API Issue

## Problem
Getting error on `/employees` page: "Could not load employees. Please try again."

## Diagnostic Steps

### Step 1: Check Backend is Running
```bash
curl http://localhost:8000/health
```
**Expected**: `{"status":"ok"}`

### Step 2: Check if You're Logged In
1. Open browser DevTools (F12)
2. Go to Application tab → Cookies
3. Check if `access_token` cookie exists
4. If missing or expired, logout and login again

### Step 3: Test Employees API Directly

#### Using Swagger UI:
1. Go to http://localhost:8000/api/v1/docs
2. Click "Authorize" button (lock icon)
3. Login with admin credentials
4. Try endpoint: `GET /api/v1/employees`
5. Check response

#### Using curl (Windows PowerShell):
```powershell
# First login to get token
$loginBody = @{
    email = "admin@oms.local"
    password = "Admin@1234"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = ($response.Content | ConvertFrom-Json).access_token

# Then test employees endpoint
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/employees?page=1&page_size=50" `
    -Headers $headers | Select-Object StatusCode, Content
```

**Expected**: Status 200 with JSON response containing employees list

### Step 4: Check Database Has Employees

```bash
cd backend

# Activate virtual environment
.venv\Scripts\activate

# Run seed script
python -m app.scripts.seed_demo_data
```

This creates 4 demo employees.

### Step 5: Check Browser Console for Errors

1. Open the `/employees` page
2. Open DevTools (F12) → Console tab
3. Look for error messages
4. Look for network request to `/api/v1/employees`

Common errors:
- **401 Unauthorized** → Token expired, logout and login again
- **403 Forbidden** → You're logged in as employee (only admin can access)
- **404 Not Found** → Backend route not registered
- **500 Internal Server Error** → Backend error, check backend terminal
- **Network Error** → Backend not running

### Step 6: Check Network Tab

1. Open DevTools (F12) → Network tab
2. Reload `/employees` page
3. Find request to `/api/v1/employees`
4. Check:
   - Request URL
   - Request Headers (Authorization header present?)
   - Response Status
   - Response Body

## Common Fixes

### Fix 1: Token Expired
1. Click user dropdown in top-right
2. Click "Logout"
3. Login again with admin@oms.local / Admin@1234

### Fix 2: Wrong Role
- Employees page requires admin role
- If logged in as employee, you'll get 403 error
- Logout and login as admin

### Fix 3: Backend Not Running
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Fix 4: No Employees in Database
```bash
cd backend
.venv\Scripts\activate
python -m app.scripts.seed_demo_data
```

### Fix 5: CORS Issue
Check backend terminal for CORS errors. If you see them:
1. Check `backend/app/core/config.py`
2. Ensure `CORS_ORIGINS` includes `http://localhost:3000`

### Fix 6: API Route Not Found
Check backend file: `backend/app/api/v1/router.py`

Should include:
```python
from app.api.v1.endpoints import employees

api_router.include_router(employees.router)
```

## Quick Test Script

Create a file `test_employees_api.py` in backend directory:

```python
import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User, UserRole

async def test():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.role == UserRole.employee)
        )
        employees = result.scalars().all()
        print(f"Found {len(employees)} employees:")
        for emp in employees:
            print(f"  - {emp.full_name} ({emp.email}) - Active: {emp.is_active}")

asyncio.run(test())
```

Run it:
```bash
cd backend
.venv\Scripts\activate
python test_employees_api.py
```

## Expected Behavior

When working correctly:
1. Navigate to http://localhost:3000/employees (as admin)
2. Should see loading state briefly
3. Should see data table with employees:
   - Sarah Johnson
   - Michael Chen
   - Emily Rodriguez
   - David Kumar
4. Can search, paginate, edit, deactivate

## Error Messages Reference

| Error | Cause | Fix |
|-------|-------|-----|
| "Could not load employees" | Generic API error | Check console/network tab |
| 401 Unauthorized | Token expired/invalid | Logout and login again |
| 403 Forbidden | Not admin role | Login as admin |
| 404 Not Found | API route missing | Check backend router |
| 500 Server Error | Backend crash | Check backend terminal |
| Network Error | Backend not running | Start backend server |
| CORS Error | Origin not allowed | Update CORS_ORIGINS |

## What to Check in Browser Console

Look for these logs (I added them in the fix):
- "Loaded employees: 4 [...]" ← Success!
- "Failed to load employees: ..." ← Error details

If you see React Query error, it will show the axios error details.

## What to Report

If still not working, provide:
1. **Browser console errors** (F12 → Console)
2. **Network tab details** (F12 → Network → employees request)
3. **Backend terminal output** (any errors?)
4. **Which user you're logged in as** (admin or employee?)
5. **Full error message** from toast notification

---

**Most Likely Cause**: Token expired. Try logout and login again!
