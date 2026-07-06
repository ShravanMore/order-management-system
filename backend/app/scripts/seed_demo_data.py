"""
Seed the database with realistic demo data for testing and demonstration.

Usage:
    python -m app.scripts.seed_demo_data
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.dealer import Dealer
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus


async def seed_users(db: AsyncSession) -> dict[str, User]:
    """Seed admin and employee users."""
    print("🔹 Seeding users...")
    
    users_data = [
        {
            "full_name": "Admin User",
            "email": "admin@oms.local",
            "password": "Admin@1234",
            "role": UserRole.admin,
            "phone": "+1-555-0100",
        },
        {
            "full_name": "Sarah Johnson",
            "email": "sarah.johnson@oms.local",
            "password": "Employee@123",
            "role": UserRole.employee,
            "phone": "+1-555-0101",
            "base_salary": Decimal("25000.00"),
            "commission_percentage": Decimal("1.00"),
        },
        {
            "full_name": "Michael Chen",
            "email": "michael.chen@oms.local",
            "password": "Employee@123",
            "role": UserRole.employee,
            "phone": "+1-555-0102",
            "base_salary": Decimal("28000.00"),
            "commission_percentage": Decimal("1.50"),
        },
        {
            "full_name": "Emily Rodriguez",
            "email": "emily.rodriguez@oms.local",
            "password": "Employee@123",
            "role": UserRole.employee,
            "phone": "+1-555-0103",
            "base_salary": Decimal("30000.00"),
            "commission_percentage": Decimal("2.00"),
        },
        {
            "full_name": "David Kumar",
            "email": "david.kumar@oms.local",
            "password": "Employee@123",
            "role": UserRole.employee,
            "phone": "+1-555-0104",
            "base_salary": Decimal("22000.00"),
            "commission_percentage": Decimal("0.75"),
        },
    ]
    
    users = {}
    for data in users_data:
        email = data["email"]
        password = data.pop("password")

        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"  ⏭  Skipped (exists): {existing.full_name} ({existing.role.value})")
            users[existing.email] = existing
        else:
            user = User(
                **data,
                hashed_password=get_password_hash(password),
                is_active=True,
            )
            db.add(user)
            await db.flush()
            users[user.email] = user
            print(f"  ✓ Created user: {user.full_name} ({user.role.value})")

    return users


async def seed_dealers(db: AsyncSession) -> list[Dealer]:
    """Seed dealer data."""
    print("\n🔹 Seeding dealers...")
    
    dealers_data = [
        {
            "name": "HealthCare Medical Supplies Inc.",
            "contact_person": "John Anderson",
            "email": "john@healthcare-medical.com",
            "phone": "+1-555-1001",
            "address": "123 Medical Plaza, Suite 100",
            "city": "New York",
            "state": "NY",
            "pincode": "10001",
            "gst_number": "29ABCDE1234F1Z5",
        },
        {
            "name": "MediQuip Solutions",
            "contact_person": "Lisa Thompson",
            "email": "lisa@mediquip.com",
            "phone": "+1-555-1002",
            "address": "456 Healthcare Drive",
            "city": "Los Angeles",
            "state": "CA",
            "pincode": "90001",
            "gst_number": "27FGHIJ5678K2M9",
        },
        {
            "name": "Physio Equipment Direct",
            "contact_person": "Robert Martinez",
            "email": "robert@physioequip.com",
            "phone": "+1-555-1003",
            "address": "789 Therapy Lane",
            "city": "Chicago",
            "state": "IL",
            "pincode": "60601",
            "gst_number": "33KLMNO9012P3Q7",
        },
        {
            "name": "Advanced Rehab Technologies",
            "contact_person": "Jennifer Lee",
            "email": "jennifer@advancedrehab.com",
            "phone": "+1-555-1004",
            "address": "321 Innovation Blvd",
            "city": "Houston",
            "state": "TX",
            "pincode": "77001",
            "gst_number": "09PQRST3456U4V2",
        },
        {
            "name": "ProHealth Medical Equipment",
            "contact_person": "William Davis",
            "email": "william@prohealth.com",
            "phone": "+1-555-1005",
            "address": "654 Wellness Way",
            "city": "Phoenix",
            "state": "AZ",
            "pincode": "85001",
            "gst_number": "06UVWXY7890Z5A1",
        },
        {
            "name": "Elite Physiotherapy Supplies",
            "contact_person": "Patricia Wilson",
            "email": "patricia@elitephysio.com",
            "phone": "+1-555-1006",
            "address": "987 Treatment Center Road",
            "city": "Philadelphia",
            "state": "PA",
            "pincode": "19101",
            "gst_number": "23BCDEF2345G6H8",
        },
        {
            "name": "Therapeutic Equipment Warehouse",
            "contact_person": "Charles Brown",
            "email": "charles@therapeutic-eq.com",
            "phone": "+1-555-1007",
            "address": "147 Recovery Street",
            "city": "San Antonio",
            "state": "TX",
            "pincode": "78201",
            "gst_number": "29HIJKL6789M7N4",
        },
        {
            "name": "Wellness Medical Distributors",
            "contact_person": "Amanda Garcia",
            "email": "amanda@wellness-dist.com",
            "phone": "+1-555-1008",
            "address": "258 Health Park Avenue",
            "city": "San Diego",
            "state": "CA",
            "pincode": "92101",
            "gst_number": "27NOPQR0123S8T5",
        },
    ]
    
    dealers = []
    for data in dealers_data:
        result = await db.execute(select(Dealer).where(Dealer.email == data["email"]))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  ⏭  Skipped (exists): {existing.name} ({existing.city})")
            dealers.append(existing)
        else:
            dealer = Dealer(**data, is_active=True)
            db.add(dealer)
            await db.flush()
            dealers.append(dealer)
            print(f"  ✓ Created dealer: {dealer.name} ({dealer.city})")

    return dealers


async def seed_products(db: AsyncSession) -> list[Product]:
    """Seed product data."""
    print("\n🔹 Seeding products...")
    
    products_data = [
        # Electrotherapy
        {
            "name": "Combo 4-Channel Electrotherapy Unit",
            "sku": "ELEC-001",
            "category": "Electrotherapy",
            "description": "Professional 4-channel electrotherapy device with TENS, EMS, IFT, and Russian modalities",
            "price": Decimal("4500.00"),
            "stock_quantity": 15,
            "low_stock_threshold": 5,
            "unit": "piece",
        },
        {
            "name": "Portable TENS Unit",
            "sku": "ELEC-002",
            "category": "Electrotherapy",
            "description": "Compact dual-channel TENS device for pain management",
            "price": Decimal("1200.00"),
            "stock_quantity": 3,  # Low stock
            "low_stock_threshold": 8,
            "unit": "piece",
        },
        {
            "name": "Interferential Therapy Machine",
            "sku": "ELEC-003",
            "category": "Electrotherapy",
            "description": "Advanced IFT unit with digital display and multiple programs",
            "price": Decimal("3200.00"),
            "stock_quantity": 12,
            "low_stock_threshold": 6,
            "unit": "piece",
        },
        # Exercise & Rehab Equipment
        {
            "name": "Parallel Walking Bars - Adjustable",
            "sku": "EXER-001",
            "category": "Exercise & Rehab Equipment",
            "description": "Height-adjustable parallel bars for gait training, 10ft length",
            "price": Decimal("2800.00"),
            "stock_quantity": 8,
            "low_stock_threshold": 4,
            "unit": "set",
        },
        {
            "name": "Therapy Exercise Balls Set",
            "sku": "EXER-002",
            "category": "Exercise & Rehab Equipment",
            "description": "Professional grade exercise balls - 45cm, 55cm, 65cm, 75cm",
            "price": Decimal("450.00"),
            "stock_quantity": 25,
            "low_stock_threshold": 10,
            "unit": "set",
        },
        {
            "name": "Resistance Band Kit - Professional",
            "sku": "EXER-003",
            "category": "Exercise & Rehab Equipment",
            "description": "Complete resistance band set with 5 resistance levels",
            "price": Decimal("280.00"),
            "stock_quantity": 2,  # Low stock
            "low_stock_threshold": 12,
            "unit": "kit",
        },
        {
            "name": "Upper Body Ergometer",
            "sku": "EXER-004",
            "category": "Exercise & Rehab Equipment",
            "description": "Digital upper body cycling machine for cardio and strength",
            "price": Decimal("5500.00"),
            "stock_quantity": 6,
            "low_stock_threshold": 3,
            "unit": "piece",
        },
        # Traction Units
        {
            "name": "Cervical Traction Unit - Electronic",
            "sku": "TRAC-001",
            "category": "Traction Units",
            "description": "Computerized cervical traction with programmable settings",
            "price": Decimal("8500.00"),
            "stock_quantity": 4,
            "low_stock_threshold": 3,
            "unit": "piece",
        },
        {
            "name": "Lumbar Traction Table",
            "sku": "TRAC-002",
            "category": "Traction Units",
            "description": "Motorized lumbar traction table with digital controls",
            "price": Decimal("12000.00"),
            "stock_quantity": 2,
            "low_stock_threshold": 2,
            "unit": "piece",
        },
        {
            "name": "Portable Cervical Traction Kit",
            "sku": "TRAC-003",
            "category": "Traction Units",
            "description": "Over-door cervical traction device for home use",
            "price": Decimal("850.00"),
            "stock_quantity": 18,
            "low_stock_threshold": 8,
            "unit": "kit",
        },
        # Ultrasound Therapy
        {
            "name": "Therapeutic Ultrasound 1MHz/3MHz",
            "sku": "ULTRA-001",
            "category": "Ultrasound Therapy",
            "description": "Dual frequency ultrasound therapy unit with continuous and pulsed modes",
            "price": Decimal("6800.00"),
            "stock_quantity": 10,
            "low_stock_threshold": 5,
            "unit": "piece",
        },
        {
            "name": "Portable Ultrasound Unit",
            "sku": "ULTRA-002",
            "category": "Ultrasound Therapy",
            "description": "Compact ultrasound device for mobile therapy",
            "price": Decimal("4200.00"),
            "stock_quantity": 7,
            "low_stock_threshold": 4,
            "unit": "piece",
        },
        {
            "name": "Ultrasound Gel - Professional Grade",
            "sku": "ULTRA-003",
            "category": "Ultrasound Therapy",
            "description": "Conductive gel for ultrasound therapy, 5 liter container",
            "price": Decimal("180.00"),
            "stock_quantity": 1,  # Low stock
            "low_stock_threshold": 15,
            "unit": "container",
        },
        # Cryotherapy
        {
            "name": "Cold Therapy System with Compression",
            "sku": "CRYO-001",
            "category": "Cryotherapy",
            "description": "Motorized cold therapy unit with compression for injury recovery",
            "price": Decimal("3500.00"),
            "stock_quantity": 9,
            "low_stock_threshold": 5,
            "unit": "piece",
        },
        {
            "name": "Ice Pack Set - Reusable",
            "sku": "CRYO-002",
            "category": "Cryotherapy",
            "description": "Professional reusable ice packs, various sizes",
            "price": Decimal("320.00"),
            "stock_quantity": 22,
            "low_stock_threshold": 10,
            "unit": "set",
        },
        # Laser Therapy
        {
            "name": "Class IV Laser Therapy System",
            "sku": "LASER-001",
            "category": "Laser Therapy",
            "description": "High-power laser therapy device for pain and inflammation",
            "price": Decimal("28000.00"),
            "stock_quantity": 3,
            "low_stock_threshold": 2,
            "unit": "piece",
        },
        {
            "name": "Low Level Laser Therapy Device",
            "sku": "LASER-002",
            "category": "Laser Therapy",
            "description": "LLLT device for tissue healing and pain relief",
            "price": Decimal("9500.00"),
            "stock_quantity": 5,
            "low_stock_threshold": 3,
            "unit": "piece",
        },
        # Orthopedic Supports
        {
            "name": "Cervical Collar Set - Adjustable",
            "sku": "ORTHO-001",
            "category": "Orthopedic Supports",
            "description": "Adjustable cervical collars in multiple sizes",
            "price": Decimal("450.00"),
            "stock_quantity": 30,
            "low_stock_threshold": 12,
            "unit": "set",
        },
        {
            "name": "Lumbar Support Belt - Professional",
            "sku": "ORTHO-002",
            "category": "Orthopedic Supports",
            "description": "Heavy-duty lumbar support with adjustable compression",
            "price": Decimal("380.00"),
            "stock_quantity": 28,
            "low_stock_threshold": 15,
            "unit": "piece",
        },
        {
            "name": "Knee Braces - Hinged Set",
            "sku": "ORTHO-003",
            "category": "Orthopedic Supports",
            "description": "Professional hinged knee braces for stability",
            "price": Decimal("650.00"),
            "stock_quantity": 20,
            "low_stock_threshold": 10,
            "unit": "set",
        },
    ]
    
    products = []
    for data in products_data:
        result = await db.execute(select(Product).where(Product.sku == data["sku"]))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  ⏭  Skipped (exists): {existing.name}")
            products.append(existing)
        else:
            product = Product(**data, is_active=True)
            db.add(product)
            await db.flush()
            products.append(product)
            status_icon = "⚠️ " if product.stock_quantity <= product.low_stock_threshold else "  "
            print(f"  {status_icon}✓ Created product: {product.name} (Stock: {product.stock_quantity})")

    return products


async def seed_orders(
    db: AsyncSession,
    users: dict[str, User],
    dealers: list[Dealer],
    products: list[Product]
) -> list[Order]:
    """Seed order data."""
    print("\n🔹 Seeding orders...")

    # Check if orders already exist
    result = await db.execute(select(Order))
    existing_orders = result.scalars().all()
    if existing_orders:
        print(f"  ⏭  Skipped: {len(existing_orders)} orders already exist.")
        return existing_orders
    
    # Get employees for assignment
    employees = [u for u in users.values() if u.role == UserRole.employee]
    admin = users["admin@oms.local"]
    
    # Generate orders over the last 3 months
    now = datetime.now(timezone.utc)
    orders = []
    order_counter = 1
    
    # Status distribution: mostly completed, some ongoing, few pending, couple cancelled
    status_pool = (
        [OrderStatus.completed] * 18 +
        [OrderStatus.ongoing] * 8 +
        [OrderStatus.pending] * 2 +
        [OrderStatus.cancelled] * 2
    )
    
    for i in range(30):
        # Random date in last 3 months
        days_ago = random.randint(0, 90)
        order_date = now - timedelta(days=days_ago)
        
        # Order number format: ORD-YYYY-####
        year = order_date.year
        order_number = f"ORD-{year}-{order_counter:04d}"
        order_counter += 1
        
        # Random dealer and employee
        dealer = random.choice(dealers)
        assigned_to = random.choice(employees) if random.random() > 0.2 else None  # 80% assigned
        
        # Random status from pool
        status = status_pool[i]
        
        # Expected delivery: 2-4 weeks from order date
        expected_delivery = order_date + timedelta(days=random.randint(14, 28))
        
        # Completed date if completed
        completed_at = None
        if status == OrderStatus.completed:
            completed_at = order_date + timedelta(days=random.randint(7, 21))
        
        # Create order
        order = Order(
            order_number=order_number,
            dealer_id=dealer.id,
            created_by_id=admin.id,
            assigned_to_id=assigned_to.id if assigned_to else None,
            status=status,
            order_date=order_date,
            expected_delivery_date=expected_delivery,
            completed_at=completed_at,
            total_amount=Decimal("0.00"),
            notes=f"Demo order for {dealer.name}" if random.random() > 0.7 else None
        )
        db.add(order)
        await db.flush()
        
        # Add 1-4 items to order
        num_items = random.randint(1, 4)
        selected_products = random.sample(products, num_items)
        total_amount = Decimal("0.00")
        
        for product in selected_products:
            quantity = random.randint(1, 5)
            unit_price = product.price
            subtotal = unit_price * quantity
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal
            )
            db.add(order_item)
            
            # Deduct stock (only for non-cancelled orders)
            if status != OrderStatus.cancelled:
                product.stock_quantity = max(0, product.stock_quantity - quantity)
            
            total_amount += subtotal
        
        order.total_amount = total_amount
        orders.append(order)
        
        assigned_name = assigned_to.full_name if assigned_to else "Unassigned"
        print(f"  ✓ Created order: {order.order_number} | {status.value} | {dealer.name} | {assigned_name}")
    
    return orders


async def main():
    """Main seeding function."""
    print("=" * 70)
    print("🌱 SEEDING DEMO DATA")
    print("=" * 70)
    
    async with AsyncSessionLocal() as db:
        try:
            # Check if data already exists
            result = await db.execute(select(User))
            existing_users = result.scalars().all()
            
            if existing_users:
                print("\n⚠️  Database already contains data. Continuing with seeding...")
                # Auto-continue for automation
            
            # Seed data
            users = await seed_users(db)
            dealers = await seed_dealers(db)
            products = await seed_products(db)
            orders = await seed_orders(db, users, dealers, products)
            
            # Commit all changes
            await db.commit()
            
            print("\n" + "=" * 70)
            print("✅ SEEDING COMPLETE!")
            print("=" * 70)
            print(f"\n📊 Summary:")
            print(f"  • {len(users)} users created (1 admin, 4 employees)")
            print(f"  • {len(dealers)} dealers created")
            print(f"  • {len(products)} products created")
            print(f"  • {len(orders)} orders created")
            
            # Count low stock products
            low_stock_count = sum(1 for p in products if p.stock_quantity <= p.low_stock_threshold)
            print(f"\n⚠️  {low_stock_count} products are below low stock threshold")
            
            print("\n🔑 Login Credentials:")
            print("  Admin:")
            print("    Email: admin@oms.local")
            print("    Password: Admin@1234")
            print("\n  Employee (any):")
            print("    Email: sarah.johnson@oms.local (or michael.chen, emily.rodriguez, david.kumar)")
            print("    Password: Employee@123")
            
            print("\n🚀 Start the server with: uvicorn app.main:app --reload")
            print("📚 Visit API docs at: http://localhost:8000/api/v1/docs")
            print()
            
        except Exception as e:
            await db.rollback()
            print(f"\n❌ Error during seeding: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
