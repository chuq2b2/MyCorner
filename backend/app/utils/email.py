import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
EMAIL_USERNAME = os.getenv('EMAIL_USERNAME')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
FROM_EMAIL = os.getenv('FROM_EMAIL')

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        body (str): Email body content
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body
        msg.attach(MIMEText(body, 'html'))
        
        # Create SMTP session
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        
        # Login to SMTP server
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        
        # Send email
        server.sendmail(EMAIL_USERNAME, to_email, msg.as_string())
        
        # Close SMTP session
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}")
        return False

def create_reminder_email_body(reminder_type: str) -> str:
    """
    Create HTML email body for reminder emails.
    
    Args:
        reminder_type (str): Type of reminder ('daily' or 'weekly')
        
    Returns:
        str: HTML formatted email body
    """
    if reminder_type == 'daily':
        return """
        <html>
            <body>
                <h2>Daily Reminder from MyCorner</h2>
                <p>Hello!</p>
                <p>This is your daily reminder to log into MyCorner and check your recordings.</p>
                <p>We hope to see you soon!</p>
                <p>Best regards,<br>The MyCorner Team</p>
            </body>
        </html>
        """
    else:  # weekly
        return """
        <html>
            <body>
                <h2>Weekly Reminder from MyCorner</h2>
                <p>Hello!</p>
                <p>It's been a while since you last visited MyCorner. We miss you!</p>
                <p>Log in to check your recordings and stay connected with your memories.</p>
                <p>Best regards,<br>The MyCorner Team</p>
            </body>
        </html>
        """ 