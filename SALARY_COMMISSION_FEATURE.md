# Employee Salary & Commission Feature

## Overview

The Employee Salary & Commission feature allows the admin to set up monthly base salaries and commission rates for employees. Employees earn a commission as a percentage of the total value of all orders they complete each month. The feature provides a clean, real-time salary breakdown that employees can view in their profile.

## Feature Components

### 1. Database Changes

**New Columns in `users` table:**
- `base_salary` (Numeric(12,2), nullable): Monthly base salary in ₹
- `commission_percentage` (Numeric(5,2), nullable): Commission % on completed orders (default: 1.00)

**Migration:** `b413b95d4fcc_add_employee_salary_commission.py`

### 2. Backend Implementation

#### Models (`app/models/user.py`)
- Added `base_salary` and `commission_percentage` fields to `User` model

#### Schemas (`app/schemas/employee.py`)
- Updated `EmployeeBase`, `EmployeeCreate`, `EmployeeUpdate` to include salary fields
- Added `SalaryBreakdownResponse` schema with fields:
  - `year`, `month`: Target month
  - `base_salary`: Fixed monthly salary
  - `commission_rate`: Commission percentage
  - `completed_orders_count`: Number of completed orders
  - `completed_orders_value`: Total value of completed orders
  - `commission_earned`: Calculated commission
  - `total_salary`: Base + Commission
  - `has_salary_setup`: Whether compensation is configured

#### Services (`app/services/employee_service.py`)
- Added `calculate_salary_for_month()` function:
  - Queries orders with `status = 'completed'` and `assigned_to_id = employee_id`
  - Filters by `completed_at` date (year/month)
  - Calculates commission: `(total_order_value × commission_rate) / 100`
  - Returns breakdown including base salary + commission

#### API Endpoints (`app/api/v1/endpoints/`)

**Admin Endpoints (`employees.py`):**
- `POST /employees` - Create employee with salary fields
- `PUT /employees/{id}` - Update employee including salary fields
- `GET /employees` - List employees (shows salary in response)
- `GET /employees/{id}` - Get employee details

**Employee Endpoints (`profile.py`):**
- `GET /profile/me/salary` - Get salary breakdown for authenticated employee
  - Query params: `year` (optional), `month` (optional)
  - Defaults to current month
  - Only accessible by employees (403 for admins)
  - Returns live calculated data from order records

### 3. Frontend Implementation

#### Types (`frontend/types/index.ts`)
- Updated `Employee` interface with `base_salary`, `commission_percentage`
- Added `SalaryBreakdown` interface

#### Admin Features

**Employee Form Dialog (`components/employees/employee-form-dialog.tsx`):**
- Added "Base Salary (₹/month)" input field
- Added "Commission (%)" input field with helper text
- Fields appear in both create and edit modes
- Validates numeric input
- Default commission: 1.00% for new employees

**Employee List (`app/(admin)/employees/page.tsx`):**
- Added "Compensation" column showing:
  - Base salary: ₹XX,XXX/mo
  - Commission percentage
  - "Not set" if salary not configured
- Mobile cards also show compensation info
- Column visible on desktop only (lg breakpoint)

#### Employee Features

**Salary Section Component (`components/profile/salary-section.tsx`):**
- Displays salary breakdown for current/past months
- Month navigation controls (previous/next)
- Cannot navigate to future months
- Shows:
  - Base Salary with "/ month" label
  - Commission Earned with order details:
    - "X orders · ₹XX,XXX · Y% rate"
  - Total This Month (bold, large)
- "Not Set Up" state if `has_salary_setup = false`:
  - Friendly message: "Your compensation details haven't been set up yet. Contact your admin."
- "No Completed Orders" state if no orders this month
- Currency formatting: ₹XX,XXX.XX (Indian format)
- Loading and error states
- Works in dark/light mode
- Responsive design

**Profile Page (`app/(employee)/profile/page.tsx`):**
- Shows `SalarySection` component at top (employees only)
- Profile form below (all users)

## Business Logic

### Commission Calculation Rules

1. **Only completed orders count**: Orders must have `status = 'completed'`
2. **Date based on completion**: Uses `completed_at` timestamp, not `order_date`
3. **Assigned to employee**: Only orders where `assigned_to_id = employee_id`
4. **Monthly calculation**: Filters by year and month of `completed_at`
5. **Live calculation**: Always computed from real order data, never cached
6. **Formula**: `commission = (sum of order.total_amount) × (commission_percentage / 100)`
7. **Total salary**: `base_salary + commission`

### Access Control

- **Admin can:**
  - Set/update salary and commission for any employee
  - View all employee salary settings in employee list
  - Cannot view their own salary breakdown (admin role restriction)

- **Employee can:**
  - View only their own salary breakdown
  - Browse current and past months
  - Cannot see other employees' salaries
  - Cannot modify their own salary settings

## Seed Data

Demo employees are created with the following compensation:

| Employee | Base Salary | Commission % |
|----------|-------------|--------------|
| Sarah Johnson | ₹25,000 | 1.00% |
| Michael Chen | ₹28,000 | 1.50% |
| Emily Rodriguez | ₹30,000 | 2.00% |
| David Kumar | ₹22,000 | 0.75% |

## Testing Checklist

### Admin Tests
- [x] Create employee with salary fields
- [x] Edit employee salary fields
- [x] View salary in employee list table
- [x] View salary in mobile cards
- [x] Leave salary blank (optional fields)
- [x] Validate numeric input for salary fields

### Employee Tests
- [x] View salary breakdown for current month
- [x] Navigate to previous months
- [x] Cannot navigate to future months
- [x] See "Not Set Up" message when salary not configured
- [x] See "No Completed Orders" when no orders this month
- [x] Verify commission calculation matches manual calculation
- [x] Ensure only own salary is visible (403 for other employees)
- [x] Dark mode appearance
- [x] Mobile responsive layout

### Calculation Verification
1. Log in as admin
2. Create/edit employee with base salary ₹25,000 and 1% commission
3. Complete an order assigned to that employee worth ₹100,000
4. Log in as that employee
5. View profile salary section
6. Verify: Base = ₹25,000, Commission = ₹1,000, Total = ₹26,000

## API Examples

### Get Salary Breakdown (Employee)

**Request:**
```http
GET /api/v1/profile/me/salary?year=2026&month=7
Authorization: Bearer <employee_token>
```

**Response:**
```json
{
  "year": 2026,
  "month": 7,
  "base_salary": "25000.00",
  "commission_rate": "1.00",
  "completed_orders_count": 5,
  "completed_orders_value": "100000.00",
  "commission_earned": "1000.00",
  "total_salary": "26000.00",
  "has_salary_setup": true
}
```

### Update Employee with Salary (Admin)

**Request:**
```http
PUT /api/v1/employees/2
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "full_name": "Sarah Johnson",
  "email": "sarah.johnson@oms.local",
  "phone": "+1-555-0101",
  "base_salary": 30000,
  "commission_percentage": 1.5
}
```

**Response:**
```json
{
  "id": 2,
  "full_name": "Sarah Johnson",
  "email": "sarah.johnson@oms.local",
  "phone": "+1-555-0101",
  "avatar_url": null,
  "is_active": true,
  "base_salary": "30000.00",
  "commission_percentage": "1.50",
  "created_at": "2026-07-06T12:00:00Z",
  "updated_at": "2026-07-06T13:00:00Z"
}
```

## UI Screenshots Locations

- Admin Employee List: `/employees` (admin)
- Admin Employee Form: Click "Add Employee" or "Edit" on employee row
- Employee Salary Section: `/profile` (employee)

## Known Limitations

1. **No historical salary tracking**: If admin changes salary/commission, past calculations use current values
2. **No payroll history**: Salaries are calculated on-demand, not stored as payroll records
3. **Calendar month only**: Cannot query by custom date ranges
4. **No currency conversion**: All amounts in ₹ (Indian Rupees)
5. **Admin cannot see own salary**: Feature designed for employees only

## Future Enhancements (Not Implemented)

- Salary history tracking (audit log of changes)
- Payroll report generation
- CSV export of monthly salaries
- Bonus/deduction support
- Multiple currency support
- Custom date range queries
- Salary notifications
- Performance-based commission tiers

## Files Modified/Created

### Backend
- `backend/app/models/user.py` - Added salary fields
- `backend/alembic/versions/b413b95d4fcc_*.py` - Migration
- `backend/app/schemas/employee.py` - Updated schemas
- `backend/app/services/employee_service.py` - Salary calculation
- `backend/app/api/v1/endpoints/profile.py` - Salary endpoint
- `backend/app/scripts/seed_demo_data.py` - Seed with salaries

### Frontend
- `frontend/types/index.ts` - Added types
- `frontend/components/employees/employee-form-dialog.tsx` - Form fields
- `frontend/app/(admin)/employees/page.tsx` - List columns
- `frontend/components/profile/salary-section.tsx` - NEW component
- `frontend/app/(employee)/profile/page.tsx` - Added salary section

## Dependencies

No new dependencies added. Feature uses existing libraries:
- Backend: SQLAlchemy, FastAPI, Pydantic
- Frontend: React, TanStack Query, Zod, Tailwind CSS

## Database Migration

To apply the migration:
```bash
cd backend
.venv\Scripts\python.exe -m alembic upgrade head
```

To rollback:
```bash
.venv\Scripts\python.exe -m alembic downgrade -1
```

## Running the Feature

1. **Backend:** Already running on http://localhost:8000
2. **Frontend:** Already running on http://localhost:3000
3. **Test credentials:**
   - Admin: admin@oms.local / Admin@1234
   - Employee: sarah.johnson@oms.local / Employee@123

## Support

For issues or questions about this feature, refer to:
- API documentation: http://localhost:8000/api/v1/docs
- This documentation file
- Project README.md
