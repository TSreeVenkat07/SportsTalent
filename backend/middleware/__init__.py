"""
Auth middleware — JWT role verification decorator
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
import os

# In production, import supabase client
# from supabase import create_client
# supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))


def require_role(*roles):
    """
    Decorator to restrict route access by user role.
    Usage: @require_role('admin', 'founder')
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()

            # In production: query Supabase for user role
            # profile = supabase.table('profiles') \
            #     .select('role').eq('id', user_id).single().execute()
            # user_role = profile.data.get('role')

            # Demo mode — extract role from JWT claims
            from flask_jwt_extended import get_jwt
            claims = get_jwt()
            user_role = claims.get('role', 'athlete')

            if user_role not in roles:
                return jsonify({'error': 'Forbidden — insufficient permissions'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


def has_jwt():
    """Check if request has a valid JWT without requiring it."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity() is not None
    except Exception:
        return False
