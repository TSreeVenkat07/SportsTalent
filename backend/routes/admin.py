from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware import require_role
from utils.validators import validate_email, sanitize_string
from utils.supabase_client import supabase
import string
import secrets
import bcrypt
import uuid

def log_founder_action(action_type, details, target_id=None):
    """Log a sensitive action performed by a founder."""
    try:
        identity = get_jwt_identity()
        performed_by = None
        
        # If identity is a valid UUID, use it as performed_by
        try:
            if identity and identity != 'founder-godmode':
                uuid.UUID(str(identity))
                performed_by = identity
        except ValueError:
            pass # Use None if not a valid UUID

        supabase.table('founder_actions').insert({
            'action_type': action_type,
            'details': details,
            'target_id': target_id if target_id and target_id != 'founder-godmode' else None,
            'performed_by': performed_by
        }).execute()
    except Exception as e:
        print(f"FAILED TO LOG FOUNDER ACTION: {e}")

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/create', methods=['POST'])
@jwt_required()
@require_role('founder')
def create_admin():
    """Create a new admin account (founder only) in Supabase."""
    founder_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        name = sanitize_string(data.get('name', ''), max_len=100)
        email = validate_email(data.get('email', ''))
        role = data.get('role', 'admin')
        sport_scope = sanitize_string(data.get('sport_scope', 'all'), max_len=50)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    # Check if exists
    existing = supabase.table('users').select('id').eq('email', email).execute()
    if existing.data:
        return jsonify({'error': 'A user with this email already exists'}), 409

    # Generate or Use manual password
    manual_password = data.get('password')
    temp_password = manual_password if manual_password else ('STH_' + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)))
    password_hash = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Insert into users
    user_res = supabase.table('users').insert({
        'email': email,
        'password_hash': password_hash,
        'full_name': name,
        'role': role
    }).execute()
    
    if not user_res.data:
        return jsonify({'error': 'Failed to create user'}), 500
        
    user_id = user_res.data[0]['id']

    # Insert into admins table
    supabase.table('admins').insert({
        'user_id': user_id,
        'sport_scope': sport_scope,
        'assigned_by': founder_id if founder_id != 'founder-godmode' else None,
        'permissions': data.get('permissions', {})
    }).execute()

    # Log action
    log_founder_action(
        'ADMIN_CREATED', 
        f"Created admin account for {name} ({email})",
        target_id=user_id
    )

    return jsonify({
        'message': 'Admin account created.',
        'user_id': user_id,
        'email': email,
        'temp_password': temp_password,
        'role': role,
    }), 201


@admin_bp.route('/team', methods=['GET'])
@jwt_required()
@require_role('founder')
def list_team():
    """List all administrative staff with their permissions (Robust)."""
    try:
        # 1. Fetch users with appropriate roles
        users_res = supabase.table('users').select('*').in_('role', ['admin', 'founder', 'reviewer']).execute()
        users_list = users_res.data or []
        user_ids = [u['id'] for u in users_list]

        # 2. Fetch corresponding admin info
        admins_res = supabase.table('admins').select('*').in_('user_id', user_ids).execute()
        admins_map = {a['user_id']: a for a in (admins_res.data or [])}
        
    except Exception as e:
        print(f"ERROR: list_team database query failed: {e}")
        # Fallback to simple user fetch if admins table is problematic
        try:
            users_res = supabase.table('users').select('*').in_('role', ['admin', 'founder', 'reviewer']).execute()
            users_list = users_res.data or []
            admins_map = {}
        except:
            return jsonify([])
    
    team = []
    print(f"DEBUG: Processing {len(users_list)} users with {len(admins_map)} admin records.")
    
    for u in users_list:
        uid = u.get('id')
        admin_info = admins_map.get(uid, {})
        
        # Merge permissions and other admin-only fields
        member = {
            'id': uid,
            'name': u.get('full_name', 'System Admin'),
            'email': u.get('email'),
            'role': u.get('role'),
            'sport_scope': admin_info.get('sport_scope') or u.get('sport_scope', 'all'),
            'is_active': u.get('is_active', True),
            'permissions': admin_info.get('permissions', {})
        }
        team.append(member)
        print(f"DEBUG: Added team member {member['email']} with role {member['role']}")
    
    print(f"DEBUG: Final team list size: {len(team)}")
    return jsonify(team)


@admin_bp.route('/revoke/<admin_id>', methods=['POST'])
@jwt_required()
@require_role('founder')
def revoke_admin(admin_id):
    """Revoke/Deactivate an admin account in Supabase (Hardened)."""
    # Use silent=True to prevent 415 errors if Content-Type is missing
    request.get_json(silent=True)
    
    res = supabase.table('users').update({'is_active': False}).eq('id', admin_id).execute()
    if not res.data:
        return jsonify({'error': 'Admin not found'}), 404
    
    # Log action
    log_founder_action(
        'ADMIN_REVOKED', 
        f"Revoked/Deactivated admin ID {admin_id}",
        target_id=admin_id
    )
    
    return jsonify({'message': f'Admin {admin_id} deactivated'})


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_role('admin', 'founder', 'reviewer')
def get_admin_stats():
    """Fetch real-time platform statistics for the administration dashboard."""
    try:
        # Total Athletes
        athletes_count = supabase.table('athletes').select('user_id', count='exact').execute().count or 0
        
        # Total Coaches
        coaches_count = supabase.table('coaches').select('user_id', count='exact').execute().count or 0
        
        # Verified Coaches (Active)
        try:
            verified_count = supabase.table('verified_coaches').select('user_id', count='exact').execute().count or 0
        except:
            verified_count = 0
            
        # Total Videos
        try:
            videos_count = supabase.table('feed_videos').select('id', count='exact').execute().count or 0
        except:
            videos_count = 0

        return jsonify({
            'athletes': athletes_count,
            'coaches': verified_count,
            'pending_apps': max(0, coaches_count - verified_count),
            'videos': videos_count
        })
    except Exception as e:
        print(f"ERROR: get_admin_stats failed: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/applications', methods=['GET'])
@jwt_required()
@require_role('admin', 'founder', 'reviewer')
def list_coach_applications():
    """List all coaches and their current verification status."""
    try:
        # 1. Fetch ALL Coaches
        res = supabase.table('coaches').select('*, users!user_id(full_name, email)').execute()
        raw_coaches = res.data or []
        
        # 2. Fetch Verified IDs
        verified_res = supabase.table('verified_coaches').select('user_id').execute()
        verified_ids = {v['user_id'] for v in (verified_res.data or [])}
    except Exception as e:
        print(f"ERROR: list_coach_applications failed. Error: {e}")
        if 'relation "verified_coaches" does not exist' in str(e):
            return jsonify({'error': 'Database Migration Required: Please run the admin_infrastructure_v3.sql script in Supabase.'}), 503
        return jsonify([])
    
    applications = []
    for c in raw_coaches:
        cid = c.get('user_id')
        u = c.get('users', {})
        status = 'approved' if cid in verified_ids else 'pending'
        
        applications.append({
            'user_id': cid,
            'id': cid, # Support both key variations
            'name': u.get('full_name', 'Unknown Coach'),
            'email': u.get('email', '-'),
            'sport': c.get('sport', 'General'),
            'experience': c.get('experience_years', 0),
            'experience_yrs': c.get('experience_years', 0), # Support both key variations
            'organisation': c.get('organisation', '-'),
            'status': status,
            'ai_decision': status, # Default for legacy UI
            'ai_score': 85 if status == 'approved' else 45, # Simulation of scores
            'certificate_url': c.get('certificate_url'),
            'id_proof_url': c.get('id_proof_url'),
            'bio': c.get('bio', '')
        })
            
    return jsonify(applications)


@admin_bp.route('/approve-coach/<coach_id>', methods=['POST'])
@jwt_required()
@require_role('admin', 'founder')
def approve_coach(coach_id):
    """Approve a coach application and move them to verified_coaches (Robust Perfection)."""
    admin_id = get_jwt_identity()
    # Use silent=True to prevent 415 errors if Content-Type is missing
    data = request.get_json(silent=True) or {}
    
    try:
        # 1. Verify existence and role in users table
        user_q = supabase.table('users').select('role, full_name').eq('id', coach_id).execute()
        if not user_q.data:
            return jsonify({'error': 'Coach not found in users database'}), 404
        if user_q.data[0]['role'] != 'coach':
            return jsonify({'error': 'Specified user is not a coach profile'}), 400
            
        # 2. PROVISIONING FIX: Auto-Create missing coach profile if it doesn't exist
        profile_q = supabase.table('coaches').select('user_id').eq('user_id', coach_id).execute()
        if not profile_q.data:
            print(f"🚩 Admin Approval Sync: Auto-creating missing coach profile for {coach_id}")
            supabase.table('coaches').insert({
                'user_id': coach_id,
                'full_name': user_q.data[0]['full_name'],
                'sport': 'General',
                'experience_years': 1,
                'organisation': 'Self',
                'bio': f"Profile auto-provisioned during admin approval for {user_q.data[0]['full_name']}.",
                'is_verified': True
            }).execute()
        else:
            # Sync Verification Status flag
            supabase.table('coaches').update({'is_verified': True}).eq('user_id', coach_id).execute()

        # 3. Check if already verified in verified_coaches list
        exists = supabase.table('verified_coaches').select('user_id').eq('user_id', coach_id).execute()
        if exists.data:
            return jsonify({'message': 'Coach is already verified and active', 'status': 'already_verified'}), 200
            
        # 4. Insert into verified_coaches (The actual approval)
        try:
            res = supabase.table('verified_coaches').insert({
                'user_id': coach_id,
                'verified_by': admin_id,
                'verification_notes': data.get('notes', 'Approved via Admin Panel Flow'),
                'level': data.get('level', 'Standard')
            }).execute()
        except Exception as e:
            if 'duplicate key value' in str(e) or '23505' in str(e):
                pass # Already verified, ignore duplicate insert error
            else:
                raise e
        
        # 5. Update coaches table to sync Verification Status
        supabase.table('coaches').update({
            'is_verified': True
        }).eq('user_id', coach_id).execute()
        
        if not res.data:
            return jsonify({'error': 'Failed to create verification record in verified_coaches'}), 500
            
        # Log action in founder_actions
        log_founder_action(
            'COACH_APPROVED_VERIFIED', 
            f"Approved and Verified coach application for {user_q.data[0]['full_name']} (ID {coach_id})",
            target_id=coach_id
        )

        return jsonify({
            'message': f"Coach {user_q.data[0]['full_name']} approved and moves to Verified Coaches table.",
            'coach_id': coach_id,
            'status': 'success'
        }), 200
    except Exception as e:
        print(f"CRITICAL: approve_coach failed for {coach_id}. Error: {e}")
        if 'relation "verified_coaches" does not exist' in str(e):
            return jsonify({'error': 'Database Migration Required: Please run the admin_infrastructure_v3.sql script in Supabase.'}), 503
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/reject-coach/<coach_id>', methods=['POST'])
@jwt_required()
@require_role('admin', 'founder')
def reject_coach(coach_id):
    """Reject a coach application and remove ALL details from the database (Global Delete)."""
    try:
        # 1. Remove from verified_coaches (if any)
        supabase.table('verified_coaches').delete().eq('user_id', coach_id).execute()
        
        # 2. Remove from connections (any direction)
        supabase.table('connections').delete().or_(f"requester_id.eq.{coach_id},target_id.eq.{coach_id}").execute()
        # Fallback for legacy casing
        try:
            supabase.table('connections').delete().or_(f"requester_id.eq.{coach_id},Target_id.eq.{coach_id}").execute()
        except: pass
        
        # 3. Remove from feed_videos (if any)
        supabase.table('feed_videos').delete().eq('athlete_id', coach_id).execute()
        
        # 4. Remove from athletes table (if any)
        supabase.table('athletes').delete().eq('user_id', coach_id).execute()
        
        # 5. Remove from coaches table
        supabase.table('coaches').delete().eq('user_id', coach_id).execute()
        
        # 6. Remove from admins table (just in case)
        supabase.table('admins').delete().eq('user_id', coach_id).execute()
        
        # 7. Remove from base users table (The final deletion)
        res = supabase.table('users').delete().eq('id', coach_id).execute()
        
        if not res.data:
            return jsonify({'error': 'Coach not found in users table'}), 404
            
        # Log action in founder_actions
        log_founder_action(
            'COACH_REJECTED_GLOBAL_DELETE', 
            f"Rejected coach ID {coach_id} (Global Account Deletion performed).",
            target_id=coach_id
        )

        return jsonify({'message': f'Coach {coach_id} rejected and deleted from the platform entire database.'}), 200
    except Exception as e:
        print(f"CRITICAL: reject_coach failed for {coach_id}. Error: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/audit-log', methods=['GET'])
@jwt_required()
@require_role('admin', 'founder')
def get_audit_log():
    """View the audit log from founder_actions."""
    try:
        res = supabase.table('founder_actions').select('*').order('created_at', desc=True).limit(20).execute()
        logs = res.data or []
        
        # Format for frontend
        formatted_logs = []
        for l in logs:
            formatted_logs.append({
                'action': l.get('details', 'Unknown action'),
                'actor_role': 'founder', # Currently only founder actions logged here
                'time': l.get('created_at') # Frontend will handle formatting
            })
        return jsonify(formatted_logs)
    except Exception as e:
        print(f"Error fetching audit log: {e}")
        return jsonify([])
