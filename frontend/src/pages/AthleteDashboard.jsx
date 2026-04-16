import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, TrendingUp, Award, Activity, Video, Clock, Star,
  ChevronRight, BarChart3, Flame, Target, Compass, Users
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import VideoFeed from '../components/VideoFeed'

const STATS = [
  { label: 'Total Videos', value: '0', icon: Video, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
  { label: 'Avg Score', value: '0', icon: TrendingUp, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
  { label: 'Best Score', value: '0', icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Streak', value: '0 days', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10' },
]

function ScoreBar({ label, value, color = 'from-brand-gold to-brand-accent' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-brand-text-muted w-20">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-brand-dark overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="text-xs font-mono text-brand-text-muted w-8 text-right">{value}</span>
    </div>
  )
}

export default function AthleteDashboard() {
  const { user, token } = useAuthStore()
  const [tab, setTab] = useState('feed') // Default to the community feed
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState(STATS)
  
  useEffect(() => {
    if (!user?.id || !token) return
    
    // Professional approach: Use centralized API instance
    api.get(`/video/submissions/${user.id}`)
      .then(response => {
        const data = response.data
        if (Array.isArray(data)) {
          setSubmissions(data)
          // Compute streak from actual submission dates
          let streak = 0
          if (data.length > 0) {
            const dates = data.map(d => new Date(d.date).toDateString())
            const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a))
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            for (let i = 0; i < uniqueDates.length; i++) {
              const d = new Date(uniqueDates[i])
              d.setHours(0, 0, 0, 0)
              const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24))
              if (diffDays === i || diffDays === i + 1) {
                streak++
              } else break
            }
          }
          setStats([
            { label: 'Total Videos', value: data.length.toString(), icon: Video, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
            { label: 'Avg Score', value: data.length ? Math.round(data.reduce((a,b)=>a+b.score, 0)/data.length).toString() : '0', icon: TrendingUp, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { label: 'Best Score', value: data.length ? Math.max(...data.map(d=>d.score)).toString() : '0', icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { label: 'Streak', value: streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''}` : '—', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          ])
        }
      })
      .catch(err => {
        console.error('Failed to fetch athlete submissions:', err)
        setSubmissions([])
      })
  }, [user, token])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-text">
            Welcome back, <span className="gold-gradient-text">{user?.name || 'Athlete'}</span>
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            {user?.sport} · {user?.state || 'India'} · Keep grinding 💪
          </p>
        </div>
        <Link to="/athlete/upload" className="gold-button flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Video
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-brand-surface border border-white/5 shadow-inner rounded-xl mb-6 w-fit overflow-x-auto">
        {[
          { key: 'feed', label: 'Community Feed', icon: Compass },
          { key: 'stats', label: 'My Stats', icon: BarChart3 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-brand-gold/10 text-brand-gold shadow-sm'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
            }`}
          >
            <t.icon className={`w-4 h-4 ${tab === t.key ? 'text-brand-gold' : ''}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Community Feed Tab */}
      {tab === 'feed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-safe"
        >
          <VideoFeed />
        </motion.div>
      )}

      {/* Stats and Submissions Tab */}
      {tab === 'stats' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5 group hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-display font-bold text-brand-text">{stat.value}</div>
                <div className="text-xs text-brand-text-dim mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Submissions — takes 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-gold" />
                  Recent Submissions
                </h2>
                <span className="text-xs text-brand-text-dim">{submissions.length} videos</span>
              </div>

              {submissions.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Video className="w-12 h-12 text-brand-text-dim mx-auto mb-4 opacity-50" />
                  <p className="text-brand-text-muted mb-4">You haven't uploaded any videos yet.</p>
                  <Link to="/athlete/upload" className="gold-button-outline inline-flex items-center gap-2">
                    Start your journey
                  </Link>
                </div>
              ) : (
                submissions.map((sub, i) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card-hover p-5"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 w-full">
                          <h3 className="font-semibold text-brand-text capitalize">{sub.exercise}</h3>
                          {sub.score >= 80 && (
                            <span className="badge-gold text-[10px] py-0.5">Top 10%</span>
                          )}
                        </div>
                        <p className="text-xs text-brand-text-dim flex items-center gap-1 mt-1.5 mb-3">
                          <Clock className="w-3 h-3" /> {new Date(sub.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-brand-text-muted line-clamp-2">
                          {Array.isArray(sub.feedback) 
                            ? sub.feedback.map(f => f.text).join(' ') 
                            : sub.feedback}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-0 border-white/5 pt-4 sm:pt-0">
                        <div className="text-center">
                          <div className={`text-2xl font-display font-black leading-none ${
                            sub.score >= 80 ? 'text-brand-accent' : 
                            sub.score >= 60 ? 'text-brand-gold' : 'text-brand-danger'
                          }`}>
                            {sub.score}
                          </div>
                          <div className="text-[10px] text-brand-text-dim uppercase tracking-wider mt-1">Score</div>
                        </div>
                        <Link to={`/athlete/submission/${sub.id}`} className="gold-button-outline !px-4 !py-2 text-sm whitespace-nowrap">
                          View Analysis
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* AI Performance Breakdown — takes 1 col */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-accent" />
                Performance Overview
              </h2>
              
              <div className="glass-card p-6">
                <div className="space-y-6">
                  {submissions.length > 0 ? (
                    <>
                      <ScoreBar 
                        label="Form Align" 
                        value={Math.round(submissions.reduce((a,b)=>a+(b.breakdown?.alignment||0), 0)/submissions.length)} 
                      />
                      <ScoreBar 
                        label="Stability" 
                        value={Math.round(submissions.reduce((a,b)=>a+(b.breakdown?.stability||0), 0)/submissions.length)} 
                        color="from-emerald-500 to-teal-400"
                      />
                      <ScoreBar 
                        label="Depth/ROM" 
                        value={Math.round(submissions.reduce((a,b)=>a+(b.breakdown?.depth||0), 0)/submissions.length)} 
                        color="from-violet-500 to-fuchsia-400"
                      />
                    </>
                  ) : (
                    <div className="text-center py-8 text-brand-text-dim text-sm">
                      Upload videos to unlock AI performance breakdown.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
