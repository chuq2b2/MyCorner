from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict
import pytz

from ..config.settings import get_supabase_client, CLERK_SECRET_KEY, logger
from ..utils.clerk import get_clerk_user_data

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
        
        # Get users with matching reminder time
        response = supabase.table('user_settings').select(
            'user_id, reminder_time, enable_weekly_reminder'
        ).execute()
        
        if response.error:
            logger.error(f"Error fetching user settings: {response.error}")
            return []
            
        users = response.data
        users_needing_reminder = []
        
        for user in users:
            # Convert user's local reminder time to UTC
            try:
                # Parse the reminder time
                reminder_hour, reminder_minute = map(int, user['reminder_time'].split(':'))
                
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
                        'type': 'daily'
                    })
            except Exception as e:
                logger.error(f"Error processing reminder time for user {user['user_id']}: {str(e)}")
                continue
            
            # Check weekly reminder if enabled
            if user['enable_weekly_reminder']:
                # Get user's last login
                last_login = get_user_last_login(user['user_id'])
                if last_login:
                    days_since_login = (now - last_login).days
                    logger.info(f"User {user['user_id']} last login: {last_login}, days since: {days_since_login}")
                    if days_since_login >= 7:
                        users_needing_reminder.append({
                            'user_id': user['user_id'],
                            'type': 'weekly'
                        })
        
        logger.info(f"Found {len(users_needing_reminder)} users needing reminders")
        return users_needing_reminder
    except Exception as e:
        logger.error(f"Error in get_users_needing_reminder: {str(e)}")
        return []

def get_user_last_login(user_id: str) -> datetime:
    """Get user's last login time from Clerk."""
    try:
        user_data = get_clerk_user_data(user_id)
        if user_data and 'last_sign_in_at' in user_data:
            return datetime.fromisoformat(user_data['last_sign_in_at'].replace('Z', '+00:00'))
        return None
    except Exception as e:
        logger.error(f"Error getting last login for user {user_id}: {str(e)}")
        return None

def send_reminder_email(user_id: str, reminder_type: str) -> bool:
    """Send reminder email to user."""
    try:
        user_data = get_clerk_user_data(user_id)
        if not user_data or 'email_addresses' not in user_data:
            logger.error(f"No email found for user {user_id}")
            return False
            
        email = user_data['email_addresses'][0]['email_address']
        
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
                user['type']
            )
        return {"message": f"Processing reminders for {len(users)} users"}
    except Exception as e:
        logger.error(f"Error in check_reminders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

