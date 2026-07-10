# 🚀 Deploy to Render + Neon (100% FREE)

## ✅ Why This Setup?

- ✅ **Completely FREE** (no credit card for Neon free tier)
- ✅ **PostgreSQL** (your app already uses this)
- ✅ **Easy setup** (~20-30 minutes)
- ✅ **No trial period** - free forever
- ✅ **HTTPS included** - PWA will work
- ✅ **Auto-deploy** on git push

---

## 📦 What You'll Get

- **Frontend:** https://your-app.onrender.com (static site)
- **Backend:** https://your-api.onrender.com (web service)
- **Database:** Neon PostgreSQL (serverless, free tier)
- **SSL/HTTPS:** Automatic (for PWA)

---

## Step 1: Create Neon Database (5 minutes)

### 1.1 Sign Up

1. Go to https://neon.tech
2. Sign up with GitHub (or email)
3. **No credit card required!**

### 1.2 Create Project

1. Click "Create Project"
2. Project name: `sadguru-oms`
3. PostgreSQL version: 15 (default)
4. Region: Choose closest to you
5. Click "Create Project"

### 1.3 Get Connection String

1. After project creation, you'll see connection details
2. Copy the **Connection string** (looks like this):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. **IMPORTANT:** Change `postgresql://` to `postgresql+asyncpg://`
4. Save this - you'll need it for Render!

**Example:**
```
Before: postgresql://user:pass@host.neon.tech/db?sslmode=require
After:  postgresql+asyncpg://user:pass@host.neon.tech/db?sslmode=require
```

---

## Step 2: Push Code to GitHub (5 minutes)

Your code needs to be on GitHub for Render to deploy it.

### 2.1 Create GitHub Repository

1. Go to https://github.com
2. Click "New repository"
3. Name: `sadguru-oms`
4. Visibility: Private (recommended) or Public
5. Click "Create repository"

### 2.2 Push Your Code

```bash
cd C:\Users\Admin\Desktop\order_management_system

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/sadguru-oms.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend to Render (10 minutes)

### 3.1 Sign Up for Render

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 3.2 Create Web Service (Backend)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `sadguru-oms` repository
4. Configure:

**Build & Deploy Settings:**
```
Name: sadguru-oms-backend
Region: Choose closest to you
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

5. Click "Advanced" to add environment variables

### 3.3 Add Environment Variables

Click "Add Environment Variable" for each:

```env
DATABASE_URL
(paste your Neon connection string here - the one starting with postgresql+asyncpg://)

JWT_SECRET_KEY
(generate a random string - see below)

JWT_ALGORITHM
HS256

ACCESS_TOKEN_EXPIRE_MINUTES
30

REFRESH_TOKEN_EXPIRE_DAYS
7

CORS_ORIGINS
["https://sadguru-oms-frontend.onrender.com"]
(we'll update this after frontend is deployed)

ADMIN_EMAIL
admin@yourcompany.com

ADMIN_PASSWORD
YourSecurePassword123

ADMIN_FULL_NAME
Administrator
```

**Generate JWT Secret:**
Open PowerShell and run:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

6. Click "Create Web Service"
7. Wait 3-5 minutes for deployment
8. Once deployed, copy your backend URL (e.g., `https://sadguru-oms-backend.onrender.com`)

### 3.4 Run Database Migrations

Once backend is deployed:

1. Go to your backend service in Render
2. Click "Shell" tab (top right)
3. Run these commands:

```bash
# Run migrations
alembic upgrade head

# Create admin user
python -m app.scripts.seed_admin

# Optional: Add demo data
python -m app.scripts.seed_demo_data
```

---

## Step 4: Deploy Frontend to Render (10 minutes)

### 4.1 Create Static Site

1. In Render dashboard, click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:

**Build & Deploy Settings:**
```
Name: sadguru-oms-frontend
Region: Same as backend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build -- --webpack
Publish Directory: .next
```

### 4.2 Add Environment Variable

Click "Advanced" → "Add Environment Variable":

```env
NEXT_PUBLIC_API_URL
https://your-backend-url.onrender.com/api/v1
(replace with your actual backend URL from Step 3)
```

4. Click "Create Static Site"
5. Wait 5-10 minutes for build & deployment
6. Once deployed, copy your frontend URL

### 4.3 Update Backend CORS

1. Go back to backend service in Render
2. Go to "Environment" tab
3. Edit `CORS_ORIGINS` variable:
   ```
   ["https://your-frontend-url.onrender.com"]
   ```
4. Save changes (backend will auto-redeploy)

---

## Step 5: Test Your Deployment (5 minutes)

### 5.1 Test Backend

1. Visit: `https://your-backend.onrender.com/health`
2. Should see: `{"status": "ok"}`
3. Visit: `https://your-backend.onrender.com/api/v1/docs`
4. Should see Swagger API documentation

### 5.2 Test Frontend

1. Visit: `https://your-frontend.onrender.com`
2. Should see login page
3. Login with:
   - Email: (your ADMIN_EMAIL from env variables)
   - Password: (your ADMIN_PASSWORD from env variables)
4. Should see dashboard!

### 5.3 Test PWA Installation

**On Mobile:**
1. Open app in Chrome
2. Wait for "Add to Home Screen" prompt
3. Tap "Install"
4. Check home screen for app icon

**On Desktop:**
1. Open app in Chrome
2. Look for install icon in address bar
3. Click "Install"

---

## 🎉 You're Live!

Your app is now deployed and accessible worldwide!

**Share these URLs:**
- Frontend: `https://your-app.onrender.com`
- Backend API: `https://your-api.onrender.com`
- API Docs: `https://your-api.onrender.com/api/v1/docs`

---

## ⚠️ Important Notes

### Free Tier Limitations

**Neon (Database):**
- ✅ 0.5 GB storage (plenty for your app)
- ✅ Unlimited queries
- ✅ Auto-suspend after 5 minutes of inactivity
- ✅ Auto-wake on first query (may take 1-2 seconds)

**Render Web Service (Backend):**
- ✅ 750 hours/month (more than enough)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after sleep takes ~30 seconds
- ✅ Stays awake during active use

**Render Static Site (Frontend):**
- ✅ Unlimited bandwidth
- ✅ Global CDN
- ✅ Always fast, no spin-down

### Keep Backend Awake (Optional)

To prevent backend from sleeping:

**Option 1: Use UptimeRobot (Free)**
1. Sign up at https://uptimerobot.com
2. Add monitor for your backend health endpoint
3. Check every 5 minutes
4. Keeps backend awake 24/7

**Option 2: Upgrade to Paid**
- Render Starter: $7/month (no sleep)
- Neon Pro: $19/month (better performance)

---

## 🔄 Auto-Deploy Updates

Any changes you push to GitHub will auto-deploy:

```bash
# Make changes to your code
git add .
git commit -m "Updated feature X"
git push

# Render automatically detects and deploys!
```

---

## 🆘 Troubleshooting

### Issue: Backend returns 500 error

**Check:**
1. Environment variables set correctly?
2. DATABASE_URL starts with `postgresql+asyncpg://`?
3. Migrations ran? (check Shell tab)

**Fix:**
```bash
# In Render Shell:
alembic upgrade head
```

### Issue: Frontend can't connect to backend

**Check:**
1. `NEXT_PUBLIC_API_URL` set correctly?
2. Backend CORS includes frontend URL?
3. Backend is awake? (visit `/health` endpoint)

### Issue: Can't login

**Check:**
1. Admin user created? (run `seed_admin` script)
2. Correct credentials?
3. JWT_SECRET_KEY set?

### Issue: Database connection failed

**Check:**
1. Neon database still active?
2. Connection string correct?
3. Contains `?sslmode=require` at end?

---

## 💰 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Neon Database | 0.5GB storage | FREE |
| Render Backend | 750 hrs/month | FREE |
| Render Frontend | Unlimited | FREE |
| **TOTAL** | | **$0/month** |

### When to Upgrade?

Upgrade when you need:
- Backend always awake (Render: $7/month)
- More database storage (Neon: $19/month)
- More traffic (automatic scaling)

**For now:** FREE tier is perfect for getting started! 🎉

---

## 📊 Expected Performance

**Free Tier:**
- Frontend: ⚡ Fast (CDN-cached)
- Backend (awake): ⚡ Fast (~100-200ms)
- Backend (sleeping): 🐌 Slow first request (~30s wake-up)
- Database: ⚡ Fast (serverless)

**User Experience:**
- ✅ Employees using app actively: Fast & smooth
- ⚠️ First visitor after 15 mins: 30 second wait
- ✅ PWA (installed): Feels like native app

---

## 🎯 Success Checklist

- [ ] Neon database created
- [ ] Connection string saved
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] Environment variables set
- [ ] Migrations ran successfully
- [ ] Admin user created
- [ ] Frontend deployed to Render
- [ ] CORS updated
- [ ] Login works
- [ ] Dashboard loads
- [ ] Orders can be created
- [ ] PWA installs on mobile

---

## 🚀 Next Steps

1. **Test thoroughly** - Create orders, add employees
2. **Share with team** - Send them the URL
3. **Set up UptimeRobot** - Keep backend awake
4. **Monitor usage** - Check Render dashboard
5. **Upgrade if needed** - When you outgrow free tier

---

**You're now live on the internet! 🌍**

Your Order Management System is deployed, accessible, and ready for real-world use!

Need help? Check the troubleshooting section or review the deployment steps.
