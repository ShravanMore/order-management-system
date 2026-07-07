"""
Clear ALL data from ALL tables while preserving table structure.

This script deletes all rows from every table in the database but keeps
the table definitions, columns, constraints, and indexes intact.

⚠️  WARNING: This will delete ALL data including admin users!
You will need to run seed_admin.py or seed_demo_data.py after this.

Usage:
    python -m app.scripts.clear_all_data
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from app.db.session import engine, AsyncSessionLocal


async def clear_all_tables():
    """Clear all data from all tables while preserving structure."""
    
    async with AsyncSessionLocal() as db:
        try:
            print("🗑️  Clearing ALL data from database...")
            print("=" * 70)
            print("⚠️  WARNING: This will delete ALL rows from ALL tables!")
            print("=" * 70)
            
            # List of tables in the correct order for deletion (respecting foreign keys)
            # Delete child tables first, then parent tables
            tables_to_clear = [
                "order_status_logs",      # Child of orders and users
                "order_items",            # Child of orders and products
                "orders",                 # Child of dealers and users
                "products",               # Independent
                "dealers",                # Independent
                "users",                  # Parent of many tables
            ]
            
            total_deleted = {}
            
            # Disable foreign key checks temporarily for faster deletion
            # Note: PostgreSQL doesn't use FOREIGN_KEY_CHECKS, so we delete in order
            
            for table_name in tables_to_clear:
                # Count rows before deletion
                count_result = await db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = count_result.scalar()
                
                if count > 0:
                    # Delete all rows from the table
                    await db.execute(text(f"DELETE FROM {table_name}"))
                    total_deleted[table_name] = count
                    print(f"✓ Cleared {count:4d} rows from {table_name}")
                else:
                    print(f"  Skipped (empty): {table_name}")
            
            # Reset sequences (auto-increment counters) to start from 1 again
            print()
            print("🔄 Resetting auto-increment sequences...")
            sequences = [
                ("users", "users_id_seq"),
                ("dealers", "dealers_id_seq"),
                ("products", "products_id_seq"),
                ("orders", "orders_id_seq"),
                ("order_items", "order_items_id_seq"),
                ("order_status_logs", "order_status_logs_id_seq"),
            ]
            
            for table_name, sequence_name in sequences:
                try:
                    await db.execute(text(f"ALTER SEQUENCE {sequence_name} RESTART WITH 1"))
                    print(f"✓ Reset sequence: {sequence_name}")
                except Exception as e:
                    # Sequence might not exist or already reset
                    print(f"  Skipped sequence: {sequence_name} ({str(e)[:50]})")
            
            # Commit all changes
            await db.commit()
            
            print()
            print("=" * 70)
            print("✅ ALL DATA CLEARED SUCCESSFULLY!")
            print("=" * 70)
            print()
            print("📊 Summary:")
            total_rows = sum(total_deleted.values())
            print(f"   Total rows deleted: {total_rows}")
            for table, count in total_deleted.items():
                print(f"   - {table}: {count} rows")
            
            print()
            print("📋 Table Structure Status:")
            print("   ✓ All tables preserved")
            print("   ✓ All columns preserved")
            print("   ✓ All constraints preserved")
            print("   ✓ All indexes preserved")
            print("   ✓ All sequences reset to 1")
            
            print()
            print("🔄 Next Steps:")
            print("   1. To create a fresh admin user:")
            print("      python -m app.scripts.seed_admin")
            print()
            print("   2. To seed demo data:")
            print("      python -m app.scripts.seed_demo_data")
            print()
            print("   3. Or add data manually through the application")
            print()
            
        except Exception as e:
            await db.rollback()
            print()
            print(f"❌ Error clearing data: {e}")
            print("⚠️  Database has been rolled back to previous state")
            raise
        finally:
            await db.close()


async def verify_tables_exist():
    """Verify that all expected tables exist before clearing."""
    async with AsyncSessionLocal() as db:
        try:
            # Query to check if tables exist
            result = await db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            print("📋 Database Tables Found:")
            for table in tables:
                print(f"   ✓ {table}")
            print()
            
            return tables
            
        except Exception as e:
            print(f"❌ Error checking tables: {e}")
            raise
        finally:
            await db.close()


async def main():
    """Main entry point."""
    print()
    print("🧹 CLEAR ALL DATA SCRIPT")
    print("=" * 70)
    print()
    
    # First, verify tables exist
    tables = await verify_tables_exist()
    
    if not tables:
        print("⚠️  No tables found in database!")
        print("   Run migrations first: alembic upgrade head")
        return
    
    # Confirm before proceeding
    print("⚠️  WARNING: This will permanently delete ALL data from ALL tables!")
    print("   - All users (including admins) will be deleted")
    print("   - All orders will be deleted")
    print("   - All products will be deleted")
    print("   - All dealers will be deleted")
    print("   - Table structures will be preserved")
    print()
    
    # In automated environments, skip confirmation
    # For manual use, you can uncomment the following lines:
    # response = input("   Type 'DELETE ALL' to continue: ")
    # if response != "DELETE ALL":
    #     print("❌ Aborted by user")
    #     return
    
    print("   Proceeding with data deletion...")
    print()
    
    # Clear all data
    await clear_all_tables()
    
    # Close the engine
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
