# Quick Fix: "Failed to load data" Error

## The Problem
You're seeing "Failed to load employees. Please try again." on the `/employees` page.

## Quick Fix (Try This First!) 🚀

### Option 1: Logout and Login Again
**This fixes 90% of cases!**

1. Click your avatar/name in top-right corner
2. Click "Logout"
3. Login again with:
   - Email: `admin@oms.local`
   - Password: `Admin@1234`
4. Go to Employees page again

**Why this works**: Your access token likely expired (30 min lifespan).

---

### Option 2: Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cookies and other site data"
3. Click "Clear data"
4. Reload page and login again

---

### Option 3: Check You're Admin
The `/employees` page requires admin role.

1. Check the badge under your name in the top-right dropdown
2. Should say "admin" (not "employee")
3. If it says "employee":
   - Logout
   - Login with admin credentials above

---

## Still Not Working? Check These:

### Is Backend Running?
Open: http://localhost:8000/health

Should see: `{"status":"ok"}`

If not, start backend:
```cmd
cd c:\Users\Admin\Desktop\order_management_system\backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Check Browser Console
1. Press F12 (opens DevTools)
2. Click "Console" tab
3. Look for red error messages
4. Common errors:
   - **401 Unauthorized** → Logout and login again
   - **403 Forbidden** → You're not admin
   - **Network Error** → Backend not running
   - **500 Error** → Backend crashed, check backend terminal

### Check Network Tab
1. Press F12 (opens DevTools)
2. Click "Network" tab
3. Reload the page
4. Find request to "employees" in the list
5. Click on it
6. Check "Response" tab

Common issues:
- **Status: 401** → Token expired
- **Status: 403** → Not admin
- **Status: (failed)** → Backend not running
- **Status: 500** → Backend error

---

## If Error Persists

### Check Backend Logs
Look at your backend terminal for errors like:
- Database connection errors
- Python exceptions
- Permission errors

### Create Employees Data
Maybe no employees exist in database:

```cmd
cd backend
.venv\Scripts\activate
python -m app.scripts.seed_demo_data
```

This creates 4 employees.

### Test API Directly
Open: http://localhost:8000/api/v1/docs

1. Click "Authorize" (lock icon top-right)
2. Login with admin credentials
3. Find "GET /api/v1/employees"
4. Click "Try it out"
5. Click "Execute"
6. Check response

Should return list of employees.

---

## Step-by-Step Visual Guide

### 1. Open User Dropdown
```
┌─────────────────────────────────┐
│ [☰] Employees         [☀] [AV]▼│  ← Click avatar
└─────────────────────────────────┘
            ↓
    ┌──────────────────┐
    │ Admin User       │
    │ admin@oms.local  │
    │ [admin] ← Check  │
    ├──────────────────┤
    │ Profile          │
    ├──────────────────┤
    │ Logout           │ ← Click here
    └──────────────────┘
```

### 2. Login Page
```
┌─────────────────────────────────┐
│         Sign in                 │
│                                 │
│ Email                           │
│ [admin@oms.local____________]   │
│                                 │
│ Password                        │
│ [Admin@1234_________________]   │
│                                 │
│         [Sign in]               │
└─────────────────────────────────┘
```

### 3. Check Role Badge
After login, click avatar again and verify badge says "admin"

---

## What Each Error Means

### "Could not load employees. Please try again."
Generic error. Check console for details.

### 401 Unauthorized
Your login session expired (tokens last 30 minutes).
**Fix**: Logout and login again.

### 403 Forbidden  
You don't have permission (not admin).
**Fix**: Login as admin.

### Network Error / Failed to fetch
Backend server not responding.
**Fix**: Start backend server.

### 500 Internal Server Error
Backend crashed.
**Fix**: Check backend terminal for error details.

---

## Prevention Tips

To avoid this in future:

1. **Keep backend running** - Don't close backend terminal
2. **Refresh token** - App auto-refreshes, but logout/login if issues
3. **Use admin account** - For managing employees
4. **Check backend logs** - Terminal shows useful errors

---

## Quick Test Checklist

- [ ] Backend shows "Application startup complete" in terminal
- [ ] http://localhost:8000/health returns {"status":"ok"}
- [ ] Frontend shows login page at http://localhost:3000
- [ ] Can login with admin@oms.local / Admin@1234
- [ ] User dropdown shows "admin" badge
- [ ] No red errors in browser console (F12)
- [ ] Network tab shows 200 OK responses

If all checks pass, the page should load!

---

**Most Common Solution**: Logout and login again! 🎯
