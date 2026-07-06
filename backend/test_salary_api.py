"""
Quick test script to verify the salary API endpoints.
Run this to ensure the salary feature is working correctly.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def login(email: str, password: str):
    """Login and return access token."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        return data["access_token"], data["user"]
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None, None

def get_employees(token: str):
    """Get employee list as admin."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/employees", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Get employees failed: {response.status_code} - {response.text}")
        return None

def get_salary(token: str, year: int = None, month: int = None):
    """Get salary breakdown as employee."""
    headers = {"Authorization": f"Bearer {token}"}
    params = {}
    if year:
        params["year"] = year
    if month:
        params["month"] = month
    
    response = requests.get(f"{BASE_URL}/profile/me/salary", headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Get salary failed: {response.status_code} - {response.text}")
        return None

def main():
    print("=" * 70)
    print("🧪 TESTING SALARY & COMMISSION API")
    print("=" * 70)
    
    # Test 1: Admin login and view employees
    print("\n📋 Test 1: Admin viewing employee compensation")
    print("-" * 70)
    admin_token, admin_user = login("admin@oms.local", "Admin@1234")
    if admin_token:
        print(f"✓ Logged in as admin: {admin_user['full_name']}")
        
        employees_data = get_employees(admin_token)
        if employees_data:
            print(f"✓ Retrieved {len(employees_data['items'])} employees")
            for emp in employees_data['items']:
                salary_info = f"₹{float(emp['base_salary']):,.2f}/mo" if emp['base_salary'] else "Not set"
                commission_info = f"{emp['commission_percentage']}%" if emp['commission_percentage'] else "Not set"
                print(f"  - {emp['full_name']}: {salary_info}, {commission_info} commission")
    
    # Test 2: Employee login and view salary
    print("\n💰 Test 2: Employee viewing salary breakdown")
    print("-" * 70)
    employee_token, employee_user = login("sarah.johnson@oms.local", "Employee@123")
    if employee_token:
        print(f"✓ Logged in as employee: {employee_user['full_name']}")
        
        now = datetime.now()
        salary_data = get_salary(employee_token, now.year, now.month)
        if salary_data:
            print(f"✓ Retrieved salary for {salary_data['year']}-{salary_data['month']:02d}")
            if salary_data['has_salary_setup']:
                print(f"  Base Salary: ₹{float(salary_data['base_salary']):,.2f}")
                print(f"  Commission Rate: {salary_data['commission_rate']}%")
                print(f"  Completed Orders: {salary_data['completed_orders_count']}")
                print(f"  Orders Value: ₹{float(salary_data['completed_orders_value']):,.2f}")
                print(f"  Commission Earned: ₹{float(salary_data['commission_earned']):,.2f}")
                print(f"  Total Salary: ₹{float(salary_data['total_salary']):,.2f}")
                
                # Verify calculation
                base = float(salary_data['base_salary'])
                rate = float(salary_data['commission_rate'])
                value = float(salary_data['completed_orders_value'])
                commission = (value * rate) / 100
                total = base + commission
                
                if abs(float(salary_data['commission_earned']) - commission) < 0.01:
                    print("  ✓ Commission calculation verified")
                else:
                    print(f"  ✗ Commission mismatch! Expected {commission}, got {salary_data['commission_earned']}")
                
                if abs(float(salary_data['total_salary']) - total) < 0.01:
                    print("  ✓ Total salary calculation verified")
                else:
                    print(f"  ✗ Total mismatch! Expected {total}, got {salary_data['total_salary']}")
            else:
                print("  ⚠ Salary not set up for this employee")
    
    # Test 3: Employee viewing past month
    print("\n📅 Test 3: Employee viewing previous month")
    print("-" * 70)
    if employee_token:
        last_month = now.month - 1 if now.month > 1 else 12
        last_year = now.year if now.month > 1 else now.year - 1
        
        past_salary = get_salary(employee_token, last_year, last_month)
        if past_salary:
            print(f"✓ Retrieved salary for {past_salary['year']}-{past_salary['month']:02d}")
            print(f"  Completed Orders: {past_salary['completed_orders_count']}")
            print(f"  Total Salary: ₹{float(past_salary['total_salary']):,.2f}")
    
    # Test 4: Verify admin cannot access salary endpoint
    print("\n🔒 Test 4: Verify admin cannot view salary")
    print("-" * 70)
    if admin_token:
        salary_data = get_salary(admin_token)
        if salary_data is None:
            print("✓ Admin correctly denied access to salary endpoint")
        else:
            print("✗ Admin should not be able to access salary endpoint!")
    
    print("\n" + "=" * 70)
    print("✅ TESTING COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    main()
