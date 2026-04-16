from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from utils.validators import sanitize_string
from utils.supabase_client import supabase

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/<user_id>', methods=['GET'])
@jwt_required(optional=True)
def get_profile(user_id):
    """Get a user's profile and latest stats from Supabase."""
    current_user_id = get_jwt_identity()
    is_own = current_user_id == user_id

    # 1. Fetch base user data (Robust individual lookup)
    user_q = supabase.table('users').select('*').eq('id', user_id).execute()
    if not user_q.data:
        return jsonify({'error': 'Profile not found'}), 404
    user = user_q.data[0]
    role = user.get('role', 'athlete')

    # 2. Fetch role-specific data (Manual resolution)
    detailed_data = {}
    if role == 'athlete':
        athlete_q = supabase.table('athletes').select('*').eq('user_id', user_id).execute()
        detailed_data = athlete_q.data[0] if athlete_q.data else {}
    elif role == 'coach':
        coach_q = supabase.table('coaches').select('*').eq('user_id', user_id).execute()
        detailed_data = coach_q.data[0] if coach_q.data else {}

    # 3. Calculate stats from feed_videos (Robust metadata retrieval)
    video_q = supabase.table('feed_videos').select('*').eq('athlete_id', user_id).execute()
    subs = video_q.data or []
    total_videos = len(subs)
    
    # Defensive score calculation (handles various keys like ai_score/score)
    scores = []
    for s in subs:
        score = s.get('ai_score') or s.get('score') or 0
        scores.append(score)
    avg_score = round(sum(scores) / total_videos) if total_videos > 0 else 0

    # 4. Resolve connection status (Immortal Logic)
    conn_status = 'none'
    if is_own:
        conn_status = 'self'
    elif current_user_id:
        res_data = []
        try:
            q = supabase.table('connections').select('status').or_(
                f"and(requester_id.eq.{current_user_id},target_id.eq.{user_id}),and(requester_id.eq.{user_id},target_id.eq.{current_user_id})"
            ).execute()
            res_data = q.data or []
        except: pass
        if not res_data:
            try:
                q = supabase.table('connections').select('status').or_(
                    f"and(requester_id.eq.{current_user_id},Target_id.eq.{user_id}),and(requester_id.eq.{user_id},Target_id.eq.{current_user_id})"
                ).execute()
                res_data = q.data or []
            except: pass
        if res_data:
            conn_status = res_data[0].get('status', 'none')

    # Data Gating Determination
    can_see_full = is_own or conn_status in ['accepted', 'self']

    # Format the response
    profile_data = {
        'id': user['id'],
        'name': user['full_name'],
        'role': role,
        'sport': detailed_data.get('sport', 'General'),
        'state': detailed_data.get('state', 'Unknown'),
        'district': detailed_data.get('district', 'Unknown'),
        'bio': detailed_data.get('bio', 'Athlete looking to improve.'),
        'is_active': user['is_active'],
        'joined': user['created_at'][:10],
        'connection_status': conn_status,
        'stats': {
            'videos': total_videos,
            'avgScore': avg_score
        },
        'submissions': []
    }

    # Append submissions (Supports both ai_score and legacy score keys)
    for sub in sorted(subs, key=lambda x: x.get('created_at', ''), reverse=True):
        sub_entry = {
            'id': sub.get('id'),
            'exercise': sub.get('exercise') or sub.get('exercise_name', 'Exercise'),
            'score': sub.get('ai_score') or sub.get('score', 0),
            'date': sub.get('created_at'),
            'thumb': '🎥'
        }
        # Only share video URL if authorized (self or connected)
        if can_see_full:
            sub_entry['video_url'] = sub.get('video_url')
            
        profile_data['submissions'].append(sub_entry)
        
    if is_own:
        profile_data['email'] = user.get('email')

    return jsonify(profile_data)


@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get the authenticated user's own profile."""
    user_id = get_jwt_identity()
    return get_profile(user_id)


@profile_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the authenticated user's profile in Supabase."""
    user_id = get_jwt_identity()
    data = request.json or {}

    # Fetch current role
    user_query = supabase.table('users').select('role').eq('id', user_id).execute()
    if not user_query.data:
        return jsonify({'error': 'User not found'}), 404
    
    role = user_query.data[0]['role']

    # Fields for 'users' table
    user_updates = {}
    if 'name' in data:
        user_updates['full_name'] = sanitize_string(data['name'], max_len=100)
    
    if user_updates:
        supabase.table('users').update(user_updates).eq('id', user_id).execute()

    # Fields for role tables (athletes/coaches)
    role_updates = {}
    allowed_role_fields = {'sport', 'state', 'district', 'bio'}
    for field in allowed_role_fields:
        if field in data:
            max_len = 500 if field == 'bio' else 100
            role_updates[field] = sanitize_string(data[field], max_len=max_len)

    if role_updates:
        table_name = 'athletes' if role == 'athlete' else 'coaches'
        supabase.table(table_name).update(role_updates).eq('user_id', user_id).execute()

    return jsonify({'message': 'Profile updated successfully', 'id': user_id})

