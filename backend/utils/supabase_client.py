"""
Centralized Supabase client — strictly pulls from Config.
No independent environment loading or path resolution.
"""

from supabase import create_client, Client
from config import Config

# Using the class-level credentials helper
url, key = Config.get_supabase_creds()

try:
    if not url or not key:
        print(f"⚠️  CONFIG WARNING: Supabase credentials missing. Client set to None.")
        supabase: Client = None
    elif "your-supabase" in url or "your-supabase" in key:
        print(f"⚠️  CONFIG WARNING: Placeholder Supabase credentials detected.")
        supabase: Client = None
    else:
        # Initializing the singleton client
        supabase: Client = create_client(url, key)
except Exception as e:
    print(f"🚨 FATAL: Failed to initialize Supabase client: {str(e)}")
    supabase = None
