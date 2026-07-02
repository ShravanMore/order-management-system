# Fix 500 Error - Quick Commands

## The Problem
Backend is returning 500 error, causing CORS to fail.

## Quick Fix (Run These Commands)

### Step 1: Open Backend Terminal
```cmd
cd c:\Users\Admin\Desktop\order_management_system\backend
.venv\Scripts\activate
```

### Step 2: Run Diagnostic
```cmd
python diagnose.py
```

This will tell you exactly what's wrong!

### Step 3: Based on Diagnostic Results

#### If "Users table does not exist":
```cmd
alembic upgrade head
python -m app.scripts.seed_admin
python -m app.scripts.seed_demo_data
```

#### If "No employees in database":
```cmd
python -m app.scripts.seed_demo_data
```

#### If "Database connection failed":
- Check PostgreSQL is running
- Check `.env` file has correct `DATABASE_URL`

### Step 4: Restart Backend
```cmd
uvicorn app.main:app --reload
```

### Step 5: Test
Open: http://localhost:8000/api/v1/docs
- Click "Authorize"
- Login with admin@oms.local / Admin@1234
- Try `GET /api/v1/employees`
- Should return 200 (not 500)

### Step 6: Test Frontend
Open: http://localhost:3000/employees
- Should load employee list
- No CORS errors

---

## What the Backend Terminal Should Show

### Good (Working):
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
INFO:     127.0.0.1:xxxxx - "GET /api/v1/employees?page=1&page_size=10 HTTP/1.1" 200 OK
```

### Bad (500 Error):
```
INFO:     127.0.0.1:xxxxx - "GET /api/v1/employees?page=1&page_size=10 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  ... [error details here] ...
```

**Look at the traceback!** It tells you exactly what's wrong.

---

## Most Likely Issues

### 1. Database Not Initialized
**Symptoms**: "relation does not exist", "no such table"

**Fix**:
```cmd
cd backend
.venv\Scripts\activate
alembic upgrade head
python -m app.scripts.seed_admin
python -m app.scripts.seed_demo_data
uvicorn app.main:app --reload
```

### 2. No Employees Data
**Symptoms**: Empty employee list or database query errors

**Fix**:
```cmd
cd backend
.venv\Scripts\activate
python -m app.scripts.seed_demo_data
```

### 3. PostgreSQL Not Running
**Symptoms**: "could not connect to server", "connection refused"

**Fix**: Start PostgreSQL service
- Windows: Services → PostgreSQL → Start
- Or check if port 5432 is in use: `netstat -an | find "5432"`

### 4. Wrong DATABASE_URL
**Symptoms**: "password authentication failed", "database does not exist"

**Fix**: Edit `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/oms_db
```

---

## Nuclear Option (Reset Everything)

If nothing works, reset the database:

```cmd
cd backend
.venv\Scripts\activate

# WARNING: This deletes all data!
alembic downgrade base
alembic upgrade head
python -m app.scripts.seed_admin
python -m app.scripts.seed_demo_data

uvicorn app.main:app --reload
```

---

## Verification Checklist

Run these commands to verify everything:

```cmd
# 1. Backend health
curl http://localhost:8000/health
# Should return: {"status":"ok"}

# 2. Run diagnostic
cd backend
.venv\Scripts\activate
python diagnose.py
# Should show all ✅ checks passed

# 3. Check frontend
# Open: http://localhost:3000/employees
# Should see employee list (no errors)
```

---

## Still Not Working?

1. **Check backend terminal** - Look for Python errors
2. **Run `python diagnose.py`** - Shows exactly what's wrong
3. **Check PostgreSQL logs** - Database-level issues
4. **Share the error** - Copy full error from backend terminal

---

**Start with `python diagnose.py` - it will tell you exactly what to fix!** 🎯
