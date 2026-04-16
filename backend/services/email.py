"""
Email service — Credential delivery and notifications via Resend.
Secured: HTML sanitization to prevent stored XSS.
"""

import os
import re

# In production, uncomment:
import resend
from config import Config

def send_credentials_email(to_email: str, name: str, temp_password: str) -> bool:
...
    try:
        # 🪄 Master Config: Using centralized credentials
        resend.api_key = Config.RESEND_API_KEY
        if resend.api_key:
            resend.Emails.send({
                'from': Config.FROM_EMAIL,
                'to': [to_email],
                'subject': subject,
                'html': html,
            })
...
def send_notification(to_email: str, subject: str, message: str) -> bool:
...
    try:
        resend.api_key = Config.RESEND_API_KEY
        if resend.api_key:
            resend.Emails.send({
                'from': Config.FROM_EMAIL,
                'to': [to_email],
                'subject': subject,
                'html': f'<p>{_sanitize_html_value(message)}</p>',
            })

        print(f"[EMAIL] Notification sent to {to_email}: {subject}")
        return True

    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False
