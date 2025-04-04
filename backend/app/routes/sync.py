from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging
import requests
import time

from ..config.settings import get_supabase_client, CLERK_SECRET_KEY, logger

# Initialize router
router = APIRouter(prefix="/sync", tags=["synchronization"])

# Initialize Supabase client
supabase = get_supabase_client()

@router.post("/check-deletions")
async def check_user_deletions(background_tasks: BackgroundTasks):
    """
    Check all users in Supabase against Clerk and delete any that no longer exist in Clerk.
    This can be run manually or on a schedule to keep the databases in sync.
    """
    # Start the sync in the background so the API call can return quickly
    background_tasks.add_task(perform_user_sync)
    return {"status": "success", "message": "User synchronization started in the background"}

async def perform_user_sync():
    """
    Perform the actual synchronization between Clerk and Supabase.
    This function runs in the background.
    """
    try:
        logger.info("Starting Clerk/Supabase user synchronization")
        
        # Get all users from Supabase
        users_response = supabase.table("users").select("user_id").execute()
        
        if not users_response.data:
            logger.info("No users found in Supabase, nothing to sync")
            return
            
        # Process each user
        deleted_count = 0
        for user in users_response.data:
            user_id = user.get("user_id")
            
            if not user_id:
                continue
                
            # Check if the user exists in Clerk
            user_exists = await check_user_exists_in_clerk(user_id)
            
            if not user_exists:
                logger.info(f"User {user_id} not found in Clerk, deleting from Supabase")
                
                # Delete the user from Supabase
                delete_response = (
                    supabase.table("users")
                    .delete()
                    .eq("user_id", user_id)
                    .execute()
                )
                
                if hasattr(delete_response, 'error') and delete_response.error:
                    logger.error(f"Failed to delete user {user_id}: {delete_response.error}")
                else:
                    deleted_count += 1
                    logger.info(f"Successfully deleted user {user_id} from Supabase")
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
        
        logger.info(f"User synchronization completed. Deleted {deleted_count} users.")
    
    except Exception as e:
        logger.error(f"Error during user synchronization: {str(e)}")

async def check_user_exists_in_clerk(user_id: str) -> bool:
    """
    Check if a user with the given ID exists in Clerk.
    
    Args:
        user_id: The Clerk user ID to check
        
    Returns:
        bool: True if the user exists, False otherwise
    """
    if not CLERK_SECRET_KEY:
        logger.error("CLERK_SECRET_KEY not set, cannot verify users")
        return True  # Assume user exists to avoid accidental deletions
    
    try:
        # Set up the API request to Clerk
        headers = {
            "Authorization": f"Bearer {CLERK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        # Call Clerk's API to get the user
        response = requests.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers=headers
        )
        
        # If the user exists, we'll get a 200 status code
        if response.status_code == 200:
            return True
            
        # If the user doesn't exist, we'll get a 404 status code
        if response.status_code == 404:
            logger.info(f"User {user_id} not found in Clerk")
            return False
            
        # For other status codes, log the error and assume the user exists
        logger.error(f"Error checking user {user_id} in Clerk: {response.status_code} - {response.text}")
        return True  # Assume user exists to avoid accidental deletions
        
    except Exception as e:
        logger.error(f"Exception checking user {user_id} in Clerk: {str(e)}")
        return True  # Assume user exists to avoid accidental deletions

@router.post("/check-deletion/{user_id}")
async def check_single_user(user_id: str):
    """
    Check a single user against Clerk and delete them from Supabase if they don't exist in Clerk.
    This can be used for testing or for handling individual users.
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")
            
        # Check if the user exists in Supabase
        user_response = supabase.table("users").select("*").eq("user_id", user_id).execute()
        
        if not user_response.data or len(user_response.data) == 0:
            return {"status": "warning", "message": f"User {user_id} not found in Supabase"}
            
        # Check if the user exists in Clerk
        user_exists = await check_user_exists_in_clerk(user_id)
        
        if user_exists:
            return {"status": "success", "message": f"User {user_id} exists in Clerk, no action taken"}
            
        # User doesn't exist in Clerk, delete from Supabase
        delete_response = (
            supabase.table("users")
            .delete()
            .eq("user_id", user_id)
            .execute()
        )
        
        if hasattr(delete_response, 'error') and delete_response.error:
            logger.error(f"Failed to delete user {user_id}: {delete_response.error}")
            raise HTTPException(status_code=500, detail=f"Failed to delete user: {delete_response.error}")
            
        return {"status": "success", "message": f"User {user_id} deleted from Supabase", "data": delete_response.data}
        
    except Exception as e:
        logger.error(f"Error checking user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 