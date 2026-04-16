"""
SportTalentHunt — Flask Backend (Production Grade)
Main application factory and logic synchronization.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import Config, validate_config
from middleware.security import (
    setup_logging, 
    add_security_headers, 
    attach_request_info, 
    log_api_error
)

# Route Blueprints
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.video import video_bp
from routes.coach import coach_bp
from routes.connections import connections_bp
from routes.admin import admin_bp
from routes.godmode import godmode_bp

# ── Global Extensions ──────────────────────────────────
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=Config.RATELIMIT_STORAGE_URI,
    default_limits=["100 per minute"]
)

def create_app():
    # ── Startup Validation ─────────────────────────────
    validate_config()

    app = Flask(__name__)
    app.config.from_object(Config)
    
    # ── Structured Logging & Security ──────────────────
    setup_logging(app)
    
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )
    
    app.url_map.strict_slashes = False

    @app.before_request
    def before_request():
        attach_request_info()

    @app.after_request
    def after_request(response):
        return add_security_headers(response)

    # ── Extensions ────────────────────────────────────
    JWTManager(app)
    limiter.init_app(app)

    # ── Standardized Diagnostics ──────────────────────
    @app.route('/')
    def root():
        return jsonify({
            'status': 'online',
            'version': '1.0.0',
            'service': 'SportTalentHunt Core API'
        })

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'env': 'production' if not Config.DEBUG else 'development'})

    # ── Consolidated Error Handlers ───────────────────
    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'error': 'Unauthorized access', 'code': 'AUTH_REQUIRED'}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'error': 'Permission denied', 'code': 'FORBIDDEN'}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found', 'code': 'NOT_FOUND'}), 404

    @app.errorhandler(429)
    def ratelimit_exceeded(e):
        log_api_error(endpoint='ratelimit', status=429, error=str(e))
        return jsonify({'error': 'Too many requests. Please slow down.', 'code': 'RATE_LIMIT'}), 429

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f"Internal Server Error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error', 'code': 'INTERNAL_ERROR'}), 500

    # ── Blueprint Registration ────────────────────────
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(video_bp, url_prefix='/api/video')
    app.register_blueprint(coach_bp, url_prefix='/api/coach')
    app.register_blueprint(connections_bp, url_prefix='/api/connect')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(godmode_bp, url_prefix='/api/godmode')

    return app

app = create_app()

if __name__ == '__main__':
    # Startup Connectivity Audit
    try:
        from utils.supabase_client import supabase
        if supabase:
            supabase.table('users').select('id').limit(1).execute()
            print("🚀 Server Ready: Supabase connection verified.")
        else:
            print("⚠️ Startup Warning: Supabase client is None. Check credentials.")
    except Exception as e:
        print(f"❌ Startup Error: {str(e)}")

    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
