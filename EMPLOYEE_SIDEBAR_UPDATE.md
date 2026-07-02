# Employee Sidebar Update

## Change Summary
Removed Products and Dealers sections from the employee sidebar navigation.

## What Was Changed

### File: `frontend/components/layout/sidebar.tsx`

**Before** - Employee had 4 navigation items:
```typescript
const employeeNav: NavItem[] = [
  { label: "Orders", href: "/orders", icon: ClipboardList },
  { label: "Products", href: "/products", icon: Package },      // ❌ REMOVED
  { label: "Dealers", href: "/dealers", icon: Building2 },       // ❌ REMOVED
  { label: "Profile", href: "/profile", icon: UserCircle },
];
```

**After** - Employee now has 2 navigation items:
```typescript
const employeeNav: NavItem[] = [
  { label: "Orders", href: "/orders", icon: ClipboardList },     // ✅ KEPT
  { label: "Profile", href: "/profile", icon: UserCircle },      // ✅ KEPT
];
```

## Navigation Structure

### Admin Sidebar (unchanged)
- Dashboard
- Orders
- Products
- Dealers
- Employees
- Profile
- Logout

### Employee Sidebar (updated)
- Orders ✅
- Profile ✅
- Logout

## Rationale
Employees should focus on order management and their profile. Products and Dealers management are administrative functions.

## Testing
1. Login as employee account (e.g., `sarah.johnson@oms.local` / `Employee@123`)
2. Verify sidebar only shows:
   - Orders
   - Profile
   - Logout button
3. Verify Products and Dealers links are not visible
4. Login as admin to confirm admin sidebar still has all 6 sections

## Notes
- Employee routes `/products` and `/dealers` still exist in the codebase
- Employees can still technically access these pages by typing the URL directly
- If you want to block access completely, you'll need to update the `proxy.ts` middleware to restrict these routes by role
