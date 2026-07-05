"""Quick script to clear demo data - auto-confirms"""
import asyncio
from app.scripts.clear_demo_data import clear_demo_data
from app.db.session import engine

async def main():
    print("\n🧹 Clearing demo data...\n")
    await clear_demo_data()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
