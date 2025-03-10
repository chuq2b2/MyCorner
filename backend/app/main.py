from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.settings import CORS_ORIGINS, validate_config, logger
from .routes import users, webhooks, test

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

# Include routers
app.include_router(users.router)
app.include_router(webhooks.router)
app.include_router(test.router)

# Log application startup
@app.on_event("startup")
async def startup_event():
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down") 