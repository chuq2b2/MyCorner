from fastapi import APIRouter, Request, HTTPException
import logging

from ..config.settings import get_supabase_client, logger

# Initialize router
router = APIRouter(tags=["users"])

# Initialize Supabase client
supabase = get_supabase_client()

@router.post("/sync-user")
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