"""
Quick diagnostic script to check backend health
Run: python diagnose.py
"""
import asyncio
import sys
from sqlalchemy import text, select
from sqlalchemy.exc import SQLAlchemyError

try:
    from app.db.session import AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.core.config import settings
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the backend directory and venv is activated")
    sys.exit(1)


async def check_database():
    """Check database connection and tables"""
    print("\n🔍 Checking Database Connection...")
    print(f"📍 Database URL: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else '***'}")
    
    try:
        async with AsyncSessionLocal() as db:
            # Test 1: Basic connection
            await db.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            
            # Test 2: Check users table
            result = await db.execute(text("SELECT COUNT(*) FROM users"))
            total_users = result.scalar()
            print(f"✅ Users table exists ({total_users} users)")
            
            # Test 3: Check employees
            result = await db.execute(
                text("SELECT COUNT(*) FROM users WHERE role = 'employee'")
            )
            employee_count = result.scalar()
            print(f"✅ Employees found: {employee_count}")
            
            if employee_count == 0:
                print("⚠️  WARNING: No employees in database!")
                print("   Run: python -m app.scripts.seed_demo_data")
            
            # Test 4: Check other tables
            tables = ["dealers", "products", "orders"]
            for table in tables:
                try:
                    result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    print(f"✅ {table.capitalize()} table exists ({count} rows)")
                except SQLAlchemyError as e:
                    print(f"❌ {table.capitalize()} table issue: {e}")
            
            return True
            
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        print("\n💡 Possible fixes:")
        print("   1. Check PostgreSQL is running")
        print("   2. Check .env DATABASE_URL is correct")
        print("   3. Run: alembic upgrade head")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


async def check_employees_query():
    """Test the actual employees query"""
    print("\n🔍 Testing Employees Query...")
    
    try:
        async with AsyncSessionLocal() as db:
            # This is what the API endpoint does
            result = await db.execute(
                select(User)
                .where(User.role == UserRole.employee)
                .order_by(User.full_name.asc())
                .limit(10)
            )
            employees = result.scalars().all()
            
            print(f"✅ Query successful: {len(employees)} employees")
            for emp in employees:
                status = "🟢" if emp.is_active else "🔴"
                print(f"   {status} {emp.full_name} ({emp.email})")
            
            return True
            
    except Exception as e:
        print(f"❌ Query failed: {e}")
        return False


def check_config():
    """Check configuration"""
    print("\n🔍 Checking Configuration...")
    
    try:
        print(f"✅ Project Name: {settings.PROJECT_NAME}")
        print(f"✅ API Prefix: {settings.API_V1_STR}")
        print(f"✅ CORS Origins: {settings.CORS_ORIGINS}")
        print(f"✅ JWT Algorithm: {settings.JWT_ALGORITHM}")
        print(f"✅ Access Token Expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        return True
    except Exception as e:
        print(f"❌ Config error: {e}")
        print("   Make sure .env file exists with required variables")
        return False


async def main():
    """Run all diagnostics"""
    print("=" * 60)
    print("🏥 BACKEND DIAGNOSTICS - Sadguru Electro Medical OMS")
    print("=" * 60)
    
    results = []
    
    # Check 1: Config
    results.append(("Configuration", check_config()))
    
    # Check 2: Database
    results.append(("Database", await check_database()))
    
    # Check 3: Employees Query
    results.append(("Employees Query", await check_employees_query()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for check_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {check_name}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All checks passed! Backend should be working.")
        print("\n📝 Next steps:")
        print("   1. Start backend: uvicorn app.main:app --reload")
        print("   2. Test in browser: http://localhost:8000/api/v1/docs")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\n📝 Common fixes:")
        print("   • Run migrations: alembic upgrade head")
        print("   • Seed data: python -m app.scripts.seed_demo_data")
        print("   • Check PostgreSQL is running")
        print("   • Check .env file exists and is correct")
    
    print()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Diagnostic cancelled")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
