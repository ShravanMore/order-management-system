# Install Required Dependency for Order Modal

## Required Package
The new order detail modal uses Radix UI Tabs component which requires an additional dependency.

## Installation Command

```cmd
cd c:\Users\Admin\Desktop\order_management_system\frontend
npm install @radix-ui/react-tabs
```

## After Installation
Restart the frontend development server:

```cmd
npm run dev
```

## Verify Installation
1. Check `package.json` includes: `"@radix-ui/react-tabs": "^1.x.x"`
2. No build errors when starting dev server
3. Tabs component renders correctly in order detail modal

## If You Get Errors
Try:
```cmd
npm install --legacy-peer-deps @radix-ui/react-tabs
```

or

```cmd
npm install --force @radix-ui/react-tabs
```
