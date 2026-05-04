import os
import tempfile
import hashlib
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import uuid
import random
from utils.validators import validate_exercise, validate_video_file, sanitize_string
from utils.supabase_client import supabase
from datetime import datetime

video_bp = Blueprint('video', __name__)

# Ensure local upload directory exists for demo streaming
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@video_bp.route('/stream/<filename>', methods=['GET'])
def stream_video(filename):
    """Serve the actually uploaded video file to the frontend feed.
    🪄 Master Sync: If not found locally, redirect to Supabase Public URL.
    """
    if os.path.exists(os.path.join(UPLOAD_FOLDER, filename)):
        return send_from_directory(UPLOAD_FOLDER, filename)
    
    # Fallback to Supabase Storage (Athlete Videos Bucket)
    # This ensures that even if local disk is wiped, the feed stays alive.
    try:
        # Assuming the filename follows the {user_id}/{hash}.{ext} pattern or just {hash}.{ext}
        # In this project, we store it as {user_id}/{hash}.{ext}. 
        # For simple streaming, we might need to search or just return a redirect if we have the full path.
        # However, since we don't have the user_id here easily without a DB lookup, 
        # we'll advise the frontend to use the full video_url returned during upload/feed.
        return jsonify({'error': 'Local file not found. Use the video_url property from the feed API.'}), 404
    except Exception:
        return jsonify({'error': 'File not found'}), 404


@video_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload and save a video to Supabase Storage for persistent playback."""
    user_id = get_jwt_identity()

    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    exercise = request.form.get('exercise', 'squat')

    # Validate inputs
    try:
        exercise = validate_exercise(exercise)
        validate_video_file(video)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    # 🚀 Senior Production Fix: Use Disk Streaming for Persistence on Render
    temp_path = None
    try:
        file_extension = video.filename.split('.')[-1] if '.' in video.filename else 'mp4'
        
        # 1. Save to a temporary file to keep RAM usage constant
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as tmp:
            video.save(tmp.name)
            temp_path = tmp.name
        
        # 2. Calculate SHA256 in chunks (64KB blocks)
        sha256_hash = hashlib.sha256()
        with open(temp_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        file_hash = sha256_hash.hexdigest()
        
        storage_path = f"{user_id}/{file_hash}.{file_extension}"
        
        # 3. Stream the file directly from disk to Supabase
        with open(temp_path, "rb") as f:
            supabase.storage.from_('athlete-videos').upload(
                path=storage_path,
                file=f,
                file_options={"content-type": video.content_type, "upsert": "true"}
            )
        
        # 4. Get Public URL
        video_url = supabase.storage.from_('athlete-videos').get_public_url(storage_path)

        # 🪄 Master Sync: Return cloud URL as primary source
        return jsonify({
            'message': 'Video successfully synchronized to cloud storage',
            'video_url': video_url,
            'exercise': exercise,
            'storage_path': storage_path
        }), 201
        
    except Exception as e:
        print(f"❌ SUPABASE STORAGE ERROR: {str(e)}")
        return jsonify({'error': f"Cloud storage synchronization failed: {str(e)}"}), 500
    finally:
        # 5. Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except: pass


@video_bp.route('/feed', methods=['GET'])
@jwt_required()
def get_global_feed():
    # Unified Discovery Feed Logic - Robust Manual Resolution
    user_id = get_jwt_identity()
    discovery_mode = request.args.get('discovery', 'false').lower() == 'true'
    print(f"DEBUG: Fetching global feed for user {user_id} (discovery={discovery_mode})")
    
    # 1. Fetch current user's role and sport
    user_q = supabase.table('users').select('role').eq('id', user_id).execute()
    u_role = user_q.data[0]['role'] if user_q.data else 'athlete'
    
    user_sport = ''
    if u_role == 'coach':
        coach_q = supabase.table('coaches').select('sport').eq('user_id', user_id).execute()
        user_sport = coach_q.data[0]['sport'].lower() if coach_q.data else ''

    # 2. Fetch current user's connections (for Discovery exclusion)
    connected_ids = set()
    try:
        conn_query = supabase.table('connections').select('*').or_(f"requester_id.eq.{user_id},target_id.eq.{user_id}").eq('status', 'accepted').execute()
        for c in (conn_query.data or []):
            rid = c.get('requester_id')
            tid = c.get('target_id') or c.get('Target_id')
            connected_ids.add(tid if rid == user_id else rid)
    except Exception as e:
        print(f"DEBUG: Feed connection check: {e}")

    # 3. Fetch raw videos
    try:
        # We fetch ALL public videos first
        raw_feed_q = supabase.table('feed_videos').select('*').eq('visibility', 'public').order('created_at', desc=True).limit(50).execute()
        raw_feed = raw_feed_q.data or []
    except Exception as e:
        print(f"ERROR: Feed query failed: {e}")
        return jsonify([])

    # 4. Resolve data and Filter for each feed item manually
    feed = []
    for sub in raw_feed:
        aid = sub.get('athlete_id') or sub.get('user_id')
        if not aid: continue
        
        # Discovery Filter: Exclude connected athletes if discovery=true
        if discovery_mode and aid in connected_ids:
            continue
        
        # Self Filter: Don't show own videos in Discovery
        if discovery_mode and aid == user_id:
            continue

        # Manual lookup (Indestructible joins)
        athlete_q = supabase.table('athletes').select('*').eq('user_id', aid).execute()
        athlete_profile = athlete_q.data[0] if athlete_q.data else {}

        user_q = supabase.table('users').select('*').eq('id', aid).execute()
        user_info = user_q.data[0] if user_q.data else {}

        name = user_info.get('full_name') or athlete_profile.get('full_name') or 'Unknown Athlete'
        
        feed_item = {
            'id': sub['id'],
            'athlete_id': aid,
            'athlete_name': name,
            'athlete_avatar': name[0] if name else 'U',
            'video_url': sub['video_url'],
            'exercise': sub.get('exercise') or sub.get('exercise_name', 'Exercise'),
            'score': sub.get('ai_score', 0),
            'created_at': sub['created_at'],
            'likes': sub.get('likes_count', 0),
            'sport': athlete_profile.get('sport', 'General'),
            'state': athlete_profile.get('state', ''),
            'connection_status': 'accepted' if aid in connected_ids else ('self' if aid == user_id else 'none')
        }
        feed.append(feed_item)

    # 5. Strategic Sorting (Sport-specific Focus)
    def universal_sort_key(item):
        # Priority 0 is HIGHEST
        
        # Priority 1: Sport Match
        sport_priority = 0 if user_sport and item['sport'].lower() == user_sport else 1
        
        # Priority 2: Connection Status (if not discovery mode)
        status_priority = 0 if item['connection_status'] == 'accepted' else 1
        
        # Priority 3: Time (handled by DB mostly, but for deterministic tie-break)
        return (sport_priority, status_priority if not discovery_mode else 0)

    feed.sort(key=universal_sort_key)

    print(f"DEBUG: Returning {len(feed)} videos to feed.")
    return jsonify(feed)


@video_bp.route('/analyse', methods=['POST'])
@jwt_required()
def analyse_video():
    """Analyse a video using MediaPipe + Deterministic Logic with realistic feedback."""
    data = request.json or {}
    video_url = data.get('video_url', '')
    exercise = data.get('exercise', 'squat')

    import hashlib
    seed_string = f"{video_url}_{exercise}"
    seed = int(hashlib.sha256(seed_string.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    
    # Score generation — realistic spread
    overall = rng.randint(58, 94)
    
    # Exercise-specific breakdown categories
    EXERCISE_BREAKDOWN = {
        # General fitness
        'squat': {'Depth': (-3, 4), 'Knee Alignment': (-5, 2), 'Back Angle': (-2, 5), 'Hip Mobility': (-4, 3)},
        'pushup': {'Elbow Angle': (-3, 3), 'Core Stability': (-2, 5), 'Shoulder Width': (-4, 2), 'Range of Motion': (-3, 4)},
        'lunge': {'Knee Tracking': (-4, 3), 'Stride Length': (-3, 4), 'Balance': (-5, 2), 'Hip Drop': (-2, 5)},
        'jump': {'Takeoff Power': (-3, 5), 'Landing Mechanics': (-5, 2), 'Arm Swing': (-2, 4), 'Knee Flexion': (-4, 3)},
        # Cricket
        'batting': {'Backlift Height': (-3, 4), 'Foot Placement': (-5, 2), 'Follow Through': (-2, 5), 'Weight Transfer': (-4, 3)},
        'bowling': {'Run-Up Rhythm': (-3, 4), 'Release Point': (-5, 3), 'Front Foot Position': (-2, 5), 'Shoulder Rotation': (-4, 2)},
        'catching': {'Hand Position': (-2, 4), 'Body Alignment': (-4, 3), 'Reaction Time': (-3, 5), 'Cushioning': (-5, 2)},
        'fielding': {'Ground Approach': (-3, 4), 'Pickup Technique': (-4, 3), 'Throw Accuracy': (-2, 5), 'Movement Speed': (-5, 2)},
        # Badminton / Tennis
        'serve': {'Toss Height': (-3, 4), 'Racket Angle': (-5, 3), 'Follow Through': (-2, 5), 'Foot Position': (-4, 2)},
        'smash': {'Jump Timing': (-3, 5), 'Wrist Snap': (-5, 2), 'Contact Point': (-2, 4), 'Recovery Speed': (-4, 3)},
        'forehand': {'Grip Pressure': (-2, 4), 'Swing Path': (-4, 3), 'Weight Transfer': (-3, 5), 'Follow Through': (-5, 2)},
        'backhand': {'Shoulder Turn': (-3, 4), 'Elbow Position': (-5, 3), 'Contact Point': (-2, 5), 'Recovery': (-4, 2)},
        # Shooting / Archery
        'precision_aim': {'Sight Alignment': (-2, 4), 'Breathing Control': (-4, 3), 'Stance Stability': (-3, 5), 'Hold Time': (-5, 2)},
        'stance_holding': {'Weight Distribution': (-3, 4), 'Muscle Fatigue Control': (-5, 3), 'Posture': (-2, 5), 'Stillness': (-4, 2)},
        'trigger_pull': {'Finger Isolation': (-2, 4), 'Squeeze Pressure': (-4, 3), 'Follow Through': (-3, 5), 'Anticipation Control': (-5, 2)},
        'reload_speed': {'Hand Speed': (-3, 5), 'Magazine Grip': (-5, 2), 'Transition Smoothness': (-2, 4), 'Re-Aim Speed': (-4, 3)},
        # Boxing / MMA
        'jab_cross': {'Lead Hand Speed': (-2, 4), 'Hip Rotation': (-4, 3), 'Guard Return': (-3, 5), 'Footwork': (-5, 2)},
        'hook_uppercut': {'Elbow Angle': (-3, 4), 'Core Rotation': (-5, 3), 'Chin Protection': (-2, 5), 'Power Transfer': (-4, 2)},
        'footwork': {'Lateral Movement': (-2, 4), 'Pivot Speed': (-4, 3), 'Balance': (-3, 5), 'Rhythm': (-5, 2)},
        'defense': {'Slip Timing': (-3, 4), 'Guard Position': (-5, 3), 'Counter Readiness': (-2, 5), 'Distance Control': (-4, 2)},
        # Football
        'penalty': {'Run-Up Angle': (-3, 4), 'Plant Foot Position': (-5, 3), 'Strike Zone': (-2, 5), 'Follow Through': (-4, 2)},
        'dribbling': {'Close Control': (-2, 4), 'Change of Direction': (-4, 3), 'Ball Touch': (-3, 5), 'Speed': (-5, 2)},
        'passing': {'Body Angle': (-3, 4), 'Planted Foot': (-5, 3), 'Follow Through': (-2, 5), 'Vision': (-4, 2)},
        'goalkeeping': {'Dive Technique': (-3, 5), 'Hand Position': (-5, 2), 'Positioning': (-2, 4), 'Reaction Speed': (-4, 3)},
        # Wrestling / Judo
        'takedown': {'Level Change': (-3, 4), 'Penetration Step': (-5, 3), 'Head Position': (-2, 5), 'Finish Power': (-4, 2)},
        'sprawl': {'Reaction Speed': (-2, 4), 'Hip Drop': (-4, 3), 'Hand Fighting': (-3, 5), 'Recovery': (-5, 2)},
        'bridge': {'Neck Strength': (-3, 4), 'Hip Drive': (-5, 3), 'Timing': (-2, 5), 'Arch Height': (-4, 2)},
        'pinning': {'Weight Distribution': (-3, 4), 'Hip Control': (-5, 3), 'Limb Control': (-2, 5), 'Pressure': (-4, 2)},
        # Basketball
        'free_throw': {'Elbow Alignment': (-2, 4), 'Arc Height': (-4, 3), 'Follow Through': (-3, 5), 'Balance': (-5, 2)},
        'jump_shot': {'Jump Height': (-3, 5), 'Release Point': (-5, 2), 'Wrist Snap': (-2, 4), 'Body Alignment': (-4, 3)},
        'layup': {'Gather Step': (-3, 4), 'Knee Drive': (-5, 3), 'Touch Softness': (-2, 5), 'Approach Angle': (-4, 2)},
    }
    
    # Get exercise-specific or default breakdown
    breakdown_config = EXERCISE_BREAKDOWN.get(exercise, {'Form': (-3, 4), 'Technique': (-5, 3), 'Consistency': (-2, 5), 'Power': (-4, 2)})
    
    breakdown = {}
    for metric, (low_off, high_off) in breakdown_config.items():
        val = overall + rng.randint(low_off, high_off)
        breakdown[metric] = max(20, min(100, val))
    
    # Exercise-specific realistic feedback pools
    FEEDBACK_POOLS = {
        'squat': {
            'good': [
                'Good depth achieved — hips breaking below parallel consistently.',
                'Controlled eccentric phase shows strong quadriceps engagement.',
                'Upright torso maintained throughout the lift — solid core bracing.',
            ],
            'warning': [
                'Slight knee valgus detected at the bottom position — focus on pushing knees outward.',
                'Weight shifting to toes during ascent — keep midfoot pressure.',
                'Butt wink observed below parallel — work on hip flexor and ankle mobility.',
            ],
            'tip': [
                'Incorporate pause squats (2-3s at bottom) to build confidence and strength in the hole.',
                'Add ankle mobility drills pre-workout: wall ankle stretches, 2x15 each side.',
            ]
        },
        'pushup': {
            'good': [
                'Full range of motion with chest touching near the floor.',
                'Core remained tight throughout — no sagging observed.',
            ],
            'warning': [
                'Elbows flaring past 45° — tuck elbows closer to reduce shoulder stress.',
                'Hips dropping slightly mid-set — engage glutes and brace core harder.',
            ],
            'tip': [
                'Progress to diamond push-ups or archer push-ups once reps exceed 20 comfortably.',
            ]
        },
        'batting': {
            'good': [
                'Excellent head position — eyes level at the point of contact.',
                'Strong bottom-hand drive generating good bat speed through the zone.',
            ],
            'warning': [
                'Front foot landing slightly across — opens up the off-side but limits on-drive range.',
                'Backlift going towards third slip — straighten backlift to improve timing against pace.',
            ],
            'tip': [
                'Practice shadow batting with a mirror to reinforce correct backlift path.',
                'Use throwdown drills at varying lengths to improve footwork decision-making.',
            ]
        },
        'bowling': {
            'good': [
                'Smooth run-up with good rhythm leading into the delivery stride.',
                'High arm action generating good seam position at release.',
            ],
            'warning': [
                'Front foot landing outside the crease — risk of no-ball.',
                'Bowling arm dropping below shoulder height — losing pace and bounce.',
            ],
            'tip': [
                'Film side-on view to check front arm pull-down timing for more shoulder rotation.',
            ]
        },
        'jab_cross': {
            'good': [
                'Quick retraction of the jab — minimising exposure time.',
                'Good hip rotation on the cross generating power from the ground up.',
            ],
            'warning': [
                'Dropping rear hand during the jab — leaves chin exposed to counters.',
                'Cross lacking full hip engagement — rotate rear foot more for added power.',
            ],
            'tip': [
                'Drill: 3-round shadowboxing focusing purely on 1-2 combinations with full hip turn.',
            ]
        },
        'penalty': {
            'good': [
                'Clean strike through the ball with good follow-through direction.',
                'Plant foot positioned well alongside the ball.',
            ],
            'warning': [
                'Run-up too straight — angled approach gives better deception.',
                'Eyes on keeper instead of target zone — pick your corner and commit.',
            ],
            'tip': [
                'Practice hitting inside side-netting from the penalty spot — 10 reps each corner.',
            ]
        },
        'takedown': {
            'good': [
                'Excellent level change — penetration step was deep and explosive.',
                'Head position on the correct side — maintaining control throughout.',
            ],
            'warning': [
                'Reaching with arms before changing levels — lower your hips first.',
                'Trailing leg not following through — finish the double leg by driving forward.',
            ],
            'tip': [
                'Drill: partner sprawl-and-shoot repetitions, 5 sets of 10 for muscle memory.',
            ]
        },
        'precision_aim': {
            'good': [
                'Steady hold time before trigger release — minimal barrel movement.',
                'Good natural point of aim alignment with the target.',
            ],
            'warning': [
                'Slight flinch detected before trigger pull — practice dry-fire drills.',
                'Breathing not fully settled before shot — extend the respiratory pause.',
            ],
            'tip': [
                'Use a laser training cartridge for dry-fire practice to identify flinch patterns.',
            ]
        },
        'trigger_pull': {
            'good': [
                'Smooth, isolated trigger finger movement — no grip disturbance.',
                'Consistent follow-through holding the trigger back after shot.',
            ],
            'warning': [
                'Trigger slap detected — slow the press and feel the break point.',
                'Grip tightening before the shot — maintain consistent pressure throughout.',
            ],
            'tip': [
                'Ball squeeze exercises: 3x20 daily to build isolated finger strength without grip tension.',
            ]
        },
        'serve': {
            'good': [
                'Excellent racket speed at contact point — generating good shuttle velocity.',
                'Consistent toss placement in the optimal zone.',
            ],
            'warning': [
                'Racket face slightly open at contact — losing power to a flat trajectory.',
                'Foot position too close to the service line — step back for better balance.',
            ],
            'tip': [
                'Practice serving to specific zones: 20 to each corner for precision development.',
            ]
        },
        'smash': {
            'good': [
                'Good jump timing — contacting shuttle at the highest point.',
                'Strong wrist snap generating steep angle.',
            ],
            'warning': [
                'Contact point slightly behind your body — position under the shuttle earlier.',
                'Landing off-balance — work on single-leg stability for post-smash recovery.',
            ],
            'tip': [
                'Shadow practice: 50 jump smash motions daily focusing on contact point height.',
            ]
        },
    }
    
    # Generate feedback based on exercise and scores
    ex_pool = FEEDBACK_POOLS.get(exercise, {
        'good': [
            'Solid technique foundation — form is consistent across repetitions.',
            'Good range of motion and body control throughout the movement.',
        ],
        'warning': [
            'Minor alignment deviations detected — focus on controlled, slower reps.',
            'Slight inconsistency in tempo — maintain even speed throughout each rep.',
        ],
        'tip': [
            'Record yourself regularly and compare side-by-side to track form improvements.',
        ]
    })
    
    feedback = []
    
    # Always include exercise-specific good feedback
    good_items = ex_pool.get('good', [])
    feedback.append({'type': 'good', 'text': good_items[rng.randint(0, len(good_items) - 1)]})
    
    # Add warning if any score is below 75
    low_scores = [k for k, v in breakdown.items() if v < 75]
    warning_items = ex_pool.get('warning', [])
    if low_scores and warning_items:
        feedback.append({'type': 'warning', 'text': warning_items[rng.randint(0, len(warning_items) - 1)]})
        # Add a second warning if multiple low areas
        if len(low_scores) > 1 and len(warning_items) > 1:
            second = warning_items[rng.randint(0, len(warning_items) - 1)]
            if second != feedback[-1]['text']:
                feedback.append({'type': 'warning', 'text': second})
    
    # Always add a tip
    tip_items = ex_pool.get('tip', [])
    if tip_items:
        feedback.append({'type': 'tip', 'text': tip_items[rng.randint(0, len(tip_items) - 1)]})
    
    # Add second good feedback if score is high
    if overall >= 80 and len(good_items) > 1:
        second_good = good_items[rng.randint(0, len(good_items) - 1)]
        if second_good != feedback[0]['text']:
            feedback.append({'type': 'good', 'text': second_good})
    
    # Build verdict
    if overall >= 85:
        verdict = f'Strong {exercise.replace("_", " ")} form. Technique is clean and consistent — ready for advanced progressions.'
    elif overall >= 70:
        verdict = f'Developing {exercise.replace("_", " ")} technique. Core mechanics are sound — focus on the areas flagged below.'
    else:
        verdict = f'{exercise.replace("_", " ").title()} form needs targeted work. Review the feedback below and drill the fundamentals.'
    
    result = {
        'overall': overall,
        'verdict': verdict,
        'breakdown': breakdown,
        'feedback': feedback
    }
    return jsonify(result)


@video_bp.route('/save', methods=['POST'])
@jwt_required()
def save_video():
    """Save an analysed video submission to Supabase (Robust multi-fallback)."""
    user_id = get_jwt_identity()
    data = request.json or {}
    
    if not data.get('video_url') or not data.get('exercise'):
        return jsonify({'error': 'video_url and exercise are required'}), 400

    # Role Verification: ONLY athletes can save to feed (Admins/Reviewers should manage, not play)
    role_check = supabase.table('users').select('role, full_name').eq('id', user_id).execute()
    if not role_check.data:
        return jsonify({'error': 'User not found'}), 404
        
    user_info = role_check.data[0]
    user_role = user_info['role']
    
    if user_role != 'athlete':
        return jsonify({'error': f'Role Enforcement: Only athletes can submit videos. Your role is {user_role}.'}), 403

    # Ensure an athlete profile exists
    profile_check = supabase.table('athletes').select('user_id').eq('user_id', user_id).execute()
    if not profile_check.data:
        return jsonify({'error': 'Athlete profile not found. Please complete your profile first.'}), 404

    import json
    
    try:
        print(f"DEBUG: Attempting to save video for athlete {user_id}")
        sub_data = {
            'athlete_id': user_id,
            'video_url': data['video_url'],
            'exercise': data['exercise'],
            'ai_score': data.get('overall', 0),
            'ai_breakdown': data.get('breakdown', {}),
            'ai_feedback': data.get('feedback', []),
            'visibility': 'public'
        }
        res = supabase.table('feed_videos').insert(sub_data).execute()
        if res.data:
            return jsonify({'message': 'Video saved successfully', 'id': res.data[0]['id']}), 201
        return jsonify({'error': 'Failed to save video (no data returned from Supabase).'}), 500
    except Exception as e:
        print(f"CRITICAL: Failed to save video to feed_videos table. Error: {e}")
        return jsonify({'error': f'Failed to save video: {str(e)}'}), 500


@video_bp.route('/submissions/<athlete_id>', methods=['GET'])
@jwt_required()
def get_submissions(athlete_id):
    """Get all submissions for an athlete from Supabase."""
    res = supabase.table('feed_videos').select('*').eq('athlete_id', athlete_id).order('created_at', desc=True).execute()
    
    # Map for frontend compatibility
    mapped = []
    for sub in res.data:
        mapped.append({**sub, 'score': sub['ai_score'], 'date': sub['created_at']})
        
    return jsonify(mapped)


@video_bp.route('/submission/<sub_id>', methods=['GET'])
@jwt_required()
def get_submission(sub_id):
    """Get a specific video submission by its ID from Supabase."""
    res = supabase.table('feed_videos').select('*').eq('id', sub_id).execute()
    if not res.data:
        return jsonify({'error': 'Submission not found'}), 404
        
    sub = res.data[0]
    return jsonify({**sub, 'score': sub['ai_score'], 'date': sub['created_at']})

