from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware import require_role
from utils.validators import validate_uuid
from utils.supabase_client import supabase
from datetime import datetime

connections_bp = Blueprint('connections', __name__)

@connections_bp.route('/request', methods=['POST'])
@jwt_required()
def request_connection():
    """Athlete requests connection (Immortal Logic)."""
    requester_id = get_jwt_identity()
    data = request.json or {}
    target_id = data.get('target_id') or data.get('coach_id') or data.get('athlete_id')

    if not target_id:
        return jsonify({'error': 'target_id is required'}), 400

    if requester_id == target_id:
        return jsonify({'error': 'Cannot connect with yourself'}), 400

    # Determine roles for both users
    r_res = supabase.table('users').select('role').eq('id', requester_id).execute()
    t_res = supabase.table('users').select('role').eq('id', target_id).execute()

    if not r_res.data or not t_res.data:
        return jsonify({'error': 'One or both users not found'}), 404

    r_role = r_res.data[0]['role']
    t_role = t_res.data[0]['role']
    conn_type = 'athlete_athlete' if r_role == 'athlete' and t_role == 'athlete' else 'coach_athlete'

    # STRICT ENFORCEMENT: Coaches must be verified to connect
    if r_role == 'coach':
        v_check = supabase.table('verified_coaches').select('user_id').eq('user_id', requester_id).execute()
        if not v_check.data:
            return jsonify({'error': 'Unauthorized: Your coach account must be verified by STH Admin before connecting with athletes.'}), 403
            
    if t_role == 'coach':
        v_check = supabase.table('verified_coaches').select('user_id').eq('user_id', target_id).execute()
        if not v_check.data:
            return jsonify({'error': 'Unauthorized: This coach is not yet verified and cannot accept connections at this time.'}), 403

    # Insert with Immortal logic
    try:
        res = supabase.table('connections').insert({'requester_id': requester_id, 'target_id': target_id, 'status': 'accepted', 'type': conn_type}).execute()
        return jsonify({'message': 'Connection established', 'id': res.data[0]['id']}), 201
    except:
        try:
            res = supabase.table('connections').insert({'requester_id': requester_id, 'Target_id': target_id, 'status': 'accepted', 'type': conn_type}).execute()
            return jsonify({'message': 'Connection established (legacy fallback)', 'id': res.data[0]['id']}), 201
        except:
            return jsonify({'message': 'Connection already exists or check schema'}), 200

@connections_bp.route('/applications', methods=['GET'])
@jwt_required()
def list_applications():
    """List pending requests (Immortal logic)."""
    user_id = get_jwt_identity()
    raw_apps = []
    try:
        res = supabase.table('connections').select('*').eq('target_id', user_id).eq('status', 'pending').execute()
        raw_apps = res.data or []
    except: pass
    if not raw_apps:
        try:
            res = supabase.table('connections').select('*').eq('Target_id', user_id).eq('status', 'pending').execute()
            raw_apps = res.data or []
        except: pass
            
    applications = []
    for app in raw_apps:
        rid = app.get('requester_id')
        if not rid: continue
        u_res = supabase.table('users').select('*').eq('id', rid).execute()
        if not u_res.data: continue
        user = u_res.data[0]
        applications.append({ 'id': app.get('id'), 'requester': { 'id': rid, 'name': user.get('full_name'), 'role': user.get('role') }, 'created_at': app.get('created_at') })
    return jsonify(applications)

@connections_bp.route('/handle', methods=['POST'])
@jwt_required()
def handle_connection():
    """Accept/Reject request."""
    data = request.json or {}
    cid = data.get('connection_id')
    status = data.get('status') # accepted / rejected
    if not cid or status not in ['accepted', 'rejected']:
        return jsonify({'error': 'Invalid request'}), 400
    supabase.table('connections').update({'status': status}).eq('id', cid).execute()
    return jsonify({'message': f'Connection {status}'})


@connections_bp.route('/athletes', methods=['GET'])
@jwt_required()
@require_role('coach', 'admin', 'founder')
def list_connected_athletes():
    """List all athletes connected to the current coach."""
    user_id = get_jwt_identity()

    # Robust retrieval: Fetch connections and then manually fetch profiles
    user_id = get_jwt_identity()
    raw_conns = []
    
    # Try lowercase target_id first
    try:
        res = supabase.table('connections').select('*').or_(f"requester_id.eq.{user_id},target_id.eq.{user_id}").eq('status', 'accepted').execute()
        raw_conns = res.data or []
    except Exception:
        pass

    # If empty, try Capital T Target_id (Standard fallback)
    if not raw_conns:
        try:
            res = supabase.table('connections').select('*').or_(f"requester_id.eq.{user_id},Target_id.eq.{user_id}").eq('status', 'accepted').execute()
            raw_conns = res.data or []
        except Exception:
            pass

    print(f"DEBUG: Found {len(raw_conns)} accepted connections for user {user_id}")

    connected = []
    for conn in raw_conns:
        # Resolve 'other' user ID manually
        rid = conn.get('requester_id')
        tid = conn.get('target_id') or conn.get('Target_id')
        
        other_id = tid if rid == user_id else rid
        if not other_id: continue

        # Fetch basic user info
        user_q = supabase.table('users').select('*').eq('id', other_id).execute()
        if not user_q.data: continue
        other_user = user_q.data[0]

        # Fetch athlete profile info
        athlete_q = supabase.table('athletes').select('*').eq('user_id', other_id).execute()
        athlete_info = athlete_q.data[0] if athlete_q.data else {}

        # Fetch video count
        video_q = supabase.table('feed_videos').select('id', count='exact').eq('athlete_id', other_id).execute()
        video_count = video_q.count if hasattr(video_q, 'count') else 0

        connected.append({
            'id': other_id, # This is the user_id of the connected athlete
            'name': other_user.get('full_name', 'Unknown'),
            'sport': athlete_info.get('sport', '-'),
            'state': athlete_info.get('state', '-'),
            'status': 'accepted',
            'connected_at': conn.get('created_at'),
            'totalVideos': video_count,
            'latestScore': 0
        })

    return jsonify(connected)


@connections_bp.route('/status/<target_id>', methods=['GET'])
@jwt_required()
def check_connection_status(target_id):
    """Check connection status between current user and target."""
    user_id = get_jwt_identity()

    # Double-check casing for target_id vs Target_id (Industrial Strength)
    res_data = []
    try:
        # Combined query to check both directions and both casing variations
        q = supabase.table('connections').select('*').or_(
            f"and(requester_id.eq.{user_id},target_id.eq.{target_id}),"
            f"and(requester_id.eq.{target_id},target_id.eq.{user_id}),"
            f"and(requester_id.eq.{user_id},Target_id.eq.{target_id}),"
            f"and(requester_id.eq.{target_id},Target_id.eq.{user_id})"
        ).execute()
        res_data = q.data or []
    except Exception as e:
        print(f"DEBUG: Connection status check fallback triggered: {e}")
        # Desperate fallback: list all and filter
        try:
            q = supabase.table('connections').select('*').or_(f"requester_id.eq.{user_id},target_id.eq.{user_id},Target_id.eq.{user_id}").execute()
            res_data = [r for r in (q.data or []) if r.get('requester_id') == target_id or r.get('target_id') == target_id or r.get('Target_id') == target_id]
        except:
            res_data = []

    if res_data:
        return jsonify({
            'connected': True,
            'connection_id': res_data[0]['id'],
            'status': res_data[0]['status']
        })

