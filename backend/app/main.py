from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
import aiohttp
import os

from .config.settings import CORS_ORIGINS, validate_config, logger
from .routes import (
    users_router,
    test_router,
    sync_router,
    prompts_router,
    recordings_router,
    recordings,
    reminder
)
from .routes.sync import perform_user_sync

# Validate configuration
validate_config()

# Initialize FastAPI app
app = FastAPI(
    title="MyCorner API",
    description="Backend API for MyCorner application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scheduler
scheduler = AsyncIOScheduler()

# Include routers
app.include_router(users_router)
app.include_router(test_router)
app.include_router(sync_router)
app.include_router(prompts_router)
app.include_router(recordings_router, prefix="/recordings", tags=["recordings"])
app.include_router(recordings.router)
app.include_router(reminder.router)

async def check_reminders():
    """Check for reminders that need to be sent."""
    try:
        logger.info("Running reminder check...")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8000/reminder/check-reminders",
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    logger.error(f"Error checking reminders: {await response.text()}")
                else:
                    result = await response.json()
                    logger.info(f"Reminder check completed successfully: {result}")
    except Exception as e:
        logger.error(f"Error in check_reminders scheduler: {str(e)}")

# Log application startup
@app.on_event("startup")
async def startup_event():
    logger.info("Application started")
    
    # Schedule the user synchronization task to run daily at 3:00 AM
    scheduler.add_job(
        perform_user_sync,
        CronTrigger(hour=22, minute=7),  # Run at 3:00 AM every day
        id="sync_users_job",
        name="Sync users between Clerk and Supabase",
        replace_existing=True,
    )
    
    # Add job to check reminders every minute
    scheduler.add_job(
        check_reminders,
        trigger=CronTrigger(minute="*"),
        id="check_reminders",
        name="Check and send reminders",
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started")
    
    # Log all scheduled jobs
    for job in scheduler.get_jobs():
        logger.info(f"Scheduled job: {job.name} (next run: {job.next_run_time})")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
    
    # Shut down the scheduler
    scheduler.shutdown() 