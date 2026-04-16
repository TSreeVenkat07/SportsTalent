"""
Structured Security & API Logging Middleware.
Standardizes headers, request tracing, and production-grade JSON logging.
"""

import logging
import uuid
from datetime import datetime, timezone
from flask import request, g, current_app
from pythonjsonlogger import jsonlogger

# ── Structured Logger Setup ─────────────────────────────
def setup_logging(app):
    """Integrate structured JSON logging into the Flask app."""
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s %(method)s %(path)s %(ip)s'
    )
    handler.setFormatter(formatter)
    
    # Root logger for all app logs
    app.logger.handlers = [handler]
    app.logger.setLevel(logging.INFO)
    
    # Specific security logger
    security_logger = logging.getLogger('security')
    security_logger.handlers = [handler]
    security_logger.setLevel(logging.INFO)
    security_logger.propagate = False

security_logger = logging.getLogger('security')

def log_security_event(event_type: str, details: dict = None):
    """Log a structured security event in JSON format."""
    extra = {
        'event_type': event_type,
        'request_id': getattr(g, 'request_id', 'unknown'),
        'method': request.method if request else 'N/A',
        'path': request.path if request else 'N/A',
        'ip': request.remote_addr if request else 'unknown',
        'ua': request.headers.get('User-Agent', 'unknown') if request else 'unknown',
    }
    if details:
        extra.update(details)
    
    security_logger.info(f"Security event: {event_type}", extra=extra)

def log_auth_attempt(email: str, success: bool, reason: str = ''):
    """Log a structured authentication attempt."""
    log_security_event(
        'AUTH_SUCCESS' if success else 'AUTH_FAILURE',
        {'email': email, 'reason': reason}
    )

def log_api_error(endpoint: str, status: int, error: str):
    """Log a structured API error."""
    log_security_event('API_ERROR', {
        'endpoint': endpoint, 'status': status, 'error': error[:200]
    })


# ── Security Headers ──────────────────────────────────
def add_security_headers(response):
    """Append critical security headers to every response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; object-src 'none';"
    
    if not current_app.debug:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response


# ── Request Context ───────────────────────────────────
def attach_request_info():
    """Seed the request context with tracing metadata."""
    g.request_id = str(uuid.uuid4())[:8]
    g.request_start = datetime.now(timezone.utc)
