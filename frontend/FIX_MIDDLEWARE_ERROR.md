# Fix Middleware Error - Step by Step

## The Problem
Next.js is looking for the old `proxy.ts` file because it was cached in the `.next` build folder.

## Solution Steps

### 1. Stop the Frontend Dev Server
In your terminal where `npm run dev` is running, press:
```
Ctrl + C
```

Wait for the server to fully stop.

### 2. Clear the Next.js Cache
Run this command:
```cmd
cd c:\Users\Admin\Desktop\order_management_system\frontend
rmdir /s /q .next
```

Or in PowerShell:
```powershell
cd c:\Users\Admin\Desktop\order_management_system\frontend
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

### 3. Verify middleware.ts Exists
Check that the file exists:
```cmd
dir middleware.ts
```

You should see the file listed.

### 4. Restart the Dev Server
```cmd
npm run dev
```

### 5. Verify It Works
- Open http://localhost:3000
- You should be redirected to /login
- After logging in, navigation should work properly

---

## If You Still Get Errors

### Check the middleware.ts file contains:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ... rest of the code
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
```

**Important:** The function MUST be named `middleware` (not `proxy`).

### Alternative: Clean Install
If cache issues persist:
```cmd
# Stop dev server (Ctrl+C)
cd c:\Users\Admin\Desktop\order_management_system\frontend

# Remove everything
rmdir /s /q .next
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install

# Start again
npm run dev
```

---

## Why This Happened

I renamed `proxy.ts` to `middleware.ts` while your dev server was running. Next.js:
1. Cached the old import path
2. Couldn't find `proxy.ts` anymore
3. Didn't detect the new `middleware.ts` because cache was stale

Stopping the server and clearing `.next` cache fixes this.
