from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header, Form
from typing import Optional
from datetime import datetime
import json
import os
from ..config.settings import get_supabase_client, logger

router = APIRouter(tags=["recordings"])

supabase = get_supabase_client()


@router.post("/upload")
async def upload_recording(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    note: str = Form(None),
    tags: Optional[str] = Form(None),
    user_id: str = Form(...),
):
    try:
        # Check if user exists in Supabase
        user_response = supabase.table("users").select("id").eq("user_id", user_id).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found in database")

        # Generate a unique filename
        timestamp = datetime.now().timestamp()
        file_extension = "webm" if file_type == "audio" else "mp4"
        filename = f"{user_id}/{timestamp}.{file_extension}"

        # Upload file to Supabase Storage
        file_content = await file.read()
        upload_response = supabase.storage.from_("recordings").upload(
            filename,
            file_content,
            {"contentType": f"{file_type}/webm"}
        )

        if not upload_response:
            raise HTTPException(status_code=500, detail="Failed to upload file")

        # Get the public URL
        public_url = supabase.storage.from_("recordings").get_public_url(filename)
        print("Note received:", note)

        parsed_tags = []
        if tags:
            parsed_tags = json.loads(tags)
        # Save to recordings table
        db_response = supabase.table("recordings").insert({
            "created_at": datetime.now().isoformat(),
            "user_id": user_id,
            "file_url": public_url,
            "file_type": file_type,
            "note": note,
            "tags": parsed_tags,
        }).execute()

        if not db_response.data:
            raise HTTPException(status_code=500, detail="Failed to save recording metadata")

        return {"message": "Recording uploaded successfully", "url": public_url}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 