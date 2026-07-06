# Employee Salary & Commission - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you start using the Employee Salary & Commission feature immediately.

---

## For Admins

### Set Up Employee Compensation

**Step 1:** Go to the Employees page
- Click "Employees" in the sidebar

**Step 2:** Add or edit an employee
- Click "Add Employee" or "Edit" on an existing employee

**Step 3:** Fill in compensation details
- **Base Salary (₹/month):** Enter the fixed monthly salary (e.g., 25000)
- **Commission (%):** Enter the commission percentage (e.g., 1.00)

**Step 4:** Save
- Click "Create Employee" or "Save Changes"

**Done!** The employee's salary is now configured.

### View Employee Compensation

**On the Employees page:**
- Look at the "Compensation" column (desktop view)
- Each employee shows their base salary and commission rate
- Example: "₹25,000/mo" with "1% commission"

---

## For Employees

### View Your Salary

**Step 1:** Go to your Profile
- Click "Profile" in the sidebar

**Step 2:** View "Salary This Month" section
- Appears at the top of the page
- Shows your complete salary breakdown

### Understanding Your Breakdown

```
Base Salary          ₹25,000 / month
Commission Earned    ₹1,439
  3 orders · ₹143,930 · 1% rate
─────────────────────────────────
Total This Month     ₹26,439
```

**What this means:**
- **Base Salary:** Your fixed monthly pay
- **Commission Earned:** Extra money from completed orders
  - Number of orders you completed
  - Total value of those orders
  - Your commission rate
- **Total This Month:** Base + Commission = Your total pay

### View Past Months

**Use the arrow buttons:**
- Click **◄** to see previous month
- Click **►** to see next month (up to current month)
- Month and year shown at top

**Example:** View your January salary while in June

---

## How Commission Works

### The Formula

```
Commission = (Total Order Value) × (Commission Rate) ÷ 100
Total Salary = Base Salary + Commission
```

### Example Calculation

**Your setup:**
- Base Salary: ₹25,000
- Commission Rate: 1%

**This month's orders:**
- You completed 3 orders
- Order 1: ₹50,000
- Order 2: ₹60,000
- Order 3: ₹33,930
- **Total: ₹143,930**

**Your commission:**
- ₹143,930 × 1% = ₹1,439.30

**Your total salary:**
- ₹25,000 + ₹1,439.30 = **₹26,439.30**

### What Counts?

✅ **Orders that COUNT:**
- Status: "Completed"
- Assigned to: You
- Completed date: In the target month

❌ **Orders that DON'T count:**
- Pending orders
- Ongoing orders
- Cancelled orders
- Orders assigned to someone else
- Orders not completed yet

---

## Common Questions

### Q: When is commission calculated?

**A:** Commission is calculated based on when the order was **completed**, not when it was created. If you complete an order on July 5th, it counts toward your July salary.

### Q: Why don't I see any salary?

**A:** Your admin needs to set up your compensation first. Contact your admin to configure your base salary and commission rate.

### Q: Can I see other employees' salaries?

**A:** No, you can only see your own salary. This keeps compensation information private.

### Q: Can I change my own salary?

**A:** No, only your admin can set or change salary and commission rates.

### Q: What if I have no completed orders?

**A:** You'll still receive your base salary! Commission is a bonus on top of your base pay. If you have 0 completed orders, your commission will be ₹0 and your total will equal your base salary.

### Q: Why is my commission different from last month?

**A:** Your commission depends on how many orders you complete and their total value. More orders or higher-value orders = higher commission!

### Q: Can I view future months?

**A:** No, you can only view current and past months. Future salary depends on orders not yet completed.

---

## Tips for Maximizing Commission

1. **Complete orders quickly** - Completed orders count toward your salary
2. **Take on high-value orders** - Larger orders = larger commission
3. **Complete in current month** - Orders completed before month-end count toward that month
4. **Check your progress** - View your salary anytime to see current commission

---

## Visual Guide

### Admin View: Employee List

```
┌─────────────────────────────────────────────────────────────┐
│ Employees                                                    │
├─────────────────────────────────────────────────────────────┤
│ Employee          Phone       Compensation      Status      │
│ Sarah Johnson     +1-555-0101 ₹25,000/mo       Active      │
│ sarah@...                     1% commission                 │
│                                                              │
│ Michael Chen      +1-555-0102 ₹28,000/mo       Active      │
│ michael@...                   1.5% commission               │
└─────────────────────────────────────────────────────────────┘
```

### Employee View: Profile Page

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Salary This Month                         ◄  July 2026 ► │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Base Salary                        ₹25,000.00 / month      │
│                                                              │
│ Commission Earned                            ₹1,439.30      │
│ 3 orders · ₹143,930.00 · 1% rate                           │
│                                                              │
│ ──────────────────────────────────────────────────────      │
│                                                              │
│ Total This Month                             ₹26,439.30     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Need Help?

- **Admin questions:** Contact your system administrator
- **Technical issues:** Refer to SALARY_COMMISSION_FEATURE.md
- **Testing:** See SALARY_VERIFICATION_CHECKLIST.md
- **API docs:** http://localhost:8000/api/v1/docs

---

## Quick Reference

### Login Credentials (Demo)

**Admin:**
- Email: `admin@oms.local`
- Password: `Admin@1234`

**Employee (Sarah):**
- Email: `sarah.johnson@oms.local`
- Password: `Employee@123`

### Demo Salary Setup

| Employee | Base Salary | Commission |
|----------|-------------|------------|
| Sarah Johnson | ₹25,000 | 1.00% |
| Michael Chen | ₹28,000 | 1.50% |
| Emily Rodriguez | ₹30,000 | 2.00% |
| David Kumar | ₹22,000 | 0.75% |

### Key Pages

- **Admin:** http://localhost:3000/employees
- **Employee:** http://localhost:3000/profile

---

**That's it! You're ready to use the Employee Salary & Commission feature. 🎉**
