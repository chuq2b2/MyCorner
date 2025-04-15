from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict
import pytz

from ..config.settings import get_supabase_client, logger

# Initialize router
router = APIRouter(prefix="/reminder", tags=["synchronization"])

# Initialize Supabase client
supabase = get_supabase_client()

def get_users_needing_reminder() -> List[Dict]:
    """Get users who need reminders based on their settings."""
    try:
        # Get current time in UTC
        now = datetime.now(pytz.UTC)
        current_time_utc = now.strftime('%H:%M')
        
        logger.info(f"Current UTC time: {current_time_utc}")
        
        # Get users with their settings and last sign in
        response = supabase.table('user_settings').select(
            'user_id, reminder_time, enable_weekly_reminder, users!inner(email, last_sign_in)'
        ).execute()
        
        if not response.data:
            logger.info("No user settings found")
            return []
            
        users = response.data
        users_needing_reminder = []
        
        for user in users:
            # Convert user's local reminder time to UTC
            try:
                # Parse the reminder time
                reminder_hour, reminder_minute, _ = map(int, user['reminder_time'].split(':'))
                
                # Create a datetime object for today with the reminder time
                local_time = datetime.now().replace(
                    hour=reminder_hour,
                    minute=reminder_minute,
                    second=0,
                    microsecond=0
                )
                
                # Convert to UTC
                local_tz = pytz.timezone('America/New_York')  # Adjust this to your local timezone
                local_time = local_tz.localize(local_time)
                reminder_time_utc = local_time.astimezone(pytz.UTC).strftime('%H:%M')
                
                logger.info(f"User {user['user_id']} local reminder time: {user['reminder_time']}, UTC: {reminder_time_utc}")
                
                # Check daily reminder
                if reminder_time_utc == current_time_utc:
                    logger.info(f"Found matching reminder time for user {user['user_id']}")
                    users_needing_reminder.append({
                        'user_id': user['user_id'],
                        'email': user['users']['email'],
                        'type': 'daily'
                    })
            except Exception as e:
                logger.error(f"Error processing reminder time for user {user['user_id']}: {str(e)}")
                continue
            
            # Check weekly reminder if enabled
            if user['enable_weekly_reminder']:
                # Get user's last login from the users table
                last_login = user['users']['last_sign_in']
                if last_login:
                    last_login_dt = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                    days_since_login = (now - last_login_dt).days
                    logger.info(f"User {user['user_id']} last login: {last_login}, days since: {days_since_login}")
                    if days_since_login >= 7:
                        users_needing_reminder.append({
                            'user_id': user['user_id'],
                            'email': user['users']['email'],
                            'type': 'weekly'
                        })
        
        logger.info(f"Found {len(users_needing_reminder)} users needing reminders")
        return users_needing_reminder
    except Exception as e:
        logger.error(f"Error in get_users_needing_reminder: {str(e)}")
        return []

def send_reminder_email(user_id: str, email: str, reminder_type: str) -> bool:
    """Send reminder email to user."""
    try:
        # TODO: Implement actual email sending logic here
        # For now, just log the reminder
        logger.info(f"Sending {reminder_type} reminder to {email}")
        
        return True
    except Exception as e:
        logger.error(f"Error sending reminder to user {user_id}: {str(e)}")
        return False

@router.post("/check-reminders")
async def check_reminders(background_tasks: BackgroundTasks):
    """Endpoint to check and send reminders."""
    try:
        logger.info("Reminder endpoint called")
        users = get_users_needing_reminder()
        logger.info(f"Found {len(users)} users needing reminders")
        
        for user in users:
            logger.info(f"Adding reminder task for user {user['user_id']} ({user['type']})")
            background_tasks.add_task(
                send_reminder_email,
                user['user_id'],
                user['email'],
                user['type']
            )
        return {"message": f"Processing reminders for {len(users)} users"}
    except Exception as e:
        logger.error(f"Error in check_reminders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

