# Mobile Responsive Tables - Card View Implementation

## Problem
Tables with many columns caused horizontal scrolling on mobile devices, creating poor UX.

## Solution
Enhanced `DataTable` component to support mobile card view:
- Shows full table on desktop (≥768px)
- Shows compact cards on mobile (<768px)
- No horizontal scrolling
- Tap cards for more details in modals

## Changes Made

### 1. DataTable Component Enhancement
**File**: `frontend/components/shared/data-table.tsx`

**New Props**:
```typescript
/** Custom mobile card renderer (shows on <md breakpoint) */
mobileCard?: (row: T) => React.ReactNode;

/** Click handler for mobile cards (optional) */
onRowClick?: (row: T) => void;
```

**Behavior**:
- Desktop: Shows full table with all columns
- Mobile: Shows card view with custom card renderer
- Automatic breakpoint handling with Tailwind `md:` classes
- Loading/error/empty states work in both modes

### 2. Orders Page - Mobile Cards
**File**: `frontend/app/(employee)/orders/page.tsx`

**Mobile Card Shows**:
- Order number (clickable)
- Status badge
- Dealer name
- Assigned employee
- Order date
- Total amount

**Tap Action**: Opens order detail modal

### 3. Products Page - Mobile Cards
**File**: `frontend/app/(employee)/products/page.tsx`

**Mobile Card Shows**:
- Product name and SKU
- Active/Inactive status
- Price and category
- Stock quantity with low stock warning
- Edit and Deactivate buttons (admin only)

### 4. Dealers Page - Mobile Cards
**File**: `frontend/app/(employee)/dealers/page.tsx`

**Mobile Card Shows**:
- Dealer name
- Contact person
- Phone number
- City and state
- Active/Inactive status
- Edit and Deactivate buttons (admin only)

### 5. Employees Page - Mobile Cards
**File**: `frontend/app/(admin)/employees/page.tsx`

**Mobile Card Shows**:
- Employee name
- Email address
- Phone number
- Active/Inactive status
- Edit and Deactivate buttons

## Design Pattern

### Typical Mobile Card Structure:
```tsx
mobileCard={(item) => (
  <div className="space-y-2">
    {/* Header with name and status */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Item Name</p>
        <p className="text-xs text-muted-foreground">Subtitle</p>
      </div>
      <StatusBadge />
    </div>
    
    {/* Additional info */}
    <div className="text-sm text-muted-foreground">
      <p>Detail 1</p>
      <p>Detail 2</p>
    </div>
    
    {/* Action buttons (admin only) */}
    {isAdmin && (
      <div className="pt-1 flex gap-2">
        <Button>Edit</Button>
        <Button>Deactivate</Button>
      </div>
    )}
  </div>
)}
```

## Responsive Behavior

### Desktop (≥768px / md breakpoint):
```
┌──────────────────────────────────────────┐
│ [Search]              [Filter] [Add]     │
├──────────────────────────────────────────┤
│ Header1 │ Header2 │ Header3 │ Actions  │
├─────────┼─────────┼─────────┼──────────┤
│ Data 1  │ Data 2  │ Data 3  │   ⋮      │
│ Data 1  │ Data 2  │ Data 3  │   ⋮      │
└──────────────────────────────────────────┘
```

### Mobile (<768px):
```
┌────────────────────┐
│ [Search]           │
│ [Filter] [Add]     │
├────────────────────┤
│ ┌────────────────┐ │
│ │ Name      Badge│ │
│ │ Detail 1       │ │
│ │ Detail 2       │ │
│ │ [Edit] [Delete]│ │
│ └────────────────┘ │
│ ┌────────────────┐ │
│ │ Name      Badge│ │
│ │ Detail 1       │ │
│ └────────────────┘ │
└────────────────────┘
```

## Benefits

### User Experience:
- ✅ No horizontal scrolling on mobile
- ✅ Readable text sizes
- ✅ Tap-friendly buttons (44x44px minimum)
- ✅ Essential info visible at a glance
- ✅ Details accessible via tap/modal

### Performance:
- ✅ Same data fetch for both views
- ✅ No separate mobile API endpoints needed
- ✅ CSS-only responsive switching

### Maintainability:
- ✅ Single DataTable component handles both views
- ✅ Custom card renderer per page
- ✅ Consistent pattern across all tables
- ✅ Easy to add new table pages

## Testing Checklist

### For Each Page (Orders, Products, Dealers, Employees):

#### Desktop View (≥768px):
- [ ] Full table displays with all columns
- [ ] Sorting works on sortable columns
- [ ] Pagination controls appear
- [ ] Search filters data correctly
- [ ] Action buttons work (Edit, Deactivate)
- [ ] Empty state shows properly

#### Mobile View (<768px):
- [ ] Cards display instead of table
- [ ] No horizontal scrolling
- [ ] Essential info is visible
- [ ] Status badges show correctly
- [ ] Tap action works (modal or form)
- [ ] Action buttons are tap-friendly
- [ ] Pagination controls appear
- [ ] Search filters cards correctly
- [ ] Empty state shows properly

#### Breakpoint Transition:
- [ ] Smooth transition at 768px
- [ ] No layout shift or flash
- [ ] Both views use same data

## Browser Testing
- Chrome DevTools responsive mode
- Firefox responsive design mode
- Safari responsive design mode
- Physical devices: iPhone, Android, iPad

## Future Enhancements
- Swipe actions on mobile cards (edit, delete)
- Pull-to-refresh on mobile
- Infinite scroll option for mobile
- Card density options (compact/comfortable)

## Files Modified
- ✅ `frontend/components/shared/data-table.tsx` - Added mobile card support
- ✅ `frontend/app/(employee)/orders/page.tsx` - Added order cards
- ✅ `frontend/app/(employee)/products/page.tsx` - Added product cards
- ✅ `frontend/app/(employee)/dealers/page.tsx` - Added dealer cards
- ✅ `frontend/app/(admin)/employees/page.tsx` - Added employee cards

## Tailwind Breakpoints Used
- `md:block` - Show on medium and up (desktop table)
- `md:hidden` - Hide on medium and up (mobile cards)
- `md:table-cell` - Show table cell on desktop
- Default (no prefix) - Mobile first approach
