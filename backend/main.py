import logging
from fastapi import FastAPI, Depends, HTTPException, Request
import requests
from supabase import create_client, Client
import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import hmac
import hashlib

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env.local"))
load_dotenv(env_path)

# Load environment variables
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET]):
    raise ValueError("Missing required environment variables. Check your .env file.")

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
    """Fetch user data from Clerk using session token."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("https://api.clerk.dev/v1/me", headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch user data")

    return response.json()

async def verify_clerk_webhook(request: Request) -> bool:
    """Verify that the webhook request came from Clerk."""
    if not CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Clerk webhook secret not configured")

    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")

    if not all([svix_id, svix_timestamp, svix_signature]):
        return False

    body = await request.body()
    
    # Compute HMAC
    hmac_obj = hmac.new(
        CLERK_WEBHOOK_SECRET.encode(),
        f"{svix_id}.{svix_timestamp}.{body}".encode(),
        hashlib.sha256
    )
    signature = hmac_obj.hexdigest()

    return hmac.compare_digest(signature, svix_signature)

def extract_user_data(user_info: dict) -> dict:
    """Extract relevant user data from Clerk user info."""
    primary_email = next((
        email for email in user_info.get("email_addresses", [])
        if email.get("id") == user_info.get("primary_email_address_id")
    ), {})

    return {
        "id": user_info["id"],
        "email": primary_email.get("email_address"),
        "first_name": user_info.get("first_name"),
        "last_name": user_info.get("last_name"),
        "username": user_info.get("username"),
        "profile_image_url": user_info.get("profile_image_url"),
        "last_sign_in": datetime.utcnow().isoformat(),
        "created_at": user_info.get("created_at"),
        "updated_at": user_info.get("updated_at"),
    }

@app.post("/signup")
async def user_signup(request: Request):
    """Handle user signup and store data in Supabase."""
    data = await request.json()
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    user_info = get_clerk_user_data(token)
    user_data = extract_user_data(user_info)

    response = supabase.table("users").upsert([user_data]).execute()
    
    if response.get("error"):
        raise HTTPException(status_code=500, detail="Failed to save user")

    return {"message": "User saved successfully", "data": user_data}

@app.post("/signin")
async def user_signin(request: Request):
    """Update last sign-in timestamp and sync latest user data."""
    data = await request.json()
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    user_info = get_clerk_user_data(token)
    user_data = extract_user_data(user_info)

    response = supabase.table("users").upsert([user_data]).execute()

    if response.get("error"):
        raise HTTPException(status_code=500, detail="Failed to update user data")

    return {"message": "User sign-in recorded", "user_id": user_data["id"]}

@app.post("/webhook/clerk")
async def clerk_webhook(request: Request):
    """Handle Clerk webhooks for user data synchronization."""
    if not await verify_clerk_webhook(request):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    data = await request.json()
    event_type = data.get("type")
    
    if not event_type:
        raise HTTPException(status_code=400, detail="Missing event type")

    user_data = data.get("data", {})
    
    if event_type == "user.created" or event_type == "user.updated":
        # Format user data and sync to Supabase
        formatted_data = {
            "id": user_data.get("id"),
            "email": user_data.get("email_addresses", [{}])[0].get("email_address"),
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            "username": user_data.get("username"),
            "profile_image_url": user_data.get("profile_image_url"),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        response = supabase.table("users").upsert([formatted_data]).execute()
        
        if response.get("error"):
            raise HTTPException(status_code=500, detail="Failed to sync user data")
            
    elif event_type == "user.deleted":
        user_id = user_data.get("id")
        if user_id:
            response = supabase.table("users").delete().eq("id", user_id).execute()
            
            if response.get("error"):
                raise HTTPException(status_code=500, detail="Failed to delete user")

    return {"message": f"Processed {event_type} event successfully"}

@app.post("/add-user")
async def add_user(user: dict):
    return {"message": "User received", "user": user}