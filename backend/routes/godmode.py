from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from middleware import has_jwt, require_role
from utils.supabase_client import supabase
from config import Config
from datetime import timedelta

godmode_bp = Blueprint('godmode', __name__)

import bcrypt

@godmode_bp.route('/access', methods=['POST'])
def godmode_access():
    """Authenticate God Mode access (Founder master pass OR Admin Email+Pass)."""
    data = request.json or {}
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    # 1. Check Master Founder Passwords (SUPER OVERRIDES)
    import os
    master_pass = (os.getenv('GOD_MODE_PASSWORD') or 'change-me-founder-only-password').strip()
    
    if master_pass and password == master_pass:
        access_token = create_access_token(
            identity='founder-godmode',
            additional_claims={'role': 'founder', 'godmode': True},
            expires_delta=timedelta(hours=2),
        )
        return jsonify({
            'token': access_token, 
            'role': 'founder', 
            'is_god_mode': True,
            'user': {'email': email or 'founder@sporttalenthunt.in', 'role': 'founder', 'full_name': 'Founder'}
        })

    # 2. Check Admin Email + Password (Standard Staff Login)
    if email:
        try:
            res = supabase.table('users').select('*').eq('email', email).in_('role', ['admin', 'founder', 'reviewer']).execute()
            user = res.data[0] if res.data else None
            
            if user:
                stored_hash = user.get('password_hash')
                if stored_hash and bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                    access_token = create_access_token(
                        identity=user['id'],
                        additional_claims={'role': user['role'], 'godmode': True},
                        expires_delta=timedelta(hours=2),
                    )
                    return jsonify({
                        'token': access_token, 
                        'role': user['role'], 
                        'is_god_mode': (user['role'] == 'founder'),
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'role': user['role'],
                            'full_name': user.get('full_name', 'Admin')
                        }
                    })
        except Exception as e:
            print(f"Admin Auth error: {e}")

    return jsonify({'error': 'Invalid credentials'}), 401


@godmode_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_role('founder')
def get_god_stats():
    """Fetch global platform statistics from Supabase."""
    users_count = supabase.table('users').select('id', count='exact').execute().count
    athletes_count = supabase.table('athletes').select('user_id', count='exact').execute().count
    coaches_count = supabase.table('coaches').select('user_id', count='exact').execute().count
    videos_count = supabase.table('feed_videos').select('id', count='exact').execute().count
    
    return jsonify({
        'totalUsers': users_count,
        'athletes': athletes_count,
        'coaches': coaches_count,
        'totalVideos': videos_count,
        'platformHealth': 'healthy',
        'activeNow': 1 # Simulation
    })


@godmode_bp.route('/users', methods=['GET'])
@jwt_required()
@require_role('founder')
def get_all_users():
    """List all platform users with metadata from Supabase."""
    res = supabase.table('users').select('*').order('created_at', desc=True).execute()
    return jsonify(res.data)

