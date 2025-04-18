"""
API routes for the MyCorner application
"""

from .recordings import router as recordings_router
from .users import router as users_router
from .test import router as test_router
from .sync import router as sync_router
from .prompts import router as prompts_router

__all__ = [
    "recordings_router",
    "users_router",
    "test_router",
    "sync_router",
    "prompts_router",
] 