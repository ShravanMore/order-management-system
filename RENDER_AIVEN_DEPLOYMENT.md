# 🚀 Deploy to Render + Aiven PostgreSQL (100% FREE)

## ✅ Why This Setup?

- ✅ **Completely FREE** (no credit card needed)
- ✅ **PostgreSQL** (your app already uses this - no changes needed!)
- ✅ **1GB database storage** (better than Neon's 0.5GB)
- ✅ **Easy setup** (~25-30 minutes)
- ✅ **No trial period** - free forever
- ✅ **HTTPS included** - PWA will work
- ✅ **Matches your image exactly!**

---

## 📦 What You'll Get

- **Frontend:** https://your-app.onrender.com (static site)
- **Backend:** https://your-api.onrender.com (web service)  
- **Database:** Aiven PostgreSQL (1GB, free tier)
- **SSL/HTTPS:** Automatic (for PWA)

---

## Step 1: Create Aiven PostgreSQL Database (5 minutes)

### 1.1 Sign Up for Aiven

1. Go to https://aiven.io
2. Click "Start Free" or "Sign Up"
3. Sign up with GitHub or email
4. **No credit card required for free tier!**
5. Verify your email

### 1.2 Create PostgreSQL Service

1. After login, click "Create service"
2. Select **"PostgreSQL"** (not MySQL!)
3. Configure:
   - **Cloud:** Any (AWS, Google Cloud, Azure)
   - **Region:** Choose closest to you (e.g., US East, Europe, Asia)
   - **Plan:** Select **"Hobbyist"** or **"Free"** (1GB storage, FREE)
   - **Service name:** `sadguru-oms-db` (or any name you like)
4. Click "Create service"
5. Wait 2-3 minutes for database to start

### 1.3 Get Connection Details

1. Once service is running (green status), click on it
2. Go to "Overview" tab
3. Scroll down to **"Connection information"**
4. You'll see:
   - Host
   - Port
   - User
   - Password
   - Database name
   - SSL Mode

5. **Build your connection string:**
   ```
   postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE?ssl=require
   ```

**Example:**
```
postgresql+asyncpg://avnadmin:xyz123password@pg-abc-def.aivencloud.com:12345/defaultdb?ssl=require
```

**Important:** 
- Change `postgresql://` to `postgresql+asyncpg://`
- Add `?ssl=require` at the end (NOT `sslmode=require`)
- Save this connection string - you'll need it!

### 1.4 Allow Connections (Optional)

Aiven free tier allows all connections by default, but you can check:

1. Go to "Overview" tab
2. Scroll to "Allowed IP Addresses"
3. Should show "0.0.0.0/0" (all IPs allowed)
4. If not, add `0.0.0.0/0` to allow Render to connect

---

## Step 2: Push Code to GitHub (5 minutes)

Your code needs to be on GitHub for Render to deploy it.

### 2.1 Create GitHub Repository

1. Go to https://github.com
2. Click "New repository"
3. Name: `sadguru-oms`
4. Visibility: **Private** (recommended) or Public
5. **Don't** initialize with README (you already have code)
6. Click "Create repository"

### 2.2 Push Your Code

Open PowerShell and run:

```bash
cd C:\Users\Admin\Desktop\order_management_system

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment - Render + Aiven PostgreSQL"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sadguru-oms.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If it asks for credentials:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Get token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token

---

## Step 3: Deploy Backend to Render (10 minutes)

### 3.1 Sign Up for Render

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with **GitHub** (easiest)
4. Authorize Render to access your repositories

### 3.2 Create Web Service (Backend)

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Click "Connect" next to your GitHub account
3. Find and select `sadguru-oms` repository
4. Click "Connect"

5. **Configure Service:**

```
Name: sadguru-oms-backend
Region: Choose closest to you (e.g., Oregon, Frankfurt, Singapore)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

6. Click **"Advanced"** to add environment variables

### 3.3 Add Environment Variables

Click **"Add Environment Variable"** for each one:

```env
DATABASE_URL
(Paste your Aiven PostgreSQL connection string here)
Example: postgresql+asyncpg://avnadmin:pass@host.aivencloud.com:12345/db?ssl=require

JWT_SECRET_KEY
(Generate random secret - see below)

JWT_ALGORITHM
HS256

ACCESS_TOKEN_EXPIRE_MINUTES
30

REFRESH_TOKEN_EXPIRE_DAYS
7

CORS_ORIGINS
["https://sadguru-oms-frontend.onrender.com"]
(Update after frontend is deployed)

ADMIN_EMAIL
admin@yourcompany.com

ADMIN_PASSWORD
YourSecurePassword123!

ADMIN_FULL_NAME
System Administrator
```

**Generate JWT Secret Key:**

Open PowerShell and run:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copy the output and use it as `JWT_SECRET_KEY`.

7. Click **"Create Web Service"**
8. Wait 3-5 minutes for deployment
9. Once deployed (green status), **copy your backend URL**
   - Example: `https://sadguru-oms-backend.onrender.com`

### 3.4 Automatic Database Setup

**Good news!** Migrations and admin user creation happen **automatically** on deployment.

The app will:
1. ✅ Run all database migrations (`alembic upgrade head`)
2. ✅ Create the admin user (if not already exists)
3. ✅ Start the API server

**To verify it worked:**

1. Wait for deployment to finish (3-5 minutes)
2. Check the deployment logs:
   - In Render dashboard, go to your backend service
   - Click **"Logs"** tab
   - Look for these messages:
     ```
     Running database migrations...
     ✓ Database migrations completed successfully
     ✓ Admin user created — email=your-email@example.com
     Application startup complete
     ```

3. If you see errors in logs, they'll appear here too

**No Shell access needed!** Everything runs automatically.

### 3.5 Test Backend

1. Visit: `https://your-backend-url.onrender.com/health`
   - Should see: `{"status": "ok"}`

2. Visit: `https://your-backend-url.onrender.com/api/v1/docs`
   - Should see: Swagger API documentation

✅ If both work, backend is ready!

---

## Step 4: Deploy Frontend to Render (10 minutes)

### 4.1 Create Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Select same `sadguru-oms` repository
3. Click "Connect"

4. **Configure Site:**

```
Name: sadguru-oms-frontend
Region: Same as backend (for best performance)
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build -- --webpack
Publish Directory: .next
```

### 4.2 Add Environment Variable

Click **"Advanced"** → **"Add Environment Variable"**:

```env
NEXT_PUBLIC_API_URL
https://your-backend-url.onrender.com/api/v1
```

**Replace `your-backend-url` with actual URL from Step 3.4**

Example: `https://sadguru-oms-backend.onrender.com/api/v1`

5. Click **"Create Static Site"**
6. Wait 5-10 minutes for build
7. Once deployed, **copy your frontend URL**
   - Example: `https://sadguru-oms-frontend.onrender.com`

### 4.3 Update Backend CORS

Now update backend to allow frontend:

1. Go back to **backend service** in Render
2. Click **"Environment"** tab
3. Find `CORS_ORIGINS` variable
4. Click **"Edit"**
5. Change to:
   ```
   ["https://your-frontend-url.onrender.com"]
   ```
6. Click **"Save Changes"**
7. Backend will automatically redeploy (~2 minutes)

---

## Step 5: Test Your Live App! (5 minutes)

### 5.1 Test Login

1. Visit your frontend URL: `https://your-app.onrender.com`
2. You should see the login page
3. Login with:
   - **Email:** (ADMIN_EMAIL from your env variables)
   - **Password:** (ADMIN_PASSWORD from your env variables)
4. Should see the dashboard! 🎉

### 5.2 Test Features

Try these:
- ✅ View dashboard (charts, KPIs)
- ✅ Go to Orders page
- ✅ Create a new order
- ✅ View Products
- ✅ View Employees
- ✅ Check your Profile

### 5.3 Test PWA Installation

**On Android Phone:**
1. Open your app URL in Chrome
2. Wait for "Add to Home Screen" banner
3. Tap "Add" or "Install"
4. App icon appears on home screen
5. Tap icon - opens fullscreen!

**On iPhone:**
1. Open your app URL in Safari
2. Tap Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen

**On Desktop:**
1. Open your app in Chrome
2. Look for install icon (⊕) in address bar
3. Click "Install"
4. App opens in its own window

---

## 🎉 Congratulations! You're Live!

Your app is now deployed and accessible worldwide!

**Your URLs:**
- 🌐 **App:** https://your-app.onrender.com
- 🔧 **API:** https://your-api.onrender.com
- 📚 **API Docs:** https://your-api.onrender.com/api/v1/docs

**Share with your team and start using it!**

---

## 📊 What You Have (All FREE)

| Component | Service | Storage/Limits | Cost |
|-----------|---------|----------------|------|
| Frontend | Render Static | Unlimited bandwidth | FREE |
| Backend | Render Web Service | 750 hrs/month | FREE |
| Database | Aiven PostgreSQL | 1GB storage | FREE |
| SSL/HTTPS | Automatic | Included | FREE |
| PWA | Enabled | Included | FREE |
| **TOTAL** | | | **$0/month** 🎉 |

---

## ⚠️ Free Tier Limitations (Good to Know)

### Aiven PostgreSQL (FREE):
- ✅ 1GB storage (good for ~10,000+ orders)
- ✅ 5 concurrent connections
- ✅ Daily backups (1 day retention)
- ⚠️ Smaller server resources (fine for small team)

### Render Backend (FREE):
- ✅ 750 hours/month (more than enough)
- ⚠️ **Spins down after 15 mins of inactivity**
- ⚠️ **First request after sleep: ~30 seconds**
- ✅ Fast once awake

### Render Frontend (FREE):
- ✅ Unlimited bandwidth
- ✅ Global CDN (super fast)
- ✅ Never sleeps
- ✅ Auto-scales

### How It Feels for Users:

**Active hours (9am-5pm):**
- ⚡ **Fast** - Backend stays awake
- ⚡ **Instant** - Frontend on CDN
- ⚡ **Smooth** - Database quick

**Overnight or weekends:**
- ⚡ Frontend still fast
- 🐌 First visitor waits ~30 seconds (backend wakes up)
- ⚡ After first visitor, fast again

---

## 🚀 Keep Backend Awake 24/7 (Optional)

### Free Solution: UptimeRobot

1. Sign up at https://uptimerobot.com (free)
2. Add new monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://your-backend.onrender.com/health`
   - **Interval:** Every 5 minutes
3. UptimeRobot pings your backend every 5 mins
4. Backend stays awake 24/7! ⚡

**Bonus:** You also get uptime monitoring and email alerts!

---

## 🔄 Auto-Deploy on Code Changes

Any changes you push to GitHub will auto-deploy:

```bash
# Make changes to your code
cd C:\Users\Admin\Desktop\order_management_system

# Add, commit, push
git add .
git commit -m "Added new feature"
git push

# Render automatically detects and deploys!
# Check deployment progress in Render dashboard
```

---

## 🆘 Troubleshooting

### Issue: "Can't connect to database"

**Check:**
1. Aiven database is running (check Aiven dashboard)
2. `DATABASE_URL` is correct
3. Uses `?ssl=require` at end (NOT `sslmode=require`)
4. Starts with `postgresql+asyncpg://` (not just `postgresql://`)

**Fix:**
```bash
# In Render Shell:
echo $DATABASE_URL
# Verify it looks correct
```

### Issue: "CORS error" in browser console

**Check:**
1. Backend `CORS_ORIGINS` includes exact frontend URL
2. No trailing slash in URL
3. Uses `https://` not `http://`

**Fix:**
Update `CORS_ORIGINS` in backend environment variables.

### Issue: Backend takes forever to respond

**Reason:** Backend sleeping (free tier limitation)

**Solutions:**
1. Set up UptimeRobot (free, keeps it awake)
2. Upgrade to Render Starter ($7/month, no sleep)
3. Accept 30s wait for first request after inactivity

### Issue: Can't login - "Invalid credentials"

**Check:**
1. Admin user created? (run `seed_admin` in Shell)
2. Using correct email/password from env variables
3. `JWT_SECRET_KEY` set correctly

**Fix:**
```bash
# In Render Shell:
python -m app.scripts.seed_admin
```

### Issue: Build failed on Render

**Check build logs:**
1. Go to service in Render
2. Click "Logs" tab
3. Look for error message

**Common fixes:**
- Dependencies missing: Check `requirements.txt` or `package.json`
- Wrong directory: Check "Root Directory" setting
- Wrong command: Check "Build Command" and "Start Command"

---

## 📈 Upgrade When Needed

### Current FREE Setup is Good For:
- ✅ Small team (5-10 users)
- ✅ Testing and development
- ✅ Low to medium traffic
- ✅ Getting started

### Upgrade When You Need:
- Backend always awake: **Render Starter $7/month**
- More database storage: **Aiven Startup $9/month**
- High traffic: **Auto-scales on paid plans**

**For now:** FREE tier is perfect! 🎉

---

## ✅ Deployment Checklist

- [ ] Aiven PostgreSQL created and running
- [ ] Connection string saved and formatted correctly
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] All environment variables set
- [ ] Database migrations ran successfully
- [ ] Admin user created
- [ ] Frontend deployed to Render
- [ ] Backend CORS updated with frontend URL
- [ ] Can login to app
- [ ] Dashboard loads
- [ ] Can create orders
- [ ] PWA installs on mobile
- [ ] (Optional) UptimeRobot set up

---

## 🎯 What's Next?

### Immediate:
1. ✅ Share URL with your team
2. ✅ Create real employees in the system
3. ✅ Set up employee salaries
4. ✅ Start creating real orders
5. ✅ Install PWA on phones

### This Week:
1. Set up UptimeRobot (keeps backend awake)
2. Test all features thoroughly
3. Train employees on how to use the app
4. Create dealer records
5. Add product catalog

### Next Month:
1. Monitor usage (check Aiven and Render dashboards)
2. Back up data (Aiven has daily backups)
3. Consider upgrading if you outgrow free tier
4. Collect user feedback
5. Plan new features

---

## 💡 Pro Tips

1. **Bookmark URLs:**
   - Your app URL
   - Render dashboard
   - Aiven dashboard
   - API documentation

2. **Monitor Services:**
   - Check Aiven dashboard weekly (database health)
   - Check Render dashboard (deployment status)
   - Set up UptimeRobot (free monitoring)

3. **Keep Credentials Safe:**
   - Save database connection string
   - Save admin password
   - Don't share environment variables
   - Use password manager

4. **Regular Maintenance:**
   - Check for updates (dependencies)
   - Review error logs
   - Monitor disk usage on Aiven
   - Test backups occasionally

---

## 🌟 Summary

**You now have:**
- ✅ Fully deployed Order Management System
- ✅ Accessible from anywhere with internet
- ✅ HTTPS enabled (secure)
- ✅ PWA installable on all devices
- ✅ 1GB PostgreSQL database
- ✅ Auto-deploy on git push
- ✅ All for FREE!

**Your team can:**
- 📱 Install app on their phones
- 📋 Manage orders on the go
- 👥 Track employee workload
- 💰 View salary & commission
- 📊 See real-time dashboard
- 🌙 Use dark mode

---

## 📞 Need Help?

**Resources:**
- Aiven Docs: https://docs.aiven.io
- Render Docs: https://render.com/docs
- Your API Docs: `https://your-api.onrender.com/api/v1/docs`

**Common Issues:**
- Check troubleshooting section above
- Review deployment steps
- Check service logs in Render
- Verify environment variables

---

**🎉 Congratulations! Your app is live on the internet!**

You're using the **exact setup from your image**:
- ✅ Frontend: Render Static Site
- ✅ Backend: Render Web Service  
- ✅ Database: Aiven **PostgreSQL** (not MySQL!)
- ✅ All FREE!

Start using your Order Management System today! 🚀
