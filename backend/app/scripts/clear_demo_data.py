"""
Clear all demo data from database while preserving:
- Admin user (admin@oms.local)
- Database structure (tables and schema)
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import select, delete
from app.db.session import engine, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.dealer import Dealer
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatusLog


async def clear_demo_data():
    """Clear all data except admin user."""
    
    async with AsyncSessionLocal() as db:
        try:
            print("🗑️  Clearing demo data from database...")
            print("=" * 60)
            
            # 1. Delete all orders (cascade will delete order_items and order_status_logs)
            result = await db.execute(delete(Order))
            orders_deleted = result.rowcount
            print(f"✓ Deleted {orders_deleted} orders (with items and status logs)")
            
            # 2. Delete all products
            result = await db.execute(delete(Product))
            products_deleted = result.rowcount
            print(f"✓ Deleted {products_deleted} products")
            
            # 3. Delete all dealers
            result = await db.execute(delete(Dealer))
            dealers_deleted = result.rowcount
            print(f"✓ Deleted {dealers_deleted} dealers")
            
            # 4. Delete all employees (keep only admin)
            # First, get admin user email to preserve it
            admin_result = await db.execute(
                select(User).where(User.role == UserRole.admin)
            )
            admin_user = admin_result.scalar_one_or_none()
            
            if admin_user:
                print(f"✓ Preserving admin user: {admin_user.email}")
                
                # Delete all users except admin
                result = await db.execute(
                    delete(User).where(User.id != admin_user.id)
                )
                users_deleted = result.rowcount
                print(f"✓ Deleted {users_deleted} employee users")
            else:
                print("⚠️  Warning: No admin user found!")
            
            # Commit all deletions
            await db.commit()
            
            print("=" * 60)
            print("✅ Database cleared successfully!")
            print()
            print("📊 Summary:")
            print(f"   - Orders deleted: {orders_deleted}")
            print(f"   - Products deleted: {products_deleted}")
            print(f"   - Dealers deleted: {dealers_deleted}")
            print(f"   - Employees deleted: {users_deleted}")
            print(f"   - Admin user preserved: {admin_user.email if admin_user else 'None'}")
            print()
            print("🎯 You can now add data manually through the app!")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error clearing data: {e}")
            raise
        finally:
            await db.close()


async def main():
    """Main entry point."""
    print()
    print("🧹 Clear Demo Data Script")
    print("=" * 60)
    print()
    
    await clear_demo_data()
    
    # Close the engine
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
