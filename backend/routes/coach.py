from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware import require_role
from utils.validators import sanitize_string
from utils.supabase_client import supabase

coach_bp = Blueprint('coach', __name__)

@coach_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_as_coach():
    """Submit a coach application with professional documents and summary."""
    user_id = get_jwt_identity()
    
    # Handle both multipart/form-data (for files) and json (fallback)
    data = request.form if request.form else (request.json or {})
    files = request.files

    try:
        sport = sanitize_string(data.get('sport', ''), max_len=50)
        organisation = sanitize_string(data.get('organisation', ''), max_len=200)
        statement = sanitize_string(data.get('statement', ''), max_len=2000)
        
        raw_exp = data.get('experience_yrs', '0')
        experience_yrs = int(raw_exp) if str(raw_exp).isdigit() else 0
    except (ValueError, TypeError) as e:
        return jsonify({'error': f"Invalid data format: {str(e)}"}), 400

    update_payload = {
        'user_id': user_id,
        'sport': sport,
        'experience_years': experience_yrs,
        'organisation': organisation,
        'bio': statement
    }

    # ── Handle File Uploads ──
    try:
        # 1. Certificate Upload
        if 'certificate' in files:
            cert_file = files['certificate']
            cert_path = f"certificates/{user_id}_{cert_file.filename}"
            supabase.storage.from_('coach-documents').upload(cert_path, cert_file.read(), {"content-type": cert_file.content_type})
            update_payload['certificate_url'] = supabase.storage.from_('coach-documents').get_public_url(cert_path)

        # 2. ID Proof Upload
        if 'idProof' in files:
            id_file = files['idProof']
            id_path = f"id_proofs/{user_id}_{id_file.filename}"
            supabase.storage.from_('coach-documents').upload(id_path, id_file.read(), {"content-type": id_file.content_type})
            update_payload['id_proof_url'] = supabase.storage.from_('coach-documents').get_public_url(id_path)

    except Exception as e:
        print(f"ERROR: File upload failed: {e}")
        return jsonify({'error': f"File upload failed: {str(e)}"}), 500

    try:
        # Upsert into coaches table
        res = supabase.table('coaches').upsert(update_payload).execute()
        
        if not res.data:
            return jsonify({'error': 'Failed to submit application: No data returned'}), 500

        return jsonify({
            'message': 'Application submitted successfully',
            'onboarding_status': 'pending'
        }), 201
    except Exception as e:
        print(f"CRITICAL: Coach application error: {str(e)}")
        return jsonify({'error': f"Database error: {str(e)}"}), 500


@coach_bp.route('/applications', methods=['GET'])
@jwt_required()
@require_role('admin', 'founder')
def list_applications():
    """List pending coach applications from Supabase."""
    # Note: is_verified is NOT a column in coaches table. 
    # We select all coaches or check the verified_coaches table for status.
    res = supabase.table('coaches').select('*, users!user_id(*)').execute()
    
    apps = []
    for row in res.data:
        user = row['users']
        apps.append({
            'id': row['user_id'],
            'name': user['full_name'],
            'sport': row['sport'],
            'experience_yrs': row.get('experience_years', 0),
            'organisation': row.get('organisation'),
            'statement': row.get('bio'),
            'status': 'pending'
        })
    return jsonify(apps)


@coach_bp.route('/approve/<app_id>', methods=['POST'])
@jwt_required()
@require_role('admin', 'founder')
def approve_coach(app_id):
    """Approve a coach in Supabase."""
    res = supabase.table('coaches').update({'status': 'approved'}).eq('user_id', app_id).execute()
    if not res.data:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'message': f'Coach {app_id} approved'})

@coach_bp.route('/status', methods=['GET'])
@jwt_required()
def get_coach_status():
    user_id = get_jwt_identity()
    
    # 🎯 Primary Check: Is user in verified_coaches?
    try:
        v_check = supabase.table('verified_coaches').select('user_id').eq('user_id', user_id).execute()
        if v_check.data:
            return jsonify({'onboarding_status': 'approved'})
    except Exception as e:
        print(f"⚠️ Status check warning: {e}")

    # Fallback to profile flag
    coach_q = supabase.table('coaches').select('is_verified').eq('user_id', user_id).execute()
    if coach_q.data:
        is_verified = coach_q.data[0].get('is_verified', False)
        return jsonify({'onboarding_status': 'approved' if is_verified else 'pending'})
        
    return jsonify({'onboarding_status': 'new'})

# Known sports list for 'Other' filter logic
KNOWN_SPORTS = ['athletics', 'wrestling', 'boxing', 'badminton', 'cricket', 'football', 'swimming', 'kabaddi', 'hockey', 'weightlifting']

@coach_bp.route('/browse-athletes', methods=['GET'])
@jwt_required()
@require_role('coach', 'admin', 'founder')
def browse_athletes():
    """Browse all athletes from Supabase. Supports filters."""
    search = request.args.get('search', '').lower()
    sport_filter = request.args.get('sport', '').lower()

    # 1. Fetch Athletes (Indestructible manual resolution)
    try:
        query = supabase.table('athletes').select('*').execute()
        raw_athletes = query.data or []
    except Exception as e:
        print(f"ERROR: browse_athletes query failed: {e}")
        return jsonify([])
    
    results = []
    for row in raw_athletes:
        aid = row.get('user_id')
        if not aid: continue

        # Manual User Lookup
        u_res = supabase.table('users').select('*').eq('id', aid).execute()
        if not u_res.data: continue
        user = u_res.data[0]
        
        # Simple Python filtering for demo agility
        name = user.get('full_name', 'Unknown')
        sport = row.get('sport', 'General')
        email = user.get('email', '')
        
        if search and search not in name.lower() and search not in sport.lower() and search not in (row.get('state', '')).lower():
            continue
        
        # Sport filter: 'other' means sports NOT in the known list
        if sport_filter == 'other':
            if sport.lower() in KNOWN_SPORTS:
                continue
        elif sport_filter and sport_filter != sport.lower():
            continue

        results.append({
            'id': aid,
            'name': name,
            'email': email,
            'sport': sport,
            'state': row.get('state', '-'),
            'district': row.get('district', '-'),
            'bio': row.get('bio', ''),
            'avgScore': 0,
            'totalVideos': 0
        })

    return jsonify(results)


@coach_bp.route('/reviews', methods=['GET'])
@jwt_required()
@require_role('coach', 'admin', 'founder')
def list_reviews():
    """List videos from connected athletes that need review."""
    user_id = get_jwt_identity()

    # 1. Get connected athletes
    try:
        conn_res = supabase.table('connections').select('*').or_(f"requester_id.eq.{user_id},target_id.eq.{user_id}").eq('status', 'accepted').execute()
        connections = conn_res.data or []
    except Exception as e:
        print(f"ERROR: connections for reviews: {e}")
        return jsonify([])

    athlete_ids = []
    for c in connections:
        rid = c.get('requester_id')
        tid = c.get('target_id') or c.get('Target_id')
        athlete_id = rid if tid == user_id else tid
        if athlete_id: athlete_ids.append(athlete_id)

    if not athlete_ids:
        return jsonify([])

    # 2. Fetch videos for these athletes
    try:
        video_res = supabase.table('feed_videos').select('*').in_('athlete_id', athlete_ids).order('created_at', desc=True).limit(20).execute()
        videos = video_res.data or []
    except Exception as e:
        print(f"ERROR: videos for reviews: {e}")
        return jsonify([])

    # 3. Format response
    results = []
    for v in videos:
        u_res = supabase.table('users').select('full_name').eq('id', v['athlete_id']).execute()
        uname = u_res.data[0]['full_name'] if u_res.data else 'Athlete'

        results.append({
            'id': v['id'],
            'athlete_id': v['athlete_id'],
            'athlete': uname,
            'exercise': v.get('exercise') or v.get('exercise_name', 'Exercise'),
            'score': int(v.get('ai_score', 0)),
            'submitted': v.get('created_at', 'Just now'),
            'status': 'pending'
        })

    return jsonify(results)


@coach_bp.route('/suggestions', methods=['GET'])
@jwt_required()
@require_role('coach', 'admin', 'founder')
def list_suggestions():
    """Suggest athletes matching coach's sport who are NOT connected."""
    user_id = get_jwt_identity()
    
    # 1. Get coach's sport
    coach_q = supabase.table('coaches').select('sport').eq('user_id', user_id).execute()
    if not coach_q.data:
        return jsonify([])
    coach_sport = coach_q.data[0]['sport']

    # 2. Get connected athletes (to exclude)
    connected_ids = set()
    conn_q = supabase.table('connections').select('*').or_(f"requester_id.eq.{user_id},target_id.eq.{user_id}").execute()
    for c in (conn_q.data or []):
        rid = c.get('requester_id')
        tid = c.get('target_id') or c.get('Target_id')
        connected_ids.add(tid if rid == user_id else rid)

    # 3. Hunt for athletes in the same sport
    athlete_q = supabase.table('athletes').select('*').ilike('sport', f"%{coach_sport}%").limit(5).execute()
    
    suggestions = []
    for row in (athlete_q.data or []):
        aid = row.get('user_id')
        if aid == user_id or aid in connected_ids:
            continue
            
        u_res = supabase.table('users').select('full_name').eq('id', aid).execute()
        uname = u_res.data[0]['full_name'] if u_res.data else 'Unknown'
        
        suggestions.append({
            'id': aid,
            'name': uname,
            'sport': row.get('sport'),
            'state': row.get('state', ''),
            'bio': row.get('bio', '')
        })
        
    return jsonify(suggestions)

