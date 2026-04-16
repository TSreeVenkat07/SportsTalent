# 🏆 SportTalentHunt

> **Discover. Verify. Elevate.**

India's first AI-powered sports talent platform. Upload your game, get instant form analysis, and connect with verified coaches.

## 📁 Project Structure

```
ai-/
├── frontend/          ← React 18 + Vite + TailwindCSS v3
│   ├── src/
│   │   ├── components/    # STLogo, Navbar, Footer, Layout, RouteGuards
│   │   ├── pages/         # 13 pages (Landing, Auth, Athlete, Coach, Admin, GodMode)
│   │   ├── store/         # Zustand auth store
│   │   ├── lib/           # Axios API client
│   │   └── App.jsx        # React Router v6 with all routes
│   └── package.json
│
├── backend/           ← Flask (Python 3.11) REST API
│   ├── app.py             # App factory + blueprints
│   ├── config.py          # Environment configuration
│   ├── routes/            # auth, profile, video, coach, connections, admin, godmode
│   ├── services/          # ai_coach, video_analysis, email
│   ├── middleware/        # JWT + role decorators
│   ├── utils/             # Helpers
│   └── requirements.txt
│
└── database/          ← PostgreSQL (Supabase)
    ├── schema.sql         # 7 tables + RLS policies + indexes
    └── README.md
```

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python app.py          # → http://localhost:5000
```

### Database
1. Create a Supabase project
2. Run `database/schema.sql` in the SQL Editor

## 🔐 Secret: God Mode
Click the **ST** logo **17 times** within 10 seconds → enter founder password → full system control.

## 💡 Demo Mode
Login with any email — use "coach", "admin", or "founder" in the email to get role-specific dashboards.
