# Employee Salary & Commission - Manual Verification Checklist

Use this checklist to manually verify the feature is working correctly in the browser.

## Prerequisites

- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ Database seeded with demo data
- ✅ Migration applied successfully

## Test Credentials

**Admin:**
- Email: `admin@oms.local`
- Password: `Admin@1234`

**Employees (any of these):**
- Email: `sarah.johnson@oms.local` | Password: `Employee@123`
- Email: `michael.chen@oms.local` | Password: `Employee@123`
- Email: `emily.rodriguez@oms.local` | Password: `Employee@123`
- Email: `david.kumar@oms.local` | Password: `Employee@123`

---

## 🔧 ADMIN TESTS

### Test 1: View Employee List with Salaries

1. [ ] Open http://localhost:3000
2. [ ] Login as admin (admin@oms.local / Admin@1234)
3. [ ] Click "Employees" in sidebar
4. [ ] Verify "Compensation" column appears (desktop view)
5. [ ] Verify each employee shows:
   - Base salary: ₹XX,XXX/mo
   - Commission percentage
6. [ ] Expected values:
   - Sarah Johnson: ₹25,000/mo, 1% commission
   - Michael Chen: ₹28,000/mo, 1.5% commission
   - Emily Rodriguez: ₹30,000/mo, 2% commission
   - David Kumar: ₹22,000/mo, 0.75% commission

**✓ Pass if:** All employees show correct salary information

---

### Test 2: Create New Employee with Salary

1. [ ] On Employees page, click "Add Employee"
2. [ ] Fill in:
   - Full Name: "Test Employee"
   - Email: "test.employee@oms.local"
   - Phone: "+1-555-9999"
   - Base Salary: 35000
   - Commission: 2.5
   - Password: Employee@123
3. [ ] Click "Create Employee"
4. [ ] Verify success toast appears
5. [ ] Verify new employee appears in list with salary info

**✓ Pass if:** Employee created with salary visible in list

---

### Test 3: Edit Employee Salary

1. [ ] Click "Edit" on Sarah Johnson
2. [ ] Change Base Salary to: 30000
3. [ ] Change Commission to: 1.5
4. [ ] Click "Save Changes"
5. [ ] Verify success toast
6. [ ] Verify updated salary shows in list

**✓ Pass if:** Salary updates successfully and displays correctly

---

### Test 4: Mobile View (Admin)

1. [ ] Resize browser to mobile width (or use DevTools mobile view)
2. [ ] Open sidebar hamburger menu
3. [ ] Navigate to Employees
4. [ ] Verify employee cards show salary information
5. [ ] Verify salary appears below contact info

**✓ Pass if:** Salary visible in mobile cards

---

### Test 5: Dark Mode (Admin)

1. [ ] Toggle dark mode using theme switcher
2. [ ] Verify Employees page renders correctly
3. [ ] Verify salary text is readable
4. [ ] Verify compensation column has proper contrast

**✓ Pass if:** Dark mode works with no visual issues

---

## 👤 EMPLOYEE TESTS

### Test 6: View Own Salary Breakdown

1. [ ] Logout from admin account
2. [ ] Login as employee (sarah.johnson@oms.local / Employee@123)
3. [ ] Click "Profile" in sidebar
4. [ ] Verify "Salary This Month" section appears at top
5. [ ] Verify breakdown shows:
   - Base Salary: ₹25,000.00 / month (or updated value)
   - Commission Earned: ₹X,XXX with order details
   - Total This Month: ₹XX,XXX
6. [ ] Verify order details show:
   - "X orders · ₹XX,XXX · Y% rate"

**✓ Pass if:** Salary section displays with correct values

---

### Test 7: Navigate to Previous Month

1. [ ] On Profile page with salary section visible
2. [ ] Click the "◄" (left arrow) button
3. [ ] Verify month label updates to previous month
4. [ ] Verify salary data changes for that month
5. [ ] Verify completed orders count may be different

**✓ Pass if:** Previous month data loads correctly

---

### Test 8: Navigate to Next Month

1. [ ] Click "◄" a few times to go back several months
2. [ ] Click "►" (right arrow) to move forward
3. [ ] Verify month advances by 1 month
4. [ ] Try clicking "►" when at current month
5. [ ] Verify button is disabled (can't go to future)

**✓ Pass if:** Can navigate backward but not into future

---

### Test 9: Manual Calculation Verification

1. [ ] On Profile page, note the values:
   - Base Salary: ₹X
   - Commission Rate: Y%
   - Orders Value: ₹Z
   - Commission Earned: ₹W
   - Total: ₹T
2. [ ] Calculate manually:
   - Commission = (Z × Y) ÷ 100
   - Total = X + Commission
3. [ ] Compare with displayed values

**✓ Pass if:** Manual calculation matches displayed values

---

### Test 10: Employee with No Salary Setup

1. [ ] Logout
2. [ ] Login as admin
3. [ ] Create new employee WITHOUT salary fields
4. [ ] Logout and login as that new employee
5. [ ] Go to Profile
6. [ ] Verify message: "Your compensation details haven't been set up yet. Contact your admin."
7. [ ] Verify no salary numbers are shown

**✓ Pass if:** "Not Set Up" message displays correctly

---

### Test 11: Employee with No Completed Orders

1. [ ] Login as employee who has 0 completed orders this month
2. [ ] Go to Profile
3. [ ] Verify shows:
   - Base Salary (correct)
   - 0 orders · ₹0 · X% rate
   - Commission Earned: ₹0
   - Total: Base Salary only
4. [ ] Verify message: "No completed orders this month. Complete orders to earn commission!"

**✓ Pass if:** Zero-order state displays correctly

---

### Test 12: Mobile View (Employee)

1. [ ] Login as employee (if not already)
2. [ ] Resize browser to mobile width
3. [ ] Go to Profile
4. [ ] Verify Salary section is responsive
5. [ ] Verify month navigation buttons work
6. [ ] Verify all text is readable

**✓ Pass if:** Mobile layout works correctly

---

### Test 13: Dark Mode (Employee)

1. [ ] Toggle dark mode
2. [ ] Go to Profile
3. [ ] Verify Salary section renders correctly
4. [ ] Verify all text has proper contrast
5. [ ] Verify icons are visible
6. [ ] Toggle back to light mode
7. [ ] Verify still works

**✓ Pass if:** Dark mode has no visual issues

---

### Test 14: Profile Form Still Works

1. [ ] On Profile page (below salary section)
2. [ ] Update your name or phone number
3. [ ] Click "Save Changes"
4. [ ] Verify success toast
5. [ ] Verify Salary section is unaffected

**✓ Pass if:** Profile form works independently of salary section

---

## 🔒 SECURITY TESTS

### Test 15: Employee Cannot See Other Employee Salaries

1. [ ] Login as Sarah Johnson
2. [ ] Go to Profile
3. [ ] Note your salary values
4. [ ] Logout and login as Michael Chen
5. [ ] Go to Profile
6. [ ] Verify salary values are DIFFERENT (Michael's, not Sarah's)

**✓ Pass if:** Each employee sees only their own salary

---

### Test 16: Admin Cannot Access Salary Endpoint

1. [ ] Login as admin
2. [ ] Go to Profile
3. [ ] Verify NO "Salary This Month" section appears
4. [ ] Only profile form and password change should appear

**✓ Pass if:** Admin does not see salary section

---

### Test 17: Direct API Access Blocked for Admin

**This is automatically verified by backend but you can test with DevTools:**

1. [ ] Login as admin
2. [ ] Open browser DevTools (F12)
3. [ ] Go to Console
4. [ ] Run: `fetch('/api/v1/profile/me/salary', {headers: {Authorization: 'Bearer ' + document.cookie.match(/access_token=([^;]+)/)[1]}}).then(r => r.json()).then(console.log)`
5. [ ] Verify response is 403 Forbidden

**✓ Pass if:** API returns 403 for admin

---

## 📊 CALCULATION ACCURACY

### Test 18: Verify Commission Formula

**Example Test Case:**
- Base: ₹25,000
- Rate: 1%
- Orders: 3 completed orders totaling ₹143,930
- Expected Commission: ₹1,439.30
- Expected Total: ₹26,439.30

1. [ ] Login as employee with known completed orders
2. [ ] View salary for current month
3. [ ] Note: base, rate, orders value, commission, total
4. [ ] Calculate: commission = (orders_value × rate) ÷ 100
5. [ ] Calculate: total = base + commission
6. [ ] Compare with displayed values

**✓ Pass if:** Calculation is accurate to 2 decimal places

---

## 🐛 ERROR HANDLING

### Test 19: Backend Down

1. [ ] Stop the backend server (CTRL+C in backend terminal)
2. [ ] Go to Profile page as employee
3. [ ] Verify error message appears
4. [ ] Verify "Retry" button appears
5. [ ] Restart backend
6. [ ] Click "Retry"
7. [ ] Verify salary loads successfully

**✓ Pass if:** Error handled gracefully with retry option

---

### Test 20: Network Delay

1. [ ] Open DevTools > Network tab
2. [ ] Throttle connection to "Slow 3G"
3. [ ] Go to Profile page
4. [ ] Verify loading spinner appears
5. [ ] Verify salary loads (slowly)
6. [ ] Reset throttling

**✓ Pass if:** Loading state shows during slow connection

---

## ✅ FINAL CHECKLIST

Mark each section when all tests pass:

- [ ] Admin Tests (Tests 1-5): All passed
- [ ] Employee Tests (Tests 6-14): All passed
- [ ] Security Tests (Tests 15-17): All passed
- [ ] Calculation Tests (Test 18): Passed
- [ ] Error Handling Tests (Tests 19-20): All passed

## 📸 Screenshots (Optional)

Take screenshots of:
1. Admin employee list with compensation column
2. Employee profile with salary section (light mode)
3. Employee profile with salary section (dark mode)
4. Mobile view of employee list
5. Mobile view of salary section

Save to: `SALARY_FEATURE_SCREENSHOTS/`

---

## 🎯 ACCEPTANCE CRITERIA

✅ Admin can set base salary and commission for any employee
✅ Admin can view employee salaries in employee list
✅ Employee can view their own salary breakdown
✅ Employee can navigate past months
✅ Commission calculated from completed orders only
✅ Calculation is accurate and live
✅ "Not set up" message when salary not configured
✅ Employees cannot see other employees' salaries
✅ Admin cannot access salary breakdown endpoint
✅ Works in dark and light mode
✅ Works on mobile and desktop
✅ Loading and error states work correctly

---

## 📝 Notes

- All tests should pass for feature to be considered complete
- If any test fails, note the failure and investigate
- Refer to SALARY_COMMISSION_FEATURE.md for detailed documentation
- Backend API tests already passed (see SALARY_FEATURE_SUMMARY.md)

## 🚀 Post-Verification

Once all tests pass:
1. [ ] Mark feature as complete
2. [ ] Update project README if needed
3. [ ] Commit all changes
4. [ ] Create pull request or deploy
5. [ ] Notify stakeholders

---

**Tester:** ___________________  
**Date:** ___________________  
**Result:** ☐ All Passed  ☐ Some Failed (see notes)  
**Notes:** ___________________
