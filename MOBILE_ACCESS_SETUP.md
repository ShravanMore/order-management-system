# Mobile Access Setup - Test on Mobile Devices

## Overview
Configuration to allow mobile devices and other computers on your local network to access the development server.

## What Was Changed

### File: `frontend/next.config.ts`

Added `allowedDevOrigins` to allow cross-origin requests from local network devices:

```typescript
experimental: {
  allowedDevOrigins: [
    '192.168.1.6',      // Your specific mobile IP
    '192.168.1.0/24',   // Allow entire local network subnet
  ],
}
```

## How to Access from Mobile

### 1. Restart the Frontend Dev Server

**IMPORTANT**: You must restart the server for config changes to take effect.

```cmd
cd c:\Users\Admin\Desktop\order_management_system\frontend
```

**Stop the current server:**
- Press `Ctrl+C` in the terminal running `npm run dev`

**Start it again:**
```cmd
npm run dev
```

### 2. Find Your Computer's IP Address

Your computer's IP: **192.168.1.4** (from the dev server output)

### 3. Access from Mobile

Open your mobile browser and navigate to:
```
http://192.168.1.4:3000
```

**Note**: Use your **computer's IP** (192.168.1.4), not your mobile's IP (192.168.1.6)

## Backend API Access

The mobile device also needs to access the backend API at:
```
http://192.168.1.4:8000
```

### Update Backend CORS

The backend needs to allow requests from your mobile's origin.

**File**: `backend/.env`

Ensure CORS settings allow your network:
```env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://192.168.1.4:3000
```

Or allow all local network origins (development only):
```env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://192.168.1.*:3000
```

### Check Backend CORS Configuration

**File**: `backend/app/main.py`

Should have CORS middleware configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Network Requirements

### Same Network
Both devices must be on the **same WiFi network**:
- ✅ Computer: Connected to WiFi (192.168.1.4)
- ✅ Mobile: Connected to same WiFi (192.168.1.6)

### Firewall
Windows Firewall may block incoming connections:

**Allow Node.js through firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Look for "Node.js" or add manually
4. Check both "Private" and "Public" networks

**Or temporarily disable firewall (not recommended):**
- Only for testing
- Re-enable after testing

## Troubleshooting

### Error: "Cross-origin request blocked"

**Solution**: Restart the dev server after config changes
```cmd
# Stop with Ctrl+C, then restart:
npm run dev
```

### Error: "Cannot connect" or "ERR_CONNECTION_REFUSED"

**Check 1: Server is running**
```cmd
# Should see:
- Local:        http://localhost:3000
- Network:      http://192.168.1.4:3000
```

**Check 2: Use correct IP**
- Use computer's IP: `192.168.1.4`
- NOT mobile's IP: `192.168.1.6`

**Check 3: Firewall**
- Allow Node.js in Windows Firewall
- Or temporarily disable firewall

**Check 4: Same network**
- Both devices on same WiFi
- Not using mobile data

### Error: "API calls fail" or "Network Error"

**Problem**: Backend CORS not allowing mobile origin

**Solution**: Update backend CORS

**File**: `backend/.env`
```env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://192.168.1.4:3000
```

**Restart backend:**
```cmd
cd backend
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Still not working?

**Check network:**
```cmd
# From mobile browser, try accessing:
http://192.168.1.4:3000

# Should see the login page
```

**Check backend:**
```cmd
# From mobile browser, try accessing:
http://192.168.1.4:8000/docs

# Should see API documentation
```

## Testing Responsive Design

### Recommended Browsers
- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)

### Screen Sizes to Test
- 📱 Mobile: 375px (iPhone SE)
- 📱 Mobile: 390px (iPhone 12/13/14)
- 📱 Mobile: 414px (iPhone Plus)
- 📱 Mobile: 360px (Android)
- 📱 Tablet: 768px (iPad)
- 📱 Tablet: 820px (iPad Air)

### Features to Test on Mobile

#### Mobile Card Views
- [ ] Orders list shows cards (not table)
- [ ] Products list shows cards
- [ ] Dealers list shows cards
- [ ] Employees list shows cards

#### Touch Interactions
- [ ] Tap to open order modal
- [ ] Swipe gestures work
- [ ] Buttons are tap-friendly (44x44px)
- [ ] No horizontal scrolling

#### Forms
- [ ] Input fields are accessible
- [ ] Dropdowns work with touch
- [ ] Date pickers work
- [ ] Forms submit correctly

#### Sidebar
- [ ] Hamburger menu opens/closes
- [ ] Sidebar overlays content
- [ ] Navigation works

## Alternative: Use Chrome DevTools

If mobile access doesn't work, use Chrome DevTools responsive mode:

1. Open Chrome
2. Press `F12` (DevTools)
3. Press `Ctrl+Shift+M` (Responsive mode)
4. Select device (iPhone, iPad, etc.)
5. Test all screen sizes

## Production Deployment

**Note**: The `allowedDevOrigins` setting is **only for development**.

In production:
- Remove or don't use `allowedDevOrigins`
- Use proper domain name (HTTPS)
- Configure CORS properly
- Use environment variables

## Summary

✅ Config updated to allow local network access
✅ Supports both specific IPs and subnet ranges
✅ Works with any device on same WiFi
✅ Restart dev server to apply changes

**Next Steps:**
1. Restart frontend dev server
2. Open `http://192.168.1.4:3000` on mobile
3. Test responsive layouts
4. Test touch interactions
