import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
load_dotenv(env_path)

# Clerk settings
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")

# Supabase settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# CORS settings
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Add more origins as needed
]

# Initialize Supabase client
def get_supabase_client() -> Client:
    """Initialize and return the Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing Supabase configuration. Check your .env file.")
    
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        raise

# Validate configuration
def validate_config():
    """Validate that all required configuration variables are set."""
    if not all([SUPABASE_URL, SUPABASE_KEY, CLERK_SECRET_KEY]):
        raise ValueError("Missing required environment variables. Check your .env file.")
    
    # Test Supabase connection
    get_supabase_client()
    
    return True 