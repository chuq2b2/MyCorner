from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

from .config.settings import CORS_ORIGINS, validate_config, logger
from .routes import users, webhooks, test, sync, prompts
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
app.include_router(users.router)
app.include_router(webhooks.router)
app.include_router(test.router)
app.include_router(sync.router)
app.include_router(prompts.router)

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
    
    # Start the scheduler
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
    
    # Shut down the scheduler
    scheduler.shutdown() 