"""
Auth routes — Register, Login
Secured: bcrypt hashing, password validation, rate limiting, no demo bypass.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
import uuid

from utils.validators import validate_email, validate_password, sanitize_string
from middleware.security import log_auth_attempt

auth_bp = Blueprint('auth', __name__)

from utils.supabase_client import supabase

def _get_limiter():
    """Lazily import limiter to avoid circular imports."""
    from app import limiter
    return limiter


@auth_bp.route('/register', methods=['POST'])
def register():
    """Create a new user account (Athlete or Coach)."""
    data = request.json or {}

    try:
        role = sanitize_string(data.get('role', 'athlete'), max_len=20)
        name = sanitize_string(data.get('name', ''), max_len=100, field_name='Name')
        email = validate_email(data.get('email', ''))
        password = validate_password(data.get('password', ''))
        sport = sanitize_string(data.get('sport', ''), max_len=50, field_name='Sport')
        state = sanitize_string(data.get('state', ''), max_len=50, field_name='State')
        district = sanitize_string(data.get('district', ''), max_len=100, field_name='District')
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email, and password are required'}), 400

    try:
        # Check if user exists (Standardized lookup)
        existing_res = supabase.table('users').select('id').eq('email', email).execute()
        if existing_res.data:
            return jsonify({'error': 'Email is already registered'}), 409

        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert into users table
        user_insert = supabase.table('users').insert({
            'email': email,
            'password_hash': password_hash,
            'full_name': name,
            'role': role
        }).execute()

        if not user_insert.data:
            print(f"FAILED user insert: email={email}, response={user_insert}")
            return jsonify({'error': 'Failed to create user account'}), 500
    except Exception as e:
        print(f"CRITICAL ERROR in registration: {str(e)}")
        # Log the full exception for better diagnostics
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

    new_user = user_insert.data[0]
    user_id = new_user['id']

    # Initialize profile tables
    if role == 'athlete':
        try:
            supabase.table('athletes').insert({
                'user_id': user_id,
                'full_name': name,
                'sport': sport or 'General',
                'state': state,
                'district': district,
                'bio': 'Young athlete eager to improve and find top coaches.'
            }).execute()
        except Exception as e:
            print(f"Non-fatal error creating athlete profile: {str(e)}")
    elif role == 'coach':
        try:
            # 🚀 Hardened Provisioning: Registering coach profile immediately with is_verified=False
            res = supabase.table('coaches').insert({
                'user_id': user_id,
                'full_name': name,
                'sport': sport or 'General Coaching',
                'state': state,
                'district': district,
                'experience_years': 0,
                'organisation': 'Pending Verification',
                'bio': f'Professional coach specializing in {sport or "Sports"}.',
                'is_verified': False
            }).execute()
            
            if not res.data:
                print(f"⚠️ Warning: Profile insertion for coach {user_id} returned no data.")
        except Exception as e:
            print(f"🚨 CRITICAL ERROR creating coach profile: {str(e)}")
            import traceback
            traceback.print_exc()

    token = create_access_token(
        identity=user_id,
        additional_claims={'role': role, 'email': email}
    )

    log_auth_attempt(email, success=True, reason='registration')
    
    res_user = {
        'id': user_id,
        'name': name,
        'email': email,
        'role': str(role),
        'sport': sport
    }
    
    if role == 'coach':
        res_user['experience_years'] = 0
        res_user['onboarding_status'] = 'new' # 🪄 Master Sync: New coaches MUST go to /coach/apply
        res_user['is_verified'] = False

    return jsonify({
        'user': res_user,
        'token': token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT."""
    data = request.json or {}
    raw_email = data.get('email', '')
    raw_password = data.get('password', '')

    if not raw_email or not raw_password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        email = validate_email(raw_email)
    except ValueError:
        log_auth_attempt(raw_email, success=False, reason='invalid email format')
        return jsonify({'error': 'Invalid email format'}), 400

    # ── Check Supabase for all users (Indestructible lookup) ──
    user_q = supabase.table('users').select('*').eq('email', email).execute()
    if user_q.data:
        user_record = user_q.data[0]
        # Verify bcrypt-hashed password
        stored_hash = user_record.get('password_hash', '')
        if not stored_hash or not bcrypt.checkpw(
            raw_password.encode('utf-8'),
            stored_hash.encode('utf-8')
        ):
            log_auth_attempt(email, success=False, reason='wrong password')
            return jsonify({'error': 'Invalid credentials'}), 401

        # ── Role Verification (Security Hardening) ──
        role = user_record.get('role', 'athlete')
        requested_role = data.get('role') # 'athlete' or 'coach' (passed from Login.jsx)
        
        if requested_role and requested_role != role:
            # Prevent athlete from logging into coach dashboard and vice versa
            log_auth_attempt(email, success=False, reason=f'role mismatch: expected {requested_role} got {role}')
            return jsonify({'error': f'This account is registered as an {role}. Please sign in using the appropriate login portal.'}), 403

        # Fetch athlete/coach details if applicable
        
        user_data = {
            'id': user_record['id'],
            'name': user_record.get('full_name', ''),
            'email': user_record['email'],
            'role': str(role), # Ensure it is a string for the frontend
        }
        
        # ── Fetch Coach Metadata for Onboarding Detection ──
        if role == 'coach':
            try:
                coach_q = supabase.table('coaches').select('experience_years, is_verified').eq('user_id', user_record['id']).execute()
                if coach_q.data:
                    coach_data = coach_q.data[0]
                    user_data['experience_years'] = coach_data.get('experience_years', 0)
                    user_data['is_verified'] = coach_data.get('is_verified', False)
                    # 🪄 Master Sync: Definitve Onboarding Status to end Redirect Loops
                    # We only consider them 'approved' if is_verified is True.
                    # 'pending' means they have a coach record but aren't verified.
                    user_data['onboarding_status'] = 'approved' if user_data['is_verified'] else 'pending'
                else:
                    user_data['experience_years'] = 0
                    user_data['is_verified'] = False
                    user_data['onboarding_status'] = 'new' # 🪄 Signifies the coach hasn't applied yet
            except Exception as e:
                print(f"Non-fatal error fetching coach metadata: {e}")
                user_data['onboarding_status'] = 'new'

        token = create_access_token(
            identity=user_record['id'],
            additional_claims={'role': role, 'email': email}
        )
        log_auth_attempt(email, success=True, reason='supabase login')
        return jsonify({'user': user_data, 'token': token})

    # ── No fallback — unknown accounts are rejected ──
    log_auth_attempt(email, success=False, reason='account not found')
    return jsonify({'error': 'Invalid credentials'}), 401
