from fastapi import APIRouter, Request, HTTPException
import time

from ..config.settings import get_supabase_client, logger

# Initialize router
router = APIRouter(tags=["test"])

# Initialize Supabase client
supabase = get_supabase_client()

@router.get("/")
def say_hello():
    """Simple health check endpoint."""
    return {"message": "Hello, world!"}

@router.post("/test-webhook")
async def test_webhook(request: Request):
    """Test endpoint to simulate Clerk webhook for user deletion."""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        
        if not user_id:
            return {"status": "error", "message": "Missing user_id parameter"}
            
        # Create a simulated webhook payload that exactly matches Clerk's format
        webhook_payload = {
            "data": {
                "deleted": True,
                "id": user_id,
                "object": "user"
            },
            "event_attributes": {
                "http_request": {
                    "client_ip": "127.0.0.1",
                    "user_agent": "Test Agent"
                }
            },
            "object": "event",
            "timestamp": int(time.time() * 1000),
            "type": "user.deleted"
        }
        
        # Log the payload
        logger.info(f"Simulating Clerk webhook with payload: {webhook_payload}")
        
        # Check if user exists
        check_user = supabase.table("users").select("*").eq("user_id", user_id).execute()
        user_exists = check_user.data and len(check_user.data) > 0
        
        if not user_exists:
            return {"status": "warning", "message": f"User {user_id} not found in Supabase, nothing to delete"}
            
        # Delete the user
        response = (
            supabase.table("users")
            .delete()
            .eq("user_id", user_id)
            .execute()
        )
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Failed to delete user: {response.error}")
            return {"status": "error", "message": str(response.error)}
            
        return {
            "status": "success", 
            "message": f"User {user_id} deleted successfully", 
            "data": response.data,
            "webhook_payload": webhook_payload
        }
        
    except Exception as e:
        logger.error(f"Error in test webhook: {str(e)}")
        return {"status": "error", "message": str(e)} 