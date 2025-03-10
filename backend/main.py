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
import json
import time
from tests.test import router as test_webhook_router


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env.local"))
load_dotenv(env_path)

# Load environment variables
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")
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


# Include the test_webhook router
app.include_router(test_webhook_router)

# Set the supabase client in the test_webhook module
import tests.test
tests.test.supabase = supabase

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


@app.post("/webhook/clerk")
async def clerk_webhook(request: Request):
    """Handle Clerk webhooks for user events."""
    try:
        # Get the raw request body
        body = await request.body()
        payload_str = body.decode('utf-8')
        
        # Log the raw request for debugging
        logger.info(f"Received webhook payload: {payload_str}")
        
        # Verify the webhook signature in production
        if CLERK_WEBHOOK_SECRET:
            # Get the signature from headers
            clerk_signature = request.headers.get("svix-signature")
            clerk_timestamp = request.headers.get("svix-timestamp")
            clerk_id = request.headers.get("svix-id")
            
            if not (clerk_signature and clerk_timestamp and clerk_id):
                logger.error("Missing Clerk webhook signature headers")
                raise HTTPException(status_code=400, detail="Missing signature headers")
                
            # Create the signature payload
            payload = f"{clerk_timestamp}.{clerk_id}.{payload_str}"
            
            # Compute HMAC
            computed_signature = hmac.new(
                CLERK_WEBHOOK_SECRET.encode("utf-8"),
                payload.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            
            # Verify the signature
            if not hmac.compare_digest(computed_signature, clerk_signature):
                logger.error("Invalid Clerk webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse the JSON data
        try:
            data = json.loads(payload_str)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            return {"status": "error", "message": "Invalid JSON payload"}
        
        # Log the entire webhook payload for debugging
        logger.info(f"Processed webhook data: {data}")
        
        # Get the event type
        event_type = data.get("type")
        logger.info(f"Webhook event type: {event_type}")
        
        if not event_type:
            logger.error("Missing event type in webhook payload")
            return {"status": "error", "message": "Missing event type"}
        
        if event_type == "user.deleted":
            # Extract user ID from the correct location in the payload
            user_data = data.get("data", {})
            user_id = user_data.get("id")
            logger.info(f"Extracted user_id from webhook: {user_id}")
            
            if not user_id:
                logger.error("Missing user_id in webhook payload")
                return {"status": "error", "message": "Missing user_id"}
                
            logger.info(f"Attempting to delete user from Supabase: {user_id}")
            
            # Check if user exists before deletion
            try:
                check_user = supabase.table("users").select("*").eq("user_id", user_id).execute()
                user_exists = check_user.data and len(check_user.data) > 0
                logger.info(f"User record exists in database: {user_exists}")
                
                if not user_exists:
                    logger.warning(f"User {user_id} not found in database, nothing to delete")
                    return {"status": "success", "message": f"User {user_id} not found in database, nothing to delete"}
                
                # Delete the user from Supabase
                response = (
                    supabase.table("users")
                    .delete()
                    .eq("user_id", user_id)
                    .execute()
                )
                
                # Log the response for debugging
                logger.info(f"Supabase delete response: {response}")
                
                if hasattr(response, 'error') and response.error:
                    logger.error(f"Failed to delete user from Supabase: {response.error}")
                    return {"status": "error", "message": f"Failed to delete user from Supabase: {response.error}"}
                
                # Log success outcome
                logger.info(f"Successfully deleted user {user_id} from Supabase")
                return {"status": "success", "message": f"User {user_id} deleted from Supabase"}
                
            except Exception as e:
                logger.error(f"Database error when deleting user: {str(e)}")
                return {"status": "error", "message": f"Database error: {str(e)}"}
        else:
            logger.info(f"Ignoring non-deletion event: {event_type}")
            return {"status": "success", "message": f"Ignored {event_type} event"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return {"status": "error", "message": f"Error: {str(e)}"}

# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)