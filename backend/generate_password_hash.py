"""
Quick script to generate password hash for manual database update.
Run: python generate_password_hash.py
"""

from app.core.security import get_password_hash

# Enter your desired password here
password = input("Enter the password you want to use: ")

hashed = get_password_hash(password)

print("\n" + "="*60)
print("PASSWORD HASH GENERATED")
print("="*60)
print(f"\nOriginal Password: {password}")
print(f"\nHashed Password:\n{hashed}")
print("\n" + "="*60)
print("\nCopy the hashed password above and use it in the SQL UPDATE command.")
print("="*60)
