import logging
from fastapi import FastAPI, Depends, HTTPException, Request
import requests
from supabase import create_client, Client
import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env.local"))
load_dotenv(env_path)

# Load environment variables
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file location and values.")

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test connection
response = supabase.table("users").select("*").execute()

print(response.data) 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust if using a different port
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

def get_clerk_user_data(token: str):
    """Fetch user data from Clerk using Clerk secret key."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("https://api.clerk.dev/v1/me", headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch user data")

    return response.json()

@app.post("/signup")
async def user_signup(request: Request):
    """Receives Clerk user info and stores it in Supabase."""
    data = await request.json()
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    # Fetch user info from Clerk
    user_info = get_clerk_user_data(token)

    # Extract relevant fields
    user_data = {
        "id": user_info["id"],
        "email": user_info["email_addresses"][0]["email_address"],
        "first_name": user_info["first_name"],
        "last_name": user_info["last_name"],
    }

    # Insert into Supabase
    response = supabase.table("users").upsert([user_data]).execute()
    
    if response.get("error"):
        raise HTTPException(status_code=500, detail="Failed to save user")

    return {"message": "User saved successfully", "data": user_data}

@app.post("/signin")
async def user_signin(request: Request):
    """Updates last_signin timestamp when user logs in."""
    data = await request.json()
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    # Fetch user info from Clerk
    user_info = get_clerk_user_data(token)
    user_id = user_info["id"]
    logging.debug(user_info)

    # Update last_signin timestamp in Supabase
    response = (
        supabase
        .table("users")
        .update({"last_signin": datetime.utcnow().isoformat()})
        .eq("id", user_id)
        .execute()
    )

    if response.get("error"):
        raise HTTPException(status_code=500, detail="Failed to update last_signin")

    return {"message": "User sign-in recorded", "user_id": user_id}

@app.post("/add-user")
async def add_user(user: dict):
    return {"message": "User received", "user": user}