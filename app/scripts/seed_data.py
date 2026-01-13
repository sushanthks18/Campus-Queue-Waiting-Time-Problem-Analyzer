import asyncio
from datetime import datetime, timedelta
import random
from uuid import uuid4
import motor.motor_asyncio
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "campus_queue_analyzer")

# Locations for the dataset
LOCATIONS = ["Canteen", "Admin Office", "Library", "Hostel Office"]

# Generate realistic time ranges for different locations
TIME_RANGES = {
    "Canteen": [(7*60, 9*60), (11*60, 14*60), (17*60, 19*60)],  # Breakfast, lunch, dinner
    "Admin Office": [(9*60, 12*60), (14*60, 17*60)],  # Business hours
    "Library": [(8*60, 12*60), (14*60, 20*60)],  # Academic hours
    "Hostel Office": [(10*60, 12*60), (15*60, 17*60)]  # After classes
}

# Peak and off-peak multipliers for waiting times
PEAK_MULTIPLIER = 1.5
OFF_PEAK_MULTIPLIER = 0.5

def generate_random_time_range(time_ranges):
    """Generate a random time within specified ranges"""
    chosen_range = random.choice(time_ranges)
    start_minute = random.randint(chosen_range[0], chosen_range[1]-10)  # At least 10 min window
    duration = random.randint(5, 60)  # 5 to 60 minute wait
    end_minute = start_minute + duration
    
    # Convert back to 24-hour format
    start_hour = start_minute // 60
    start_min = start_minute % 60
    end_hour = end_minute // 60
    end_min = end_minute % 60
    
    # Handle day overflow
    if end_hour >= 24:
        end_hour -= 24
    
    return f"{start_hour:02d}:{start_min:02d}", f"{end_hour:002d}:{end_min:02d}"

def generate_realistic_waiting_time(location, entry_time):
    """Generate a realistic waiting time based on location and time of day"""
    entry_hour = int(entry_time.split(':')[0])
    
    # Define peak hours for each location
    peak_hours = {
        "Canteen": [12, 13],  # Lunch rush
        "Admin Office": [15, 16],  # End of day rush
        "Library": [12, 13],  # Study time
        "Hostel Office": [16, 17]  # Evening rush
    }
    
    base_wait = random.randint(5, 30)  # Base wait time 5-30 minutes
    
    if entry_hour in peak_hours.get(location, []):
        # Peak time - longer wait
        wait_time = min(base_wait * PEAK_MULTIPLIER, 120)  # Max 2 hours
    elif entry_hour in [14, 19]:  # Generally quieter times
        # Off-peak - shorter wait
        wait_time = max(base_wait * OFF_PEAK_MULTIPLIER, 2)  # Min 2 minutes
    else:
        # Regular time
        wait_time = base_wait
    
    return int(wait_time)

async def seed_database():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing data
    await db.users.delete_many({})
    await db.queue_entries.delete_many({})
    
    # Create demo users
    print("Creating demo users...")
    
    # Hash passwords
    student_password_hash = bcrypt.hashpw("student123".encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
    admin_password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
    
    # Insert demo users
    users = [
        {
            "id": str(uuid4()),
            "email": "student@college.edu",
            "password": student_password_hash,
            "name": "Demo Student",
            "role": "student",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid4()),
            "email": "admin@college.edu",
            "password": admin_password_hash,
            "name": "Demo Admin",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    # Get user IDs for reference
    student_user = await db.users.find_one({"email": "student@college.edu"})
    admin_user = await db.users.find_one({"email": "admin@college.edu"})
    
    # Generate sample queue entries
    print("Generating sample queue entries...")
    
    queue_entries = []
    
    # Generate entries for the last 7 days
    start_date = datetime.now() - timedelta(days=7)
    
    for day_offset in range(7):
        current_date = start_date + timedelta(days=day_offset)
        
        for _ in range(random.randint(20, 30)):  # 20-30 entries per day
            location = random.choice(LOCATIONS)
            
            # Generate entry time based on location operating hours
            entry_time, completion_time = generate_random_time_range(TIME_RANGES[location])
            
            # Calculate realistic waiting time
            wait_minutes = generate_realistic_waiting_time(location, entry_time)
            
            # Calculate completion time based on wait
            entry_hour, entry_min = map(int, entry_time.split(':'))
            total_entry_minutes = entry_hour * 60 + entry_min
            total_completion_minutes = total_entry_minutes + wait_minutes
            
            completion_hour = (total_completion_minutes // 60) % 24
            completion_min = total_completion_minutes % 60
            
            completion_time = f"{completion_hour:02d}:{completion_min:02d}"
            
            # Randomly assign to either student or admin
            user_id = random.choice([student_user["id"], admin_user["id"]])
            
            entry = {
                "id": str(uuid4()),
                "location": location,
                "entry_time": entry_time,
                "completion_time": completion_time,
                "date": current_date.strftime("%Y-%m-%d"),
                "waiting_time_minutes": wait_minutes,
                "user_id": user_id,
                "created_at": datetime.utcnow()
            }
            
            queue_entries.append(entry)
    
    # Insert queue entries
    await db.queue_entries.insert_many(queue_entries)
    print(f"Created {len(queue_entries)} queue entries")
    
    print("\nSeed data created successfully!")
    print(f"\nDemo Credentials:")
    print(f"Student: student@college.edu / student123")
    print(f"Admin: admin@college.edu / admin123")
    
    # Print some statistics
    print(f"\nSample Analytics:")
    for location in LOCATIONS:
        entries = [e for e in queue_entries if e["location"] == location]
        if entries:
            avg_wait = sum(e["waiting_time_minutes"] for e in entries) / len(entries)
            print(f"- {location}: {len(entries)} entries, avg {avg_wait:.1f} min wait")

if __name__ == "__main__":
    asyncio.run(seed_database())
