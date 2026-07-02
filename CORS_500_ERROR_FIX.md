# Fix: CORS + 500 Internal Server Error

## The Problem

You're seeing two related errors:
1. **500 Internal Server Error** - Backend is crashing
2. **CORS Error** - Happens because the 500 error prevents CORS headers from being sent

```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/employees?page=1&page_size=10' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.

GET http://localhost:8000/api/v1/employees?page=1&page_size=10 net::ERR_FAILED 500 (Internal Server Error)
```

**Key Point**: The CORS error is a SYMPTOM. The real problem is the 500 error.

---

## Root Cause

The backend is crashing when trying to fetch employees. Most likely causes:
1. Database connection issue
2. Database migrations not run
3. Table doesn't exist
4. Python error in the code

---

## Solution: Fix Backend First

### Step 1: Check Backend Terminal

Look at your backend terminal window. You should see a Python error/traceback. Common errors:

#### Error 1: "relation does not exist" or "no such table"
```
sqlalchemy.exc.ProgrammingError: relation "users" does not exist
```

**Fix**: Run migrations
```bash
cd backend
.venv\Scripts\activate
alembic upgrade head
```

#### Error 2: "connection refused" or "could not connect"
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Fix**: Start PostgreSQL database

#### Error 3: "column does not exist"
```
sqlalchemy.exc.ProgrammingError: column users.some_field does not exist
```

**Fix**: Your database schema is out of sync
```bash
cd backend
.venv\Scripts\activate
alembic downgrade base
alembic upgrade head
python -m app.scripts.seed_admin
python -m app.scripts.seed_demo_data
```

### Step 2: Restart Backend

After fixing the issue:
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Step 3: Test Backend Directly

```bash
# Test health endpoint
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

### Step 4: Test in Browser

Go to: http://localhost:8000/api/v1/docs

Try the `/api/v1/employees` endpoint:
1. Click "Authorize"
2. Login with admin credentials
3. Try `GET /api/v1/employees`
4. Should return employee list (not 500 error)

---

## Quick Fixes to Try

### Fix 1: Restart Everything

```bash
# Stop both servers (Ctrl+C in each terminal)

# Backend
cd backend
.venv\Scripts\activate
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (in new terminal)
cd frontend
npm run dev
```

### Fix 2: Reset Database

**WARNING**: This deletes all data!

```bash
cd backend
.venv\Scripts\activate

# Drop and recreate
alembic downgrade base
alembic upgrade head

# Reseed data
python -m app.scripts.seed_admin
python -m app.scripts.seed_demo_data
```

### Fix 3: Check .env File

Make sure `backend/.env` exists with:
```
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/oms_db
JWT_SECRET_KEY=your-secret-key-here-min-32-chars-long
```

### Fix 4: Check Database is Running

```bash
# Check PostgreSQL is running
# Windows: Open Services, look for PostgreSQL

# Test connection
psql -U postgres -d oms_db -c "SELECT COUNT(*) FROM users WHERE role='employee';"
```

---

## Understanding the Error Flow

1. Frontend makes request: `GET /api/v1/employees`
2. Request reaches backend
3. Backend code tries to query database
4. **Something crashes** (database error, code error, etc.)
5. Backend returns **500 error** without CORS headers
6. Browser blocks response due to missing CORS headers
7. You see both: **CORS error** + **500 error**

**Fix the 500 error first**, then CORS will work automatically!

---

## Detailed Debugging Steps

### Step 1: Check Backend Logs

In your backend terminal, you should see the error. Look for:
- Traceback (most recent call last)
- sqlalchemy.exc errors (database issues)
- KeyError, AttributeError (code bugs)

### Step 2: Enable More Logging

Edit `backend/app/db/session.py`:
```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # ← Change False to True
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
```

This will show all SQL queries in the terminal.

### Step 3: Test Database Connection

Create `backend/test_db.py`:
```python
import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select, text

async def test():
    print("Testing database connection...")
    async with AsyncSessionLocal() as db:
        # Test 1: Basic query
        result = await db.execute(text("SELECT 1"))
        print("✓ Database connection works")
        
        # Test 2: Check users table exists
        result = await db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"✓ Users table exists with {count} users")
        
        # Test 3: Check employees specifically
        result = await db.execute(text("SELECT COUNT(*) FROM users WHERE role='employee'"))
        emp_count = result.scalar()
        print(f"✓ Found {emp_count} employees")

asyncio.run(test())
```

Run it:
```bash
cd backend
.venv\Scripts\activate
python test_db.py
```

### Step 4: Test Employees Endpoint Directly

Create `backend/test_employees_endpoint.py`:
```python
import asyncio
from app.db.session import AsyncSessionLocal
from app.services.employee_service import get_employees

async def test():
    print("Testing employees service...")
    async with AsyncSessionLocal() as db:
        items, total = await get_employees(db, page=1, page_size=10)
        print(f"✓ Service returned {total} employees")
        for emp in items:
            print(f"  - {emp.full_name} ({emp.email})")

asyncio.run(test())
```

Run it:
```bash
cd backend
.venv\Scripts\activate
python test_employees_endpoint.py
```

---

## If CORS Still Shows After Fixing 500

If you fixed the 500 but still see CORS errors:

### Check 1: CORS Origins Match

`backend/app/core/config.py`:
```python
CORS_ORIGINS: list[str] = ["http://localhost:3000"]
```

Frontend must be running at exactly: `http://localhost:3000`

Not:
- `http://127.0.0.1:3000` ❌
- `http://localhost:3001` ❌
- `https://localhost:3000` ❌

### Check 2: Restart Backend

CORS middleware is loaded at startup. Changes require restart:
```bash
# Stop (Ctrl+C)
# Start again
uvicorn app.main:app --reload
```

### Check 3: Add More Origins (if needed)

`backend/.env`:
```
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

---

## Success Checklist

✅ Backend terminal shows no errors  
✅ `curl http://localhost:8000/health` returns `{"status":"ok"}`  
✅ Can access http://localhost:8000/api/v1/docs  
✅ Can test `/api/v1/employees` in Swagger (returns 200, not 500)  
✅ Frontend at http://localhost:3000 loads without CORS errors  
✅ Employees page loads employee list  

---

## Common Backend Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "relation does not exist" | Missing database tables | `alembic upgrade head` |
| "could not connect" | PostgreSQL not running | Start PostgreSQL |
| "password authentication failed" | Wrong DB password | Check .env DATABASE_URL |
| "database does not exist" | Database not created | `createdb oms_db` |
| "column does not exist" | Schema mismatch | Reset DB with alembic |
| "ModuleNotFoundError" | Missing Python package | `pip install -r requirements.txt` |

---

## Prevention

To avoid this in future:

1. **Always check backend terminal** for errors
2. **Run migrations** after pulling code: `alembic upgrade head`
3. **Keep PostgreSQL running** 
4. **Don't edit .env** without restarting backend
5. **Check backend health** before debugging frontend: `curl http://localhost:8000/health`

---

**TL;DR**: The 500 error is the real problem. Check your backend terminal for the error message, fix it, restart backend, then CORS will work! 🎯
