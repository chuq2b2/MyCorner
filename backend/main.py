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
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env.local"))
load_dotenv(env_path)

# Load environment variables
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, CLERK_SECRET_KEY]):
    raise ValueError("Missing required environment variables. Check your .env file.")

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# def get_clerk_user_data(token: str):
#     """Fetch user data from Clerk using session token."""
#     headers = {"Authorization": f"Bearer {token}"}
#     response = requests.get("https://api.clerk.dev/v1/me", headers=headers)
    
#     if response.status_code != 200:
#         raise HTTPException(status_code=response.status_code, detail="Failed to fetch user data")

#     return response.json()

# async def verify_clerk_webhook(request: Request) -> bool:
#     """Verify that the webhook request came from Clerk."""
#     if not CLERK_WEBHOOK_SECRET:
#         raise HTTPException(status_code=500, detail="Clerk webhook secret not configured")

#     svix_id = request.headers.get("svix-id")
#     svix_timestamp = request.headers.get("svix-timestamp")
#     svix_signature = request.headers.get("svix-signature")

#     if not all([svix_id, svix_timestamp, svix_signature]):
#         return False

#     body = await request.body()
    
#     # Compute HMAC
#     hmac_obj = hmac.new(
#         CLERK_WEBHOOK_SECRET.encode(),
#         f"{svix_id}.{svix_timestamp}.{body}".encode(),
#         hashlib.sha256
#     )
#     signature = hmac_obj.hexdigest()

#     return hmac.compare_digest(signature, svix_signature)


@app.post("/sync-user")
async def sync_user(request: Request):
    """Sync user data with Supabase - handles both creation and updates."""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        created_at = data.get("created_at")
        last_sign_in = data.get("last_sign_in")
        username = data.get("username")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        profile_image_url = data.get("profile_image_url")
        email = data.get("email")

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        # First check if user exists
        existing_user = supabase.table("users").select("*").eq("user_id", user_id).execute()
        
        if existing_user.data and len(existing_user.data) > 0:
            # User exists, only update last_sign_in
            logger.info(f"Updating last_sign_in for existing user: {user_id}")
            response = (
                supabase.table("users")
                .update({"last_sign_in": last_sign_in, "username": username, "first_name": first_name, "last_name": last_name, "profile_image_url": profile_image_url, "email": email})
                .eq("user_id", user_id)
                .execute()
            )
        else:
            # New user, create full record
            logger.info(f"Creating new user record: {user_id}")
            user_data = {
                "user_id": user_id,
                "last_sign_in": last_sign_in,
                "created_at": created_at,
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "profile_image_url": profile_image_url,
                "email": email
            }
            response = supabase.table("users").insert(user_data).execute()

        # Check for error in the response's error attribute
        if hasattr(response, 'error') and response.error:
            logger.error(f"Failed to sync user data: {response.error}")
            raise HTTPException(status_code=500, detail="Failed to sync user data")

        return {"message": "User data synced successfully", "data": response.data}

    except Exception as e:
        logger.error(f"Error in sync_user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")    
def say_hello():
    return {"message": "Hello, world!"}