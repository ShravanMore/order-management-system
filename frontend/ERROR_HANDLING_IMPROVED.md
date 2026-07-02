# Improved Error Handling on Employees Page

## What Was Fixed

The employees page now shows **detailed error messages** instead of generic "Could not load employees" message.

## New Error Messages

### Before:
```
❌ Failed to load data
Could not load employees. Please try again.
```
No information about WHY it failed.

### After:
The error message now tells you exactly what's wrong:

#### 401 Unauthorized (Token Expired):
```
❌ Failed to load data
Failed to load employees: Please logout and login again (session expired)
```

#### 403 Forbidden (Not Admin):
```
❌ Failed to load data  
Failed to load employees: Access denied. Admin role required.
```

#### Network Error (Backend Down):
```
❌ Failed to load data
Failed to load employees: Network Error. Please try again.
```

#### Backend Error (500):
```
❌ Failed to load data
Failed to load employees: [Actual error message from backend]
```

## Additional Improvements

### 1. Console Logging
The page now logs detailed error information to browser console (F12):
- Full error object
- HTTP status code
- Response data from backend

### 2. Single Retry
- Only retries failed requests once (not 3 times)
- Faster error feedback
- Less console noise

## How to See Better Errors

### Step 1: Open Console
1. Press F12
2. Click "Console" tab
3. Reload the page

### Step 2: Check Logs
You'll see:
```
Employees API Error: [Error object]
Status: 401
Data: {detail: {error: "...", message: "..."}}
```

This tells you exactly what's wrong!

## Common Errors & Solutions

### "Please logout and login again (session expired)"
**Cause**: Access token expired (30 min lifespan)

**Solution**:
1. Click avatar in top-right
2. Click "Logout"  
3. Login again

### "Access denied. Admin role required."
**Cause**: Logged in as employee, not admin

**Solution**:
1. Logout
2. Login with: admin@oms.local / Admin@1234

### "Network Error"
**Cause**: Backend server not running

**Solution**:
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Other Errors
Check the console logs for detailed information, then see `DEBUG_EMPLOYEES_API.md` for troubleshooting.

## Testing the Fix

### Test 1: Token Expiry
1. Login normally
2. Wait 30+ minutes (or clear access_token cookie manually)
3. Go to /employees page
4. Should see: "Please logout and login again (session expired)"

### Test 2: Wrong Role
1. Login as employee (sarah.johnson@oms.local)
2. Try to access /employees
3. Should see: "Access denied. Admin role required."

### Test 3: Backend Down
1. Stop backend server (Ctrl+C)
2. Reload /employees page
3. Should see: "Network Error"

### Test 4: Console Logs
1. Open console (F12)
2. Trigger any error
3. Should see detailed error logs

## Files Changed

- `frontend/app/(admin)/employees/page.tsx`
  - Added `error` to query result
  - Added `retry: 1` option
  - Added detailed error logging
  - Added conditional error messages based on status code

---

**Now you'll always know WHY the page failed to load!** 🎯
