# 🚀 Quick Deployment Guide

## ✅ Your App is Ready! Here's How to Deploy

---

## Option 1: Vercel + Railway (Easiest - Recommended)

### Step 1: Deploy Backend to Railway

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project → Deploy from GitHub**
   - Connect your GitHub account
   - Select your repository
   - Select `backend` folder

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will auto-set `DATABASE_URL`

4. **Set Environment Variables**
   - Go to Variables tab
   - Add these:
     ```
     JWT_SECRET_KEY=your_random_secret_here
     CORS_ORIGINS=["https://your-app.vercel.app"]
     ADMIN_EMAIL=admin@your-company.com
     ADMIN_PASSWORD=YourSecurePassword123
     ```

5. **Run Migrations**
   - Railway will auto-deploy
   - Once deployed, copy the backend URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Sign up at [vercel.com](https://vercel.com)**

2. **Import Git Repository**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build -- --webpack`
   - Output Directory: `.next`

4. **Set Environment Variable**
   - Add environment variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live! 🎉

### Step 3: Post-Deployment

1. **Run Migrations on Railway**
   - Go to Railway project
   - Open backend service
   - Run command: `alembic upgrade head`
   - Run command: `python -m app.scripts.seed_admin`

2. **Test Your App**
   - Visit your Vercel URL
   - Login with admin credentials
   - Create test order

**Total Time: ~15-20 minutes**

---

## Option 2: DigitalOcean App Platform

1. **Create App**
   - Sign up at DigitalOcean
   - Click "Create" → "Apps"

2. **Connect Repository**
   - Link GitHub
   - Select repository

3. **Configure Components**
   - Add Web Service (backend)
   - Add Static Site (frontend)
   - Add PostgreSQL Database

4. **Set Environment Variables**
   - Same as Railway above

5. **Deploy**
   - Click "Create Resources"

**Cost: ~$15-25/month**

---

## Option 3: AWS (Advanced)

### Backend (Elastic Beanstalk)
1. Create Elastic Beanstalk application
2. Choose Python platform
3. Upload backend code
4. Configure environment variables

### Frontend (Amplify or S3 + CloudFront)
1. Create Amplify app
2. Connect GitHub
3. Configure build settings
4. Deploy

### Database (RDS)
1. Create PostgreSQL RDS instance
2. Configure security groups
3. Update DATABASE_URL

**Cost: ~$30-50/month**  
**Time: ~2-4 hours**

---

## 🔐 Security Reminders

Before deploying, CHANGE these defaults:

```env
# Backend .env
JWT_SECRET_KEY=GENERATE_NEW_RANDOM_SECRET_HERE
ADMIN_PASSWORD=UseAStrongPasswordHere123!

# Generate JWT Secret:
# Windows PowerShell:
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## ✅ Post-Deployment Checklist

After deployment:

- [ ] App loads without errors
- [ ] Can login as admin
- [ ] Can create an order
- [ ] Mobile view works
- [ ] PWA installs correctly
- [ ] All features work

---

## 🆘 Common Issues

### Issue: CORS Error
**Fix:** Add your frontend URL to `CORS_ORIGINS` in backend

### Issue: Can't Login
**Fix:** Check `JWT_SECRET_KEY` is set correctly

### Issue: Database Error
**Fix:** Verify `DATABASE_URL` is correct and migrations ran

### Issue: PWA Not Installing
**Fix:** Ensure HTTPS is enabled (automatic on Vercel/Railway)

---

## 📱 Enable PWA

PWA works automatically once:
1. ✅ Deployed with HTTPS (Vercel/Railway do this)
2. ✅ Build includes service worker (done)
3. ✅ Manifest is accessible (done)

Users can now:
- **Android**: Tap "Add to Home Screen" prompt
- **iOS**: Safari → Share → "Add to Home Screen"
- **Desktop**: Click install icon in address bar

---

## 🎉 You're Done!

Your app is now live and accessible worldwide!

**Share your app:**
- Send URL to employees
- They can install as PWA on their phones
- Start managing orders!

Need help? Check `DEPLOYMENT_READINESS_REPORT.md` for detailed info.
