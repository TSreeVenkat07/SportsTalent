"""
Input validation and sanitization utilities.
All user input MUST pass through these before processing.
"""

import re
import uuid as uuid_lib

# ── Email ──────────────────────────────────────────────
EMAIL_RE = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
)

def validate_email(email: str) -> str:
    """Validate and normalise an email address. Returns cleaned email or raises ValueError."""
    if not email or not isinstance(email, str):
        raise ValueError('Email is required')
    email = email.strip().lower()
    if len(email) > 254:
        raise ValueError('Email is too long')
    if not EMAIL_RE.match(email):
        raise ValueError('Invalid email format')
    return email


# ── Password ───────────────────────────────────────────
def validate_password(password: str) -> str:
    """Enforce password strength rules. Returns password or raises ValueError."""
    if not password or not isinstance(password, str):
        raise ValueError('Password is required')
    if len(password) < 8:
        raise ValueError('Password must be at least 8 characters')
    if len(password) > 128:
        raise ValueError('Password must be at most 128 characters')
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', password):
        raise ValueError('Password must contain at least one digit')
    return password


# ── Strings ────────────────────────────────────────────
def sanitize_string(text: str, max_len: int = 500, field_name: str = 'Field') -> str:
    """
    Strip dangerous characters and enforce length.
    Removes HTML tags and control characters.
    """
    if text is None:
        return ''
    if not isinstance(text, str):
        raise ValueError(f'{field_name} must be a string')
    # Strip HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    # Strip control characters (keep newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = text.strip()
    if len(text) > max_len:
        raise ValueError(f'{field_name} must be at most {max_len} characters')
    return text


# ── UUID ───────────────────────────────────────────────
def validate_uuid(value: str, field_name: str = 'ID') -> str:
    """Validate a UUID string format."""
    if not value or not isinstance(value, str):
        raise ValueError(f'{field_name} is required')
    try:
        uuid_lib.UUID(value, version=4)
    except ValueError:
        raise ValueError(f'{field_name} is not a valid identifier')
    return value


# ── Exercise whitelist ─────────────────────────────────
ALLOWED_EXERCISES = {
    'squat', 'pushup', 'lunge', 'jump',
    'precision_aim', 'stance_holding', 'trigger_pull', 'reload_speed', # Shooting
    'batting', 'bowling', 'catching', 'fielding',                    # Cricket
    'jab_cross', 'hook_uppercut', 'footwork', 'defense',             # Boxing
    'penalty', 'dribbling', 'passing', 'goalkeeping',                # Football
    'free_throw', 'jump_shot', 'layup',                             # Basketball
    'takedown', 'sprawl', 'bridge', 'pinning'                         # Wrestling
}

def validate_exercise(exercise: str) -> str:
    """Validate exercise type against whitelist."""
    if not exercise or not isinstance(exercise, str):
        raise ValueError('Exercise type is required')
    exercise = exercise.strip().lower()
    if exercise not in ALLOWED_EXERCISES:
        raise ValueError(f'Invalid exercise type. Allowed: {", ".join(sorted(ALLOWED_EXERCISES))}')
    return exercise


# ── File upload ────────────────────────────────────────
ALLOWED_VIDEO_MIMES = {
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/x-matroska', 'video/mpeg',
}
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

def validate_video_file(file) -> None:
    """Validate uploaded video file (MIME type and size)."""
    if file is None:
        raise ValueError('No video file provided')

    # Check MIME type
    if file.content_type not in ALLOWED_VIDEO_MIMES:
        raise ValueError(
            f'Invalid file type: {file.content_type}. '
            f'Allowed: MP4, MOV, AVI, WebM, MKV, MPEG'
        )

    # Check file size (read + seek)
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)     # Reset
    if size > MAX_VIDEO_SIZE_BYTES:
        raise ValueError(f'File too large. Maximum size is 100 MB')
    if size == 0:
        raise ValueError('File is empty')
