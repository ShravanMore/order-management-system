# Quick Start & QA Summary

## ✅ App is Now Running

**Frontend**: http://localhost:3000  
**Backend**: http://localhost:8000  
**API Docs**: http://localhost:8000/api/v1/docs

---

## 🔐 Login Credentials

### Admin Account
- **Email**: admin@oms.local
- **Password**: Admin@1234
- **Access**: Full control - Dashboard, Employees, Dealers, Products, Orders, Profile

### Employee Account
- **Email**: sarah.johnson@oms.local
- **Password**: Employee@123
- **Access**: Orders, Products (read-only), Dealers (read-only), Profile

---

## ✅ Improvements Applied (5 total)

### 1. Keyboard Accessibility ♿
- Global focus-visible styles with 2px outline
- Visible focus rings on all navigation and buttons
- Proper focus offsets for visibility

**Test**: Press Tab key repeatedly - focus ring should be clearly visible

### 2. Mobile Touch Targets 📱
- All buttons minimum 44x44px (WCAG standard)
- Avatar increased from 28px to 32px
- Better tap targets throughout

**Test**: Open on mobile or DevTools at 375px width

### 3. Horizontal Scroll Fix 📐
- Added overflow-x-hidden to prevent unwanted scrolling
- Content properly contained on mobile

**Test**: Resize to narrow width, check for horizontal scrollbar

### 4. ARIA Labels for Screen Readers 🔊
- Menu button: "Open navigation menu"
- Theme toggle: "Switch to light/dark mode"
- User menu: "User menu for [name]"
- Logout button: "Logout"
- Loading buttons: aria-busy attribute

**Test**: Use screen reader (NVDA, JAWS, VoiceOver)

### 5. Loading State Accessibility ⏳
- Submit buttons announce busy state
- Screen readers detect loading

**Test**: Submit login form, screen reader should announce "busy"

---

## 🧪 Manual QA Testing Guide

### Responsive Testing (Required)

1. **Open DevTools** (F12)
2. **Click device toolbar** (Ctrl+Shift+M)
3. **Test at these widths**:
   - 375px (iPhone SE) - Mobile
   - 768px (iPad Mini) - Tablet
   - 1440px (Desktop) - Desktop

**Check for**:
- ✓ No horizontal scrollbars
- ✓ Text is readable (not cut off)
- ✓ Buttons are tappable (min 44px)
- ✓ Sidebar hidden on mobile, shown on desktop
- ✓ Hamburger menu works on mobile

### Dark Mode Testing (Required)

1. **Click sun/moon icon** in top-right
2. **Test all pages** in both modes
3. **Check**:
   - ✓ Text has good contrast
   - ✓ Badges are readable
   - ✓ Borders are visible
   - ✓ Focus rings stand out
   - ✓ Links are distinguishable

### Keyboard Navigation Testing (Required)

1. **Use Tab key** to navigate forward
2. **Use Shift+Tab** to go backward
3. **Use Enter/Space** to activate buttons
4. **Use Escape** to close dialogs

**Check**:
- ✓ Focus ring always visible
- ✓ Can reach all interactive elements
- ✓ Logical tab order
- ✓ No focus traps (unless in dialog)

### Pages to Test

#### ✅ Login Page (`/login`)
- [ ] Form validation shows errors
- [ ] Can submit with Enter key
- [ ] Loading state appears
- [ ] Redirects after successful login
- [ ] Demo credentials are visible

#### ✅ Employees Page (`/employees` - Admin only)
- [ ] Data table loads
- [ ] Search works
- [ ] Pagination works
- [ ] Create employee dialog
- [ ] Edit employee dialog
- [ ] Deactivate confirmation
- [ ] Workload badges show
- [ ] Empty state (search for "xxx")
- [ ] Error state (stop backend temporarily)

#### ✅ Dealers Page (`/dealers`)
- [ ] Data table loads
- [ ] Search works
- [ ] Pagination works
- [ ] Admin sees "Add Dealer" button
- [ ] Employee does NOT see "Add Dealer"
- [ ] Create dealer dialog (admin)
- [ ] Edit dealer dialog (admin)
- [ ] Empty state
- [ ] Error state

#### ✅ Products Page (`/products`)
- [ ] Data table loads
- [ ] Search and filters work
- [ ] Low stock products highlighted
- [ ] Admin can create/edit products
- [ ] Stock adjustment dialog
- [ ] Empty state
- [ ] Error state

#### 🚧 Dashboard Page (`/dashboard` - Admin only)
**Status**: Placeholder - "Coming soon" text only
- [ ] Shows placeholder message
- [ ] Layout doesn't break

#### 🚧 Orders Page (`/orders`)
**Status**: Placeholder - "Coming soon" text only
- [ ] Shows placeholder message
- [ ] Layout doesn't break

#### ✅ Profile Page (`/profile`)
- [ ] Shows current user info
- [ ] Can edit profile
- [ ] Can change password
- [ ] Validation works
- [ ] Success messages show

### Error State Testing

**Test 1: Backend Down**
1. Stop backend server (Ctrl+C in backend terminal)
2. Try to load Employees, Dealers, or Products page
3. **Should see**: Error message (not blank screen)
4. **Should NOT see**: Raw error or crash

**Test 2: Empty Results**
1. Go to any data table page
2. Search for "xxxnonexistent"
3. **Should see**: "No items found" with helpful message
4. **Should NOT see**: Blank table or spinning loader

**Test 3: Network Error**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to load data
4. **Should see**: Error message
5. Set back to "No throttling"

### Mobile-Specific Testing

**At 375px width, check**:
- [ ] Sidebar replaced with hamburger menu
- [ ] Sheet drawer opens/closes smoothly
- [ ] Data tables scroll horizontally if needed
- [ ] Forms are usable (inputs not too small)
- [ ] Buttons are easy to tap
- [ ] Dropdowns don't go off-screen
- [ ] No text cutoff or overlap

### Layout Testing

**On all pages, verify**:
- [ ] Page title correct in topbar
- [ ] Active nav link highlighted
- [ ] User name and avatar show (desktop)
- [ ] Theme toggle works
- [ ] User dropdown works
- [ ] Logout works
- [ ] No overlapping elements

---

## 🐛 Known Issues to Watch For

### Might See During Testing:
1. **Loading skeletons missing** - Some pages show blank while loading
2. **Form dialogs not full-screen on mobile** - Should be full-screen at 375px
3. **Table column hiding** - Some columns should hide on mobile but might not
4. **Toast positioning** - Multiple toasts might overlap
5. **Focus rings in dark mode** - Might be hard to see on some backgrounds

### Report Format for Issues Found:
```
**Issue**: [Brief description]
**Page**: [Which page]
**Width**: [375px / 768px / 1440px]
**Mode**: [Light / Dark]
**Severity**: [Critical / High / Medium / Low]
**Screenshot**: [Optional]
```

---

## 📊 QA Checklist Summary

### Critical (Must Test)
- [x] Login works
- [x] Route protection works (try accessing /employees without login)
- [x] Role-based access (employee can't access /dashboard)
- [ ] Responsive at 375px, 768px, 1440px
- [ ] Dark mode readable on all pages
- [ ] Keyboard navigation works

### High Priority
- [ ] Data tables load and paginate
- [ ] Search/filter works
- [ ] Create/edit forms work
- [ ] Error states show (not blank screens)
- [ ] Empty states show with helpful messages
- [ ] All buttons have proper focus states

### Medium Priority
- [ ] Toast notifications visible
- [ ] Loading states appear quickly
- [ ] Dropdowns position correctly
- [ ] Form validation messages clear
- [ ] Mobile hamburger menu smooth

### Nice to Have
- [ ] Animations smooth
- [ ] Hover effects work
- [ ] No console errors
- [ ] Images load properly
- [ ] Icons render correctly

---

## 🎯 Next Steps

1. **Complete manual QA** using checklist above
2. **Document any issues** found using the format provided
3. **Take screenshots** of visual issues
4. **Test at all three breakpoints** (375px, 768px, 1440px)
5. **Test both color modes** (light and dark)
6. **Test with keyboard only** (no mouse)

---

## 📝 Pages Built Status

| Page | Status | QA Needed |
|------|--------|-----------|
| `/login` | ✅ Complete | Yes |
| `/dashboard` | 🚧 Placeholder | No (not built) |
| `/employees` | ✅ Complete | Yes |
| `/dealers` | ✅ Complete | Yes |
| `/products` | ✅ Complete | Yes |
| `/orders` | 🚧 Placeholder | No (not built) |
| `/orders/[id]` | ❓ Unknown | Check if exists |
| `/orders/new` | ❓ Unknown | Check if exists |
| `/profile` | ✅ Complete | Yes |

---

## 🔗 Useful Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/api/v1/docs
- **Backend Health**: http://localhost:8000/health

---

## 📞 If You Need Help

### Common Issues

**Q: Can't login**  
A: Check backend is running at http://localhost:8000/health

**Q: Page shows "Coming soon"**  
A: That page is a placeholder, not yet built

**Q: No data in tables**  
A: Run seed scripts:
```cmd
cd backend
python -m app.scripts.seed_admin
python -m app.scripts.seed_demo_data
```

**Q: 401 Unauthorized errors**  
A: Clear cookies and login again

**Q: Styles look broken**  
A: Clear browser cache (Ctrl+Shift+R)

---

**Good luck with QA testing!** 🚀
