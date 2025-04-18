from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import uuid
from datetime import datetime
from ..config.settings import upload_file_to_s3, list_s3_files, logger

router = APIRouter(
    prefix="/media",
    tags=["media"],
    responses={404: {"description": "Not found"}},
)

ALLOWED_AUDIO_TYPES = ["audio/wav", "audio/mpeg", "audio/webm"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"]
UPLOAD_DIR = "temp_uploads"

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    note: Optional[str] = Form(None),
    media_type: str = Form(...),  # 'audio' or 'video'
):
    """
    Upload media file (audio or video) to S3
    """
    try:
        # Validate media type
        content_type = file.content_type
        if media_type == "audio" and content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(status_code=400, detail="Invalid audio file type")
        if media_type == "video" and content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(status_code=400, detail="Invalid video file type")

        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{media_type}/{str(uuid.uuid4())}{file_ext}"
        temp_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file temporarily
        try:
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            # Prepare metadata
            metadata = {
                "original_filename": file.filename,
                "content_type": content_type,
                "upload_date": datetime.utcnow().isoformat(),
                "media_type": media_type
            }
            if note:
                metadata["note"] = note

            # Upload to S3
            if upload_file_to_s3(temp_path, unique_filename, metadata):
                return {
                    "message": "File uploaded successfully",
                    "filename": unique_filename
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to upload file to S3")

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{media_type}")
async def list_media(media_type: str):
    """
    List all media files of specified type (audio or video)
    """
    if media_type not in ["audio", "video"]:
        raise HTTPException(status_code=400, detail="Invalid media type")

    try:
        files = list_s3_files(prefix=f"{media_type}/")
        return {"files": files}
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 