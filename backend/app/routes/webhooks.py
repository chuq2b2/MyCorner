from fastapi import APIRouter, Request, HTTPException
import logging
import json
import hmac
import hashlib
import time

from ..config.settings import get_supabase_client, CLERK_WEBHOOK_SECRET, logger

# Initialize router
router = APIRouter(tags=["webhooks"])

# Initialize Supabase client
supabase = get_supabase_client()

@router.post("/webhook/clerk")
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