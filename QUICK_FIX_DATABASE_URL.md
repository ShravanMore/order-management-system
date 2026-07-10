# 🔧 Quick Fix: Database Connection Error

## ❌ The Problem

Your deployment failed with this error:
```
TypeError: connect() got an unexpected keyword argument 'sslmode'
```

## ✅ The Solution

The issue is with the **DATABASE_URL format**. For `asyncpg` (async PostgreSQL driver), you need to use `ssl=require` instead of `sslmode=require`.

---

## 🛠️ What You Need to Do RIGHT NOW

### Step 1: Go to Render Backend Service

1. Open Render dashboard
2. Click on your **backend service** (`sadguru-oms-backend`)
3. Click **"Environment"** tab on the left

### Step 2: Fix DATABASE_URL

1. Find the **DATABASE_URL** variable
2. Click **"Edit"** (pencil icon)
3. **Change the end** of the URL:

**❌ WRONG (what you probably have):**
```
postgresql+asyncpg://avnadmin:password@host.aivencloud.com:12345/defaultdb?sslmode=require
```

**✅ CORRECT (what it should be):**
```
postgresql+asyncpg://avnadmin:password@host.aivencloud.com:12345/defaultdb?ssl=require
```

**The only change:** `sslmode=require` → `ssl=require`

4. Click **"Save Changes"**

### Step 3: Redeploy

After saving, Render will **automatically redeploy** your backend (~3-5 minutes)

**OR** manually trigger:
1. Click **"Manual Deploy"** button at top
2. Select **"Deploy latest commit"**
3. Click **"Deploy"**

### Step 4: Watch the Logs

1. Click **"Logs"** tab
2. Wait for deployment to complete
3. Look for these **SUCCESS** messages:

```
INFO: Running database migrations...
INFO: ✓ Database migrations completed successfully
INFO: ✓ Admin user created — email=your-email@example.com
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:10000
```

✅ If you see those, **you're good!**

---

## 🧪 Test After Fixing

### 1. Health Check

Visit: `https://sadguru-oms-backend.onrender.com/health`

**Expected:**
```json
{"status": "ok"}
```

### 2. API Docs

Visit: `https://sadguru-oms-backend.onrender.com/api/v1/docs`

You should see **Swagger UI** with all endpoints.

✅ **If both work, backend is fully deployed!**

---

## 📋 Correct DATABASE_URL Format Reference

For **Aiven PostgreSQL with asyncpg**, use this format:

```
postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE?ssl=require
```

### Breakdown:

| Part | Description | Example |
|------|-------------|---------|
| `postgresql+asyncpg://` | Driver (MUST be asyncpg) | Fixed value |
| `USER` | Database username | `avnadmin` |
| `PASSWORD` | Database password | From Aiven dashboard |
| `HOST` | Database host | `pg-abc-123.aivencloud.com` |
| `PORT` | Database port | `12345` |
| `DATABASE` | Database name | `defaultdb` |
| `?ssl=require` | SSL mode (REQUIRED for Aiven) | `?ssl=require` |

### ⚠️ Common Mistakes:

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `postgresql://` | `postgresql+asyncpg://` |
| `?sslmode=require` | `?ssl=require` |
| No SSL parameter | Must include `?ssl=require` |
| `sslmode=require` (no ?) | `?ssl=require` (with ?) |

---

## 🎯 Why This Happened

**Different drivers, different parameters:**

- **`psycopg2` (sync driver)**: Uses `?sslmode=require`
- **`asyncpg` (async driver)**: Uses `?ssl=require`

Your app uses **asyncpg** for async database operations, so it needs the `ssl=require` format.

---

## ✅ Checklist

- [ ] Updated DATABASE_URL to use `?ssl=require`
- [ ] Saved changes in Render
- [ ] Backend redeployed automatically
- [ ] Checked logs for success messages
- [ ] Tested `/health` endpoint (returns `{"status": "ok"}`)
- [ ] Tested `/api/v1/docs` (shows Swagger UI)
- [ ] Ready to deploy frontend!

---

## 🚀 Next Steps (After Backend Works)

Once backend is working:

1. ✅ **Deploy Frontend** (Step 4 in `RENDER_AIVEN_DEPLOYMENT.md`)
2. ✅ **Update CORS** with frontend URL
3. ✅ **Test login** on your app
4. ✅ **Install PWA** on your phone

---

## 🆘 Still Having Issues?

### Check These:

1. **Aiven database is running?**
   - Go to Aiven dashboard
   - Service should show **green status**

2. **Password contains special characters?**
   - If password has `@`, `#`, `&`, etc.
   - You need to **URL encode** them:
     - `@` → `%40`
     - `#` → `%23`
     - `&` → `%26`
     - etc.

3. **All parts of URL correct?**
   - Copy connection details from Aiven dashboard
   - Double-check host, port, database name

4. **SSL required?**
   - Aiven **always** requires SSL
   - Must have `?ssl=require` at the end

---

## 📞 Example Working DATABASE_URL

Here's what a **working** connection string looks like:

```
postgresql+asyncpg://avnadmin:AVNS_abc123xyz@pg-12abc-example-123.aivencloud.com:12345/defaultdb?ssl=require
```

Yours will be similar with your own:
- Username (usually `avnadmin`)
- Password (from Aiven)
- Host (`.aivencloud.com` domain)
- Port (5-digit number)
- Database (usually `defaultdb`)

---

**🎉 Once fixed, your backend will deploy successfully!**

The code changes have already been pushed to GitHub, so Render will auto-deploy once you fix the DATABASE_URL.
