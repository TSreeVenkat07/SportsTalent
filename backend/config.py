
import os
import sys
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# ── Environment Loading ────────────────────────────────
# Prioritize a centralized 'secrets/.env' if it exists, otherwise check root
BASE_DIR = Path(__file__).resolve().parent.parent
_env_paths = [
    BASE_DIR.parent / 'secrets' / '.env',
    BASE_DIR / 'secrets' / '.env',
    BASE_DIR / '.env',
]

for path in _env_paths:
    if path.exists():
        load_dotenv(path)
        break

# ── Required Variables ────────────────────────────────
REQUIRED_ENV_VARS = [
    'FLASK_SECRET_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
]

def validate_config():
    """Fail fast if required production variables are missing."""
    missing = [v for v in REQUIRED_ENV_VARS if not os.getenv(v)]
    if missing:
        print(f"\n❌ FATAL CONFIG ERROR: Missing variables: {', '.join(missing)}")
        print("Please ensure your .env file is correctly configured.")
        sys.exit(1)

# ── Config Class ──────────────────────────────────────
class Config:
    # Flask Core
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))

    # JWT Security
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Supabase (Cleaned)
    SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
    # Supports both Service Key and Anon Key for flexibility
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', os.getenv('SUPABASE_KEY', '')).strip()
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '').strip()

    # CORS Enforcement
    _raw_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
    ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(',') if o.strip()]

    # AI & External Services
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '').strip()
    RESEND_API_KEY = os.getenv('RESEND_API_KEY', '').strip()
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@sporttalenthunt.in').strip()

    # God Mode
    GOD_MODE_PASSWORD = os.getenv('GOD_MODE_PASSWORD', '').strip()
    GOD_MODE_JWT_SECRET = os.getenv('GOD_MODE_JWT_SECRET', 'god-mode-secret').strip()

    # Rate Limiting
    RATELIMIT_STORAGE_URI = os.getenv('RATELIMIT_STORAGE_URI', 'memory://')

    @classmethod
    def get_supabase_creds(cls):
        return cls.SUPABASE_URL, cls.SUPABASE_SERVICE_KEY
