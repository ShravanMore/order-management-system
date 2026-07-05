# Clear Database - Remove Demo Data

## Overview
This script removes all demo data from the database while preserving:
- ✅ Admin user account (admin@oms.local)
- ✅ Database structure (all tables remain)
- ✅ Alembic migration history

## What Will Be Deleted
- ❌ All orders (with order items and status logs)
- ❌ All products
- ❌ All dealers
- ❌ All employee users

## What Will Be Preserved
- ✅ Admin user: admin@oms.local / Admin@1234
- ✅ Database tables and schema
- ✅ Ability to add new data through the app

## How to Run

### Step 1: Activate Virtual Environment
```cmd
cd c:\Users\Admin\Desktop\order_management_system\backend
.venv\Scripts\activate
```

### Step 2: Run the Clear Script
```cmd
python app/scripts/clear_demo_data.py
```

### Step 3: Confirm the Action
The script will show a summary and ask for confirmation:
```
Are you sure you want to proceed? (yes/no):
```

Type `yes` and press Enter to proceed.

### Expected Output
```
🗑️  Clearing demo data from database...
============================================================
✓ Deleted 15 orders (with items and status logs)
✓ Deleted 20 products
✓ Deleted 10 dealers
✓ Preserving admin user: admin@oms.local
✓ Deleted 5 employee users
============================================================
✅ Database cleared successfully!

📊 Summary:
   - Orders deleted: 15
   - Products deleted: 20
   - Dealers deleted: 10
   - Employees deleted: 5
   - Admin user preserved: admin@oms.local

🎯 You can now add data manually through the app!
```

## After Clearing

### Login to the App
1. Navigate to http://localhost:3000/login
2. Login with admin credentials:
   - Email: `admin@oms.local`
   - Password: `Admin@1234`

### Add Data Manually
1. **Add Employees** - Go to `/employees` → Click "Add Employee"
2. **Add Dealers** - Go to `/dealers` → Click "Add Dealer"
3. **Add Products** - Go to `/products` → Click "Add Product"
4. **Create Orders** - Go to `/orders` → Click "New Order"

## Database Structure Preserved

All tables remain with their structure intact:
- `users` - Admin user remains
- `dealers` - Empty, ready for new entries
- `products` - Empty, ready for new entries
- `orders` - Empty, ready for new entries
- `order_items` - Empty (linked to orders)
- `order_status_logs` - Empty (linked to orders)

## Troubleshooting

### Error: "No admin user found!"
If you see this warning, it means the admin user was deleted or doesn't exist.

**Fix**: Run the admin seed script:
```cmd
python app/scripts/seed_admin.py
```

This will create the admin user again.

### Error: "Database connection failed"
Make sure:
1. PostgreSQL is running
2. Backend `.env` file has correct database credentials
3. Database exists

### Want to Restore Demo Data?
If you want to restore all the demo data again:
```cmd
python app/scripts/seed_demo_data.py
```

This will recreate:
- 5 employees
- 10 dealers
- 20 products
- 15 sample orders

## Safety Notes

⚠️ **This action cannot be undone!**
- Once deleted, data cannot be recovered unless you have a database backup
- The script asks for confirmation before proceeding
- Type anything other than "yes" to cancel

✅ **Safe to run multiple times**
- Running the script multiple times won't cause errors
- It will simply show "0 items deleted" if database is already empty

## Script Location
`backend/app/scripts/clear_demo_data.py`

## Alternative: Manual SQL (Advanced Users)

If you prefer SQL commands:

```sql
-- Connect to your database first
DELETE FROM order_status_logs;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM dealers;
DELETE FROM users WHERE role = 'employee';

-- Verify admin user remains
SELECT * FROM users WHERE role = 'admin';
```

⚠️ Use with caution - No confirmation prompts!
