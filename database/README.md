# SportTalentHunt — Database

This directory contains the PostgreSQL database schema for SportTalentHunt.

## Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor in your Supabase dashboard
3. Copy and paste `schema.sql` and run it
4. Create two storage buckets:
   - `videos` (private) — for athlete video submissions
   - `documents` (private) — for coach certificates and ID proofs

## Tables

| Table | Purpose |
|---|---|
| `profiles` | All user profiles (athlete, coach, admin, founder) |
| `coach_applications` | Coach verification applications with AI scores |
| `submissions` | Video submissions with AI analysis results |
| `connections` | Coach–athlete connections (like follow) |
| `admin_accounts` | Admin accounts created by founder |
| `audit_log` | Immutable audit trail (no DELETE policy) |
| `god_mode_log` | Secret God Mode access log |

## Security

- Row Level Security (RLS) enabled on all tables
- Athletes can only see their own data
- Coaches can see connected athletes' submissions
- Admins/Founders see all coach applications
- Audit log is append-only — deletion is impossible
