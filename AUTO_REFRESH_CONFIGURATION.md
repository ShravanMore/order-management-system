# Auto-Refresh Configuration - Real-Time Data Updates

## Overview
The application now uses aggressive React Query caching strategies to ensure data is always fresh and up-to-date.

## Configuration Changes

### File: `frontend/app/providers.tsx`

**Before**:
```typescript
queries: {
  staleTime: 60 * 1000, // 1 minute
  refetchOnWindowFocus: false,
}
```

**After**:
```typescript
queries: {
  staleTime: 0, // Data is immediately considered stale
  refetchOnWindowFocus: true, // Refetch when window gains focus
  refetchOnMount: true, // Refetch when component mounts
  refetchOnReconnect: true, // Refetch when network reconnects
}
```

## How It Works

### 1. Automatic Refetching
Data automatically refetches in these scenarios:

#### **On Window Focus**
- Switch to another tab/window and back → Data refetches
- Minimize window and restore → Data refetches
- Example: You edit a product in another tab, switch back → List updates automatically

#### **On Component Mount**
- Navigate away from a page and return → Data refetches
- Open a page fresh → Always fetches latest data

#### **On Network Reconnect**
- Lose internet connection and reconnect → Data refetches
- Switch from WiFi to mobile data → Data refetches

### 2. Cache Invalidation
When you perform actions, related queries are invalidated:

#### **Products**
- ✅ Create product → Invalidates `["products"]`
- ✅ Update product → Invalidates `["products"]`
- ✅ Deactivate product → Invalidates `["products"]`
- **Result**: Product list refreshes immediately

#### **Dealers**
- ✅ Create dealer → Invalidates `["dealers"]`
- ✅ Update dealer → Invalidates `["dealers"]`
- ✅ Deactivate dealer → Invalidates `["dealers"]`
- **Result**: Dealer list refreshes immediately

#### **Employees**
- ✅ Create employee → Invalidates `["employees"]`
- ✅ Update employee → Invalidates `["employees"]`
- ✅ Deactivate employee → Invalidates `["employees"]`
- **Result**: Employee list refreshes immediately

#### **Orders**
- ✅ Create order → Navigates to order detail (fresh data)
- ✅ Update order → Invalidates `["order", id]` and `["orders"]`
- ✅ Update status → Invalidates `["order", id]` and `["orders"]`
- **Result**: Both order detail and orders list refresh

## User Experience

### Scenario 1: Add New Product
1. Click "Add Product"
2. Fill form and save
3. Form closes with success toast
4. **Product list automatically shows new product** ✅

### Scenario 2: Edit Existing Order
1. Click order number to open modal
2. Click "Edit"
3. Change dealer or assignment
4. Click "Save Changes"
5. **Modal shows updated data immediately** ✅
6. Close modal
7. **Orders list shows updated information** ✅

### Scenario 3: Multi-Tab Workflow
1. Open products page in Tab 1
2. Open products page in Tab 2
3. Add product in Tab 2
4. **Switch to Tab 1**
5. **Product list automatically refetches and shows new product** ✅

### Scenario 4: Deactivate Item
1. Click deactivate on any item
2. Confirm action
3. **Item updates to "Inactive" status immediately** ✅
4. **Toast notification appears** ✅

## No Manual Refresh Needed!

You **DO NOT** need to:
- ❌ Press F5 or Ctrl+R
- ❌ Click any refresh button
- ❌ Navigate away and back
- ❌ Close and reopen the app

The app **automatically** handles all updates through:
- ✅ Smart query invalidation
- ✅ Background refetching
- ✅ Focus-based updates
- ✅ Mount-based updates

## Performance Considerations

### Network Requests
With `staleTime: 0`, queries refetch more frequently. However:

**Optimizations in place:**
1. **Deduplicated requests** - Multiple components requesting same data share one request
2. **Background fetching** - Updates happen in background, UI stays responsive
3. **Optimistic updates** - Some mutations update UI before server confirms
4. **Smart invalidation** - Only affected queries refetch, not everything

**Result**: Fast, responsive UI with fresh data

### If Needed: Adjust Stale Time Per Query

For queries that change rarely, you can override the global setting:

```typescript
useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // 5 minutes for this query only
});
```

**Currently NOT needed** - Default behavior works well for this app.

## Troubleshooting

### Data Not Updating After Action?

**Check 1: Success Toast**
- Toast should appear after action
- If no toast → Action may have failed

**Check 2: Network Tab**
- Open DevTools → Network tab
- Perform action
- Should see POST/PUT/PATCH request
- Should see GET request right after (refetch)

**Check 3: Console Errors**
- Open DevTools → Console
- Look for red errors
- May indicate API or network issue

### Still Seeing Old Data?

**Solution 1: Hard Refresh**
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clears browser cache and reloads

**Solution 2: Clear Browser Cache**
- Settings → Privacy → Clear browsing data
- Select "Cached images and files"

**Solution 3: Check Backend**
- Ensure backend is running
- Check backend logs for errors
- Verify database has correct data

## Developer Notes

### Query Keys Convention
All queries use descriptive keys:
- `["products"]` - Product list
- `["product", id]` - Single product
- `["dealers"]` - Dealer list
- `["employees"]` - Employee list
- `["orders"]` - Orders list
- `["order", id]` - Single order detail
- `["employees-list"]` - Used in dropdowns

### Invalidation Strategy
- **Specific queries**: When updating one item
- **List queries**: When creating, updating, or deleting
- **Related queries**: When changes affect multiple views

Example:
```typescript
// After updating order status
queryClient.invalidateQueries({ queryKey: ["order", orderId] }); // Refresh detail
queryClient.invalidateQueries({ queryKey: ["orders"] }); // Refresh list
```

## Testing Checklist

### Products
- [ ] Add product → List shows new item immediately
- [ ] Edit product → List shows updated name/price
- [ ] Deactivate product → Status changes to inactive
- [ ] Switch tabs and back → Data refetches

### Dealers
- [ ] Add dealer → List shows new item immediately
- [ ] Edit dealer → List shows updated info
- [ ] Deactivate dealer → Status changes to inactive

### Employees
- [ ] Add employee → List shows new item immediately
- [ ] Edit employee → List shows updated info
- [ ] Deactivate employee → Status changes to inactive

### Orders
- [ ] Create order → Navigates to detail with fresh data
- [ ] Update order → Detail modal shows changes
- [ ] Update status → Badge updates in list and detail
- [ ] Close modal → List reflects changes

## Summary

✅ **No manual refresh needed**
✅ **Data always fresh and up-to-date**
✅ **Automatic refetching on focus**
✅ **Smart cache invalidation**
✅ **Fast, responsive UI**

The app is now configured for optimal real-time data updates!
