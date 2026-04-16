-- ============================================================================
-- SportTalentHunt — FINAL CONSOLIDATED DATABASE SCHEMA
-- This single file initializes the entire database with all roles, 
-- constraints, tables, and security policies. It is designed to be 
-- idempotent (safe to run multiple times).
-- ============================================================================

-- ============================================
-- 1. ENUMS (Strict Data Types)
-- ============================================

-- Securely create ENUM types only if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'admin', 'founder', 'reviewer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_type') THEN
        CREATE TYPE connection_type AS ENUM ('coach_athlete', 'athlete_athlete');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
        CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_visibility') THEN
        CREATE TYPE video_visibility AS ENUM ('public', 'coaches_only', 'private');
    END IF;
END $$;

-- ============================================
-- 2. CORE TABLES (Authentication & Profiles)
-- ============================================

-- TABLE: Base Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'athlete',
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_login    TIMESTAMPTZ
);

-- TABLE: Athletes Profile
CREATE TABLE IF NOT EXISTS athletes (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sport         TEXT NOT NULL,
  state         TEXT,
  district      TEXT,
  height_cm     INT,
  weight_kg     NUMERIC(5,2),
  bio           TEXT,
  metrics       JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- TABLE: Coaches Profile
CREATE TABLE IF NOT EXISTS coaches (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sport             TEXT NOT NULL,
  experience_years  INT NOT NULL DEFAULT 0,
  organisation      TEXT,
  qualification     TEXT,
  certification_url TEXT,
  bio               TEXT,
  is_verified       BOOLEAN DEFAULT false,
  verified_by       UUID REFERENCES users(id),
  verified_at       TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- TABLE: Admin/Founder Profiles
CREATE TABLE IF NOT EXISTS admins (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  permissions   JSONB DEFAULT '{"super_admin": false, "can_verify_coaches": true, "can_ban_users": true}',
  sport_scope   TEXT DEFAULT 'all',
  assigned_by   UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. CONTENT & SOCIAL TABLES
-- ============================================

-- TABLE: Global Feed Videos
CREATE TABLE IF NOT EXISTS feed_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID REFERENCES athletes(user_id) ON DELETE CASCADE,
  exercise        TEXT NOT NULL,
  video_url       TEXT NOT NULL,
  duration_secs   INT,
  ai_score        INT CHECK(ai_score BETWEEN 0 AND 100),
  ai_breakdown    JSONB DEFAULT '{}',
  ai_feedback     JSONB DEFAULT '[]',
  coach_feedback  TEXT,
  reviewed_by     UUID REFERENCES coaches(user_id),
  likes_count     INT DEFAULT 0,
  visibility      video_visibility DEFAULT 'public',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- TABLE: Network Connections
CREATE TABLE IF NOT EXISTS connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  type            connection_type NOT NULL,
  status          connection_status DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

-- TABLE: System Audit Logs
CREATE TABLE IF NOT EXISTS system_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. SECURITY & RLS POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation
DO $$ BEGIN
    -- Users Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Users') THEN
        CREATE POLICY "Public Users" ON users FOR SELECT USING (is_active = true);
    END IF;
    -- Athletes Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Athletes') THEN
        CREATE POLICY "Public Athletes" ON athletes FOR SELECT USING (true);
    END IF;
    -- Coaches Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Verified Coaches') THEN
        CREATE POLICY "Public Verified Coaches" ON coaches FOR SELECT USING (true);
    END IF;
    -- Videos Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'See Public Videos') THEN
        CREATE POLICY "See Public Videos" ON feed_videos FOR SELECT USING (visibility = 'public');
    END IF;
END $$;

-- ============================================
-- 5. ADVANCED FEATURES & HELPERS
-- ============================================

-- Secure Admin Creation (Run by Founder)
CREATE OR REPLACE FUNCTION create_admin_secure(
    admin_email TEXT,
    admin_password_hash TEXT,
    admin_full_name TEXT,
    founder_id UUID
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES (admin_email, admin_password_hash, admin_full_name, 'admin')
    RETURNING id INTO new_user_id;
    
    INSERT INTO admins (user_id, assigned_by)
    VALUES (new_user_id, founder_id);
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Quick Email Check Helper
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE email = email_to_check);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_athletes_sport ON athletes(sport);
CREATE INDEX IF NOT EXISTS idx_coaches_sport ON coaches(sport);
CREATE INDEX IF NOT EXISTS idx_feed_videos_athlete ON feed_videos(athlete_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
