import requests
from fastapi import HTTPException
from ..config.settings import  logger
import base64
import json


def get_clerk_user_data(authorization: str):
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
    token = authorization.split(' ')[1]
    
    try:
        # Decode the JWT token to get the user ID
        parts = token.split('.')
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid token format")

        # Decode the payload
        payload = parts[1]
        padding = '=' * (4 - len(payload) % 4)
        payload += padding
        decoded_payload = base64.urlsafe_b64decode(payload)
        token_data = json.loads(decoded_payload)

        # Get the user ID from the token
        user_id = token_data.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="No user ID found in token")

        return {"id": user_id}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")