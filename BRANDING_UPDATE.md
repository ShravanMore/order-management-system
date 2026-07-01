# Branding Update: OMS → Sadguru Electro Medical

## Changes Applied ✅

All references to "OMS" have been updated to "Sadguru Electro Medical" throughout the application.

### Frontend Files Updated:

#### 1. **Sidebar Logo** (`components/layout/sidebar.tsx`)
**Before:**
```tsx
<span className="text-lg font-bold tracking-tight">⚕ OMS</span>
```

**After:**
```tsx
<span className="text-sm font-bold tracking-tight">⚕ Sadguru Electro Medical</span>
```
Note: Changed to `text-sm` to fit better in the sidebar.

#### 2. **Page Title** (`app/layout.tsx`)
**Before:**
```tsx
title: "OMS - Order Management System"
description: "Physiotherapy Equipment Order Management System"
```

**After:**
```tsx
title: "Sadguru Electro Medical - Order Management System"
description: "Sadguru Electro Medical - Physiotherapy Equipment Order Management System"
```

#### 3. **Default Page Title** (`hooks/use-page-title.ts`)
**Before:**
```tsx
return "OMS";
```

**After:**
```tsx
return "Sadguru Electro Medical";
```

#### 4. **Login Page Description** (`app/(auth)/login/page.tsx`)
**Before:**
```tsx
Enter your credentials to access the Order Management System
```

**After:**
```tsx
Enter your credentials to access Sadguru Electro Medical Order Management System
```

#### 5. **Package Name** (`package.json`)
**Before:**
```json
"name": "oms-frontend"
```

**After:**
```json
"name": "sadguru-electro-medical-frontend"
```

---

## Where the Branding Appears:

### Visible to Users:
1. **Browser Tab** - Shows "Sadguru Electro Medical - Order Management System"
2. **Sidebar Logo** - Shows "⚕ Sadguru Electro Medical"
3. **Page Titles** - Defaults to "Sadguru Electro Medical" when no specific page title
4. **Login Page** - Description mentions "Sadguru Electro Medical Order Management System"

### Technical/Internal:
5. **Package.json** - Project name updated to `sadguru-electro-medical-frontend`
6. **Metadata** - SEO description includes company name

---

## Notes:

### Email Domains Unchanged
Demo email addresses still use `@oms.local` for consistency:
- `admin@oms.local`
- `sarah.johnson@oms.local`

These can be changed in the backend seed scripts if needed.

### Documentation
Documentation files (README, guides) still reference "OMS" in many places. These are for developer reference and don't affect the user-facing application.

### Logo Size Adjustment
The sidebar logo text was changed from `text-lg` to `text-sm` to ensure the full company name "Sadguru Electro Medical" fits comfortably in the sidebar at 256px width without wrapping.

---

## Visual Impact:

### Desktop (>1024px):
- Sidebar shows full "⚕ Sadguru Electro Medical" branding
- Looks professional with medical symbol (⚕)

### Mobile (<1024px):
- Hamburger menu reveals sidebar with full branding
- Sheet drawer displays company name prominently

### Browser Tab:
- Title shows "Sadguru Electro Medical - Order Management System"
- Or specific page like "Sadguru Electro Medical - Employees"

---

## Future Branding Enhancements (Optional):

If you want to further customize:

1. **Add Company Logo Image**
   - Replace the medical symbol (⚕) with an actual logo image
   - Place in `public/logo.svg` or `public/logo.png`
   - Update sidebar to use `<Image>` component

2. **Custom Favicon**
   - Replace default Next.js favicon
   - Add to `public/favicon.ico`

3. **Color Scheme**
   - Update primary colors in `app/globals.css` to match brand colors
   - Customize the neutral theme to brand colors

4. **Login Page Branding**
   - Add company logo above the login card
   - Add company tagline or description

5. **Email Templates**
   - If you add email notifications, include company branding

6. **Print Styles**
   - Add company header/footer to printed reports or invoices

---

## Verification Checklist:

✅ Sidebar shows "Sadguru Electro Medical"  
✅ Browser tab title includes company name  
✅ Login page mentions company name  
✅ Page title defaults to company name when navigating  
✅ Package.json reflects new name  

---

## Restart Required?

**No restart needed!** Next.js hot-reload will pick up these changes automatically if the dev server is running.

However, if you update `package.json`, you might want to:
```cmd
# Stop dev server (Ctrl+C)
cd frontend
npm install  # Update package-lock.json
npm run dev  # Restart
```

---

**The application now fully represents Sadguru Electro Medical branding!** 🏥
