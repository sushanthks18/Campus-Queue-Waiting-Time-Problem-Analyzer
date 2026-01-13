from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import motor.motor_asyncio
from bson import ObjectId
import os
from datetime import datetime, timedelta
import jwt
import bcrypt
from dotenv import load_dotenv
import re
from uuid import uuid4
import json

load_dotenv()

app = FastAPI(title="Campus Queue & Waiting-Time Analyzer API")

# Add CORS middleware - FIXED: Removed duplicate allow_credentials
# Allow only local frontend origins when credentials/authorization are used.
# Browsers block responses that set Access-Control-Allow-Credentials: true together
# with Access-Control-Allow-Origin: * — so specify exact origins used in development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "campus_queue_analyzer")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT setup
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60  # 7 days

# Utility functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        # PyJWT raises PyJWTError (>= v2.x) for decode errors; map to 401
        raise HTTPException(status_code=401, detail="Invalid token")

def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def parse_time_to_minutes(time_str: str) -> int:
    try:
        h, m = map(int, time_str.split(':'))
        if h < 0 or h > 23 or m < 0 or m > 59:
            return None
        return h * 60 + m
    except:
        return None

def calculate_waiting_time(entry_time: str, completion_time: str) -> int:
    entry_minutes = parse_time_to_minutes(entry_time)
    completion_minutes = parse_time_to_minutes(completion_time)
    
    if entry_minutes is None or completion_minutes is None:
        return 0  # Return 0 for invalid times
    
    if completion_minutes <= entry_minutes:
        completion_minutes += 24 * 60  # Add 24 hours if next day
    
    waiting_time = completion_minutes - entry_minutes
    
    if waiting_time > 8 * 60:  # More than 8 hours
        return 0  # Invalid time
    
    return waiting_time

# Authentication routes
@app.post("/api/auth/register")
async def register(request: Request):
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    email = body.get('email', '').strip()
    password = body.get('password', '')
    name = body.get('name', '')
    role = body.get('role', 'student')
    
    if not all([email, password, name]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(password)
    
    user_doc = {
        "id": str(uuid4()),
        "email": email,
        "password": hashed_password,
        "name": name,
        "role": role,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Return user info without password
    user_response = {
        "id": user_doc["id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "role": user_doc["role"],
        "created_at": user_doc["created_at"]
    }
    
    return user_response

@app.post("/api/auth/login")
async def login(request: Request):
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    email = body.get('email', '').strip()
    password = body.get('password', '')
    
    if not all([email, password]):
        raise HTTPException(status_code=400, detail="Email and password required")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_jwt_token(token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}

# Get current user from token
async def get_current_user_from_request(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header[7:]
    try:
        payload = decode_jwt_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/auth/me")
async def get_me(request: Request):
    current_user = await get_current_user_from_request(request)
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }

# Queue entries routes
@app.post("/api/queue-entry")
async def create_queue_entry(request: Request):
    current_user = await get_current_user_from_request(request)
    
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    location = body.get('location', '')
    entry_time = body.get('entry_time', '')
    completion_time = body.get('completion_time', '')
    date = body.get('date', '')
    
    if not all([location, entry_time, completion_time, date]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    waiting_time = calculate_waiting_time(entry_time, completion_time)
    
    entry_doc = {
        "id": str(uuid4()),
        "location": location,
        "entry_time": entry_time,
        "completion_time": completion_time,
        "date": date,
        "waiting_time_minutes": waiting_time,
        "user_id": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    await db.queue_entries.insert_one(entry_doc)
    
    # Remove _id (ObjectId) to avoid serialization error
    if "_id" in entry_doc:
        del entry_doc["_id"]
    
    return entry_doc

@app.get("/api/queue-entries")
async def get_queue_entries(request: Request):
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] == "admin":
        cursor = db.queue_entries.find()
    else:
        cursor = db.queue_entries.find({"user_id": current_user["id"]})
    
    entries = []
    async for entry in cursor:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
        entries.append(entry)
    
    return entries

@app.get("/api/analytics")
async def get_analytics(request: Request):
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all queue entries
    all_entries_cursor = db.queue_entries.find()
    
    all_entries = []
    async for entry in all_entries_cursor:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
        all_entries.append(entry)
    
    # Group entries by location
    locations_data = {}
    for entry in all_entries:
        location = entry["location"]
        if location not in locations_data:
            locations_data[location] = []
        locations_data[location].append(entry)
    
    # Calculate analytics for each location
    location_analytics = []
    for location, entries in locations_data.items():
        if not entries:
            continue
        
        # Calculate average waiting time (only valid entries)
        valid_entries = [e for e in entries if e.get("waiting_time_minutes", 0) > 0]
        if valid_entries:
            avg_wait = sum(e["waiting_time_minutes"] for e in valid_entries) / len(valid_entries)
        else:
            avg_wait = 0
        
        # Group entries by hour for peak/best time analysis
        hourly_avgs = {}
        for entry in valid_entries:
            hour_key = f"{entry['entry_time'][:2]}:00"
            if hour_key not in hourly_avgs:
                hourly_avgs[hour_key] = []
            hourly_avgs[hour_key].append(entry["waiting_time_minutes"])
        
        # Calculate hourly averages
        hourly_avg_calc = {}
        for hour, times in hourly_avgs.items():
            hourly_avg_calc[hour] = sum(times) / len(times) if times else 0
        
        # Find peak hour (max average wait)
        peak_hour = ""
        peak_wait = 0
        for hour, avg in hourly_avg_calc.items():
            if avg > peak_wait:
                peak_wait = avg
                peak_hour = hour
        
        # Find best time (min average wait)
        best_time = ""
        best_wait = float('inf')
        for hour, avg in hourly_avg_calc.items():
            if 0 < avg < best_wait:  # Only consider positive wait times
                best_wait = avg
                best_time = hour
        
        location_analytics.append({
            "location": location,
            "average_waiting_time": round(avg_wait, 2),
            "peak_hour": f"{peak_hour}-{str(int(peak_hour.split(':')[0]) + 1).zfill(2)}:00" if peak_hour else "",
            "best_time": f"{best_time}-{str(int(best_time.split(':')[0]) + 1).zfill(2)}:00" if best_time else "",
            "total_entries": len(entries)
        })
    
    # Calculate overall hourly averages for trend chart
    overall_hourly_avgs = {}
    for entry in valid_entries:
        hour_key = f"{entry['entry_time'][:2]}:00"
        if hour_key not in overall_hourly_avgs:
            overall_hourly_avgs[hour_key] = []
        overall_hourly_avgs[hour_key].append(entry["waiting_time_minutes"])
    
    for hour, times in overall_hourly_avgs.items():
        overall_hourly_avgs[hour] = round(sum(times) / len(times), 2) if times else 0
    
    return {
        "locations": location_analytics,
        "hourly_data": overall_hourly_avgs
    }

# Health check
@app.get("/")
async def root():
    return {"message": "API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
