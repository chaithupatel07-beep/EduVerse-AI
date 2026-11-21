import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import init_db
from app.scripts.seed_phase1 import seed_initial_data


async def main():
    print("Initializing Database...")
    await init_db()
    print("Seeding Initial Phase 1 Data...")
    await seed_initial_data()
    print("Phase 1 Seeding Complete!")


if __name__ == "__main__":
    asyncio.run(main())
