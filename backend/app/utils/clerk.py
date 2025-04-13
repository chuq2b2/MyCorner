import requests
from fastapi import HTTPException
from ..config.settings import CLERK_SECRET_KEY

def get_clerk_user_data(token: str):
    """Fetch user data from Clerk using session token."""
    headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
    response = requests.get(f"https://api.clerk.dev/v1/sessions/{token}", headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch user data")

    return response.json() 