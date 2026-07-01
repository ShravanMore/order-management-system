# Physiotherapy Equipment Order Management System - Backend API

A comprehensive REST API for managing physiotherapy equipment orders, built with FastAPI, PostgreSQL, and SQLAlchemy.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- PostgreSQL 15+
- pip (Python package manager)

### Installation

1. **Clone the repository**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run database migrations**
```bash
alembic upgrade head
```

6. **Seed demo data**
```bash
python -m app.scripts.seed_demo_data
```

7. **Start the server**
```bash
uvicorn app.main:app --reload
```

8. **Access API documentation**
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

---

## 📚 Documentation

- **[API Reference](API_REFERENCE.md)** - Complete endpoint documentation
- **[Orders API](ORDERS_API.md)** - Detailed order management guide
- **[Additional APIs](ADDITIONAL_APIS.md)** - Employee, Dashboard, Profile endpoints
- **[Testing Guide](API_TESTING_GUIDE.md)** - Manual testing instructions
- **[Verification Report](STEP7_VERIFICATION_REPORT.md)** - Implementation checklist

---

## 🔑 Demo Credentials

After running the seed script:

**Admin Account:**
- Email: `admin@oms.local`
- Password: `Admin@1234`

**Employee Account:**
- Email: `sarah.johnson@oms.local`
- Password: `Employee@123`

(Or use: michael.chen, emily.rodriguez, david.kumar with same password)

---

## 📊 System Overview

### Tech Stack
- **Framework**: FastAPI 0.138+
- **Database**: PostgreSQL with asyncpg
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Auth**: JWT (access + refresh tokens)
- **Password Hashing**: bcrypt

### Architecture
```
backend/
├── app/
│   ├── api/v1/endpoints/     # REST API routes
│   ├── core/                 # Config, security, dependencies
│   ├── db/                   # Database session management
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic validation schemas
│   ├── services/             # Business logic layer
│   └── scripts/              # Utility scripts
├── alembic/                  # Database migrations
└── requirements.txt          # Python dependencies
```

---

## 🎯 Features

### Core Functionality
- ✅ **Authentication**: JWT-based auth with refresh tokens
- ✅ **User Management**: Admin and employee roles
- ✅ **Dealer Management**: Full CRUD with soft delete
- ✅ **Product Management**: Inventory with stock tracking
- ✅ **Order Management**: Complete order lifecycle
- ✅ **Employee Management**: User administration
- ✅ **Dashboard Analytics**: Business intelligence
- ✅ **Profile Management**: Self-service user profiles

### Key Features
- 🔒 Role-based access control (Admin/Employee)
- 📦 Automatic stock management
- 📋 Order status workflow validation
- 🔄 Transaction-safe operations
- 📊 Real-time analytics and reporting
- 🔍 Advanced filtering and search
- 📄 Pagination on all list endpoints
- 🗂️ Soft deletes for data integrity
- ⏰ Automatic timestamp tracking
- 🔐 Secure password handling

---

## 📡 API Endpoints

### Authentication (4 endpoints)
```
POST   /api/v1/auth/login       # Login with credentials
POST   /api/v1/auth/refresh     # Refresh access token
GET    /api/v1/auth/me          # Get current user
POST   /api/v1/auth/logout      # Revoke refresh token
```

### Dealers (5 endpoints)
```
GET    /api/v1/dealers          # List dealers (paginated)
GET    /api/v1/dealers/{id}     # Get dealer details
POST   /api/v1/dealers          # Create dealer (admin)
PUT    /api/v1/dealers/{id}     # Update dealer (admin)
DELETE /api/v1/dealers/{id}     # Deactivate dealer (admin)
```

### Products (6 endpoints)
```
GET    /api/v1/products            # List products (paginated, filterable)
GET    /api/v1/products/{id}       # Get product details
POST   /api/v1/products            # Create product (admin)
PUT    /api/v1/products/{id}       # Update product (admin)
PATCH  /api/v1/products/{id}/stock # Adjust stock (admin)
DELETE /api/v1/products/{id}       # Deactivate product (admin)
```

### Orders (6 endpoints)
```
GET    /api/v1/orders             # List orders (paginated, filterable)
GET    /api/v1/orders/{id}        # Get order details with items
POST   /api/v1/orders             # Create order (admin)
PUT    /api/v1/orders/{id}        # Update order (admin)
PATCH  /api/v1/orders/{id}/status # Update status (admin & employee)
DELETE /api/v1/orders/{id}        # Delete pending order (admin)
```

### Employees (6 endpoints)
```
GET    /api/v1/employees               # List employees (admin)
GET    /api/v1/employees/{id}          # Get employee (admin)
POST   /api/v1/employees               # Create employee (admin)
PUT    /api/v1/employees/{id}          # Update employee (admin)
DELETE /api/v1/employees/{id}          # Deactivate employee (admin)
GET    /api/v1/employees/{id}/workload # Get workload stats (admin)
```

### Dashboard (5 endpoints)
```
GET    /api/v1/dashboard/summary        # Overall statistics (admin)
GET    /api/v1/dashboard/orders-trend   # Time-series data (admin)
GET    /api/v1/dashboard/top-products   # Best sellers (admin)
GET    /api/v1/dashboard/top-dealers    # Top dealers (admin)
GET    /api/v1/dashboard/recent-orders  # Latest orders (admin)
```

### Profile (3 endpoints)
```
GET    /api/v1/profile/me          # Get own profile
PUT    /api/v1/profile/me          # Update own profile
PUT    /api/v1/profile/me/password # Change password
```

**Total: 35 REST Endpoints**

---

## 🗄️ Database Schema

### Core Tables
- **users** - Admin and employee accounts
- **dealers** - Customer/dealer information
- **products** - Product catalog with inventory
- **orders** - Order headers
- **order_items** - Order line items
- **order_status_logs** - Audit trail for status changes

### Key Relationships
- Users ↔ Orders (created_by, assigned_to)
- Dealers ↔ Orders (one-to-many)
- Products ↔ Order Items (one-to-many)
- Orders ↔ Order Items (one-to-many)
- Orders ↔ Status Logs (one-to-many)

---

## 🔐 Security Features

- **JWT Authentication**: Access and refresh tokens
- **Password Hashing**: bcrypt with salt
- **Role-Based Access**: Admin vs Employee permissions
- **Token Revocation**: Denylist for logout
- **Soft Deletes**: Preserve referential integrity
- **Input Validation**: Pydantic schemas
- **CORS Protection**: Configurable origins
- **SQL Injection Prevention**: Parameterized queries

---

## 📋 Business Rules

### Order Management
- Orders start in `pending` status
- Status transitions: pending → ongoing → completed
- Orders can be cancelled from pending/ongoing
- Completed and cancelled are terminal states
- Stock deducted on order creation
- Stock restored on order deletion (pending only)
- Order number format: `ORD-YYYY-####`

### Stock Management
- Automatic deduction on order creation
- Validation prevents negative stock
- Low stock threshold tracking
- Stock adjustments logged

### Access Control
- Admins have full system access
- Employees can view and update assigned orders
- Employees cannot create/delete resources
- Users can only modify their own profiles

---

## 🧪 Testing

### Manual Testing
1. Start server: `uvicorn app.main:app --reload`
2. Open Swagger UI: http://localhost:8000/api/v1/docs
3. Follow testing guide: [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)

### Critical Test Scenarios
- ✅ Login returns valid JWT tokens
- ✅ Pagination works on all list endpoints
- ✅ Order creation deducts stock correctly
- ✅ Invalid status transitions rejected with clear errors
- ✅ Employee access restrictions enforced
- ✅ Dashboard analytics accurate

---

## 🔧 Development

### Code Structure
```
app/
├── api/v1/endpoints/   # FastAPI route handlers
│   ├── auth.py         # Authentication
│   ├── dealers.py      # Dealer management
│   ├── products.py     # Product management
│   ├── orders.py       # Order management
│   ├── employees.py    # Employee management
│   ├── dashboard.py    # Analytics
│   └── profile.py      # User profiles
├── core/               # Core functionality
│   ├── config.py       # Settings
│   ├── security.py     # Auth helpers
│   ├── deps.py         # Dependencies
│   └── denylist.py     # Token revocation
├── db/                 # Database
│   ├── base.py         # Base model
│   └── session.py      # Session management
├── models/             # SQLAlchemy models
│   ├── user.py
│   ├── dealer.py
│   ├── product.py
│   └── order.py
├── schemas/            # Pydantic schemas
│   ├── auth.py
│   ├── dealer.py
│   ├── product.py
│   ├── order.py
│   ├── employee.py
│   ├── dashboard.py
│   └── profile.py
└── services/           # Business logic
    ├── dealer_service.py
    ├── product_service.py
    ├── order_service.py
    ├── employee_service.py
    └── dashboard_service.py
```

### Adding New Features
1. Create model in `models/`
2. Create schema in `schemas/`
3. Create service in `services/`
4. Create endpoint in `api/v1/endpoints/`
5. Register router in `api/v1/router.py`
6. Create migration: `alembic revision --autogenerate -m "description"`
7. Apply migration: `alembic upgrade head`

---

## 📦 Dependencies

### Core
- `fastapi>=0.115.0` - Web framework
- `uvicorn[standard]>=0.30.0` - ASGI server
- `pydantic[email]>=2.9.0` - Data validation
- `sqlalchemy[asyncio]>=2.0.0` - ORM
- `asyncpg>=0.29.0` - PostgreSQL driver
- `alembic>=1.13.0` - Database migrations

### Security
- `pyjwt>=2.8.0` - JWT tokens
- `bcrypt>=4.0.0` - Password hashing

### Configuration
- `pydantic-settings>=2.3.0` - Settings management
- `python-multipart>=0.0.9` - Form data parsing

---

## 🌐 Production Deployment

### Environment Variables
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["https://yourdomain.com"]
```

### Recommendations
1. Use proper secret key (not `dev_secret_key`)
2. Enable HTTPS only
3. Configure CORS for production domain
4. Use Redis for token denylist (multi-instance support)
5. Set up connection pooling
6. Enable database query logging
7. Implement rate limiting
8. Add monitoring (Prometheus/Grafana)
9. Set up backup strategy
10. Use environment-specific configs

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Use different port
uvicorn app.main:app --port 8001
```

### Database connection failed
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Test connection: `psql -U postgres -d oms_db`

### Migration errors
```bash
# Reset migrations (caution: data loss)
alembic downgrade base
alembic upgrade head

# Or create new migration
alembic revision --autogenerate -m "fix"
```

---

## 📝 License

[Your License Here]

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📞 Support

For issues and questions:
- Check documentation in `/backend/` directory
- Review API docs at `/api/v1/docs`
- See testing guide: `API_TESTING_GUIDE.md`

---

**Built with ❤️ using FastAPI**
