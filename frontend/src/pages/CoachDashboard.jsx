import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Star, Video, CheckCircle, Clock, 
  Filter, Search, ChevronDown, Eye, UserPlus, Compass, TrendingUp, Mail,
  Shield, Award, Sparkles, RotateCcw
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import VideoFeed from '../components/VideoFeed'
import useAuthStore from '../store/authStore'

import api from '../lib/api'

export default function CoachDashboard() {
  const { user, token } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'feed')
  const [search, setSearch] = useState('')
  const [athletes, setAthletes] = useState([])
  const [reviews, setReviews] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [revealedEmails, setRevealedEmails] = useState({}) // { athleteId: true }

  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    setTab(newTab)
    setSearchParams({ tab: newTab })
  }

  const fetchData = async () => {
    if (!token) return

    // Fetch athletes independently
    try {
      const athletesRes = await api.get('/connect/athletes')
      setAthletes(Array.isArray(athletesRes.data) ? athletesRes.data : [])
    } catch (err) {
      console.error('Failed to fetch connected athletes:', err)
      setAthletes([])
    }

    // Fetch reviews independently
    try {
      const reviewsRes = await api.get('/coach/reviews')
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : [])
    } catch (err) {
      console.error('Failed to fetch review queue:', err)
      setReviews([])
    }

    // Fetch suggestions
    try {
      const suggestionsRes = await api.get('/coach/suggestions')
      setSuggestions(Array.isArray(suggestionsRes.data) ? suggestionsRes.data : [])
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    }
  }

  const handleRevealEmail = (athleteId) => {
    setRevealedEmails(prev => ({ ...prev, [athleteId]: !prev[athleteId] }))
  }

  useEffect(() => {
    fetchData()
  }, [token])

  // Polling for admin approval while in pending state
  useEffect(() => {
    if (user?.role === 'coach' && user?.onboarding_status === 'pending') {
      const checkStatus = async () => {
        try {
          const res = await api.get('/coach/status');
          // 🪄 Master Logic Sync: The backend status endpoint returns 'approved', 'pending', or 'new'
          if (res.data?.status === 'approved') {
            const updatedUser = { ...user, onboarding_status: 'approved' };
            sessionStorage.setItem('sth_user', JSON.stringify(updatedUser));
            window.location.reload();
          } else if (res.data?.status === 'rejected') {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        } catch(err) {}
      };
      
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ── Verification Guard ──
  // If the coach is pending review, show the stunning "Under Review" status page
  if (user?.role === 'coach' && user?.onboarding_status === 'pending') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center relative z-10"
        >
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-3xl bg-brand-surface border border-brand-accent/30 flex items-center justify-center mx-auto shadow-2xl">
              <Shield className="w-12 h-12 text-brand-accent animate-bounce-slow" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-dark border border-white/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-brand-gold animate-spin-slow" />
            </div>
          </div>

          <h1 className="text-4xl font-display font-bold text-brand-text mb-4">
            Application Under Review
          </h1>
          <p className="text-brand-text-muted leading-relaxed mb-12 max-w-lg mx-auto">
            Welcome, Coach <span className="text-brand-accent">{user.name}</span>! Our AI agents and expert review board are currently verifying your professional credentials and experience summary.
          </p>

          {/* Verification Journey */}
          <div className="grid grid-cols-3 gap-4 relative mb-12">
            {[
              { label: 'Submitted', status: 'complete', icon: CheckCircle },
              { label: 'AI Analysis', status: 'active', icon: Compass },
              { label: 'Final Approval', status: 'pending', icon: Award },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  step.status === 'complete' ? 'bg-brand-accent text-brand-dark' :
                  step.status === 'active' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                  'bg-brand-surface text-brand-text-dim border border-white/5'
                }`}>
                  <step.icon className={`w-6 h-6 ${step.status === 'active' ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  step.status === 'active' ? 'text-brand-accent' : 'text-brand-text-dim'
                }`}>
                  {step.label}
                </span>
                {i < 2 && (
                  <div className="absolute top-6 left-[70%] w-[60%] h-[1px] bg-white/5 hidden sm:block">
                    <div className={`h-full ${step.status === 'complete' ? 'bg-brand-accent' : 'bg-brand-surface'} transition-all`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card p-6 border-brand-accent/10">
            <div className="flex items-center gap-3 text-sm text-brand-text mb-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span className="font-semibold">AI Verification Engine Active</span>
            </div>
            <p className="text-xs text-brand-text-dim text-left leading-relaxed">
              Our system is cross-referencing your professional certificates and organisation history for AI Verification.
            </p>
          </div>
          
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-text">
            Coach Dashboard
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            Welcome, <span className="text-brand-accent">Coach {user?.name || 'User'}</span> · {athletes.length} connected athletes
          </p>
        </div>
        <Link to="/coach/explore" className="gold-button flex items-center gap-2 text-sm">
          <Compass className="w-4 h-4" /> Explore Grid
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-brand-surface border border-white/5 shadow-inner rounded-xl mb-6 w-fit overflow-x-auto">
            {[
              { key: 'feed', label: 'Discovery Feed', icon: Compass },
              { key: 'athletes', label: 'My Athletes', icon: Users },
              { key: 'reviews', label: 'Review Queue', icon: Video },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-brand-gold/10 text-brand-gold shadow-sm'
                    : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
                }`}
              >
                <t.icon className={`w-4 h-4 ${tab === t.key ? 'text-brand-gold' : ''}`} />
                {t.label}
                {t.key === 'reviews' && reviews.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-orange-400/20 text-orange-400 text-[10px] flex items-center justify-center font-bold">
                    {reviews.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Discovery Feed Tab */}
          {tab === 'feed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pb-safe"
            >
              <VideoFeed discovery={true} />
            </motion.div>
          )}

          {/* Search for My Athletes */}
          {tab === 'athletes' && (
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connected athletes..."
                className="input-field !pl-10"
              />
            </div>
          )}

          {/* Athletes Tab */}
          {tab === 'athletes' && (
            <div className="space-y-4">
              {athletes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 text-center"
                >
                  <Users className="w-14 h-14 text-brand-text-dim mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-display font-semibold text-brand-text mb-2">No connected athletes yet</h3>
                  <p className="text-brand-text-dim text-sm mb-6">
                    Explore athletes and connect with them to start coaching
                  </p>
                  <Link to="/coach/explore" className="gold-button inline-flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Explore Athletes
                  </Link>
                </motion.div>
              ) : (
                athletes.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map((athlete, i) => (
                  <motion.div
                    key={athlete.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card-hover p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <Link to={`/athlete/${athlete.id}`} className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-accent/10 flex items-center justify-center text-lg font-bold text-brand-gold hover:scale-110 transition-transform">
                        {athlete.name[0]}
                      </Link>
                      <div>
                        <Link to={`/athlete/${athlete.id}`} className="font-semibold text-brand-text hover:text-brand-gold transition-colors block">
                          {athlete?.name || 'Unknown Athlete'}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-brand-text-dim mt-1">
                          <span className="badge-gold">{athlete?.sport || 'General'}</span>
                          <span>{athlete?.state || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 text-sm">
                      <div className="text-center hidden sm:block">
                        <div className="font-display font-bold text-brand-text">{athlete.latestScore || 0}</div>
                        <div className="text-xs text-brand-text-dim">Score</div>
                      </div>
                      <Link
                        to={`/athlete/${athlete.id}`}
                        className="gold-button-outline !px-3 !py-1.5 text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Profile
                      </Link>
                      <button
                        onClick={() => handleRevealEmail(athlete.id)}
                        className="gold-button !px-3 !py-1.5 text-[10px] flex flex-col items-center justify-center gap-0.5 min-w-[100px]"
                      >
                        {revealedEmails[athlete.id] ? (
                          <span className="font-mono lowercase select-all text-brand-dark font-bold">{athlete.email || 'no email'}</span>
                        ) : (
                          <>
                            <Mail className="w-3 h-3" />
                            <span>Show Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Review Queue Tab */}
          {tab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 text-center"
                >
                  <Video className="w-14 h-14 text-brand-text-dim mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-display font-semibold text-brand-text mb-2">No reviews pending</h3>
                  <p className="text-brand-text-dim text-sm">Videos from connected athletes will appear here for your review</p>
                </motion.div>
              ) : (
                reviews.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card-hover p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Link to={`/athlete/${item.athlete_id}`} className="font-semibold text-brand-text hover:text-brand-gold transition-colors block">
                          {item.athlete} — {item.exercise}
                        </Link>
                        <p className="text-xs text-brand-text-dim flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {new Date(item.submitted).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-bold border-2 ${
                        item.score >= 80 ? 'border-brand-accent text-brand-accent' :
                        item.score >= 60 ? 'border-brand-gold text-brand-gold' :
                        'border-brand-danger text-brand-danger'
                      }`}>
                        {item.score}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link to={`/athlete/${item.athlete_id}`} className="gold-button flex-1 !py-2 text-sm flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4" /> View Profile and Tapes
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar Suggestions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold text-brand-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-gold" /> Suggested for You
            </h2>
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <p className="text-brand-text-dim text-sm italic">No suggestions available yet</p>
              ) : (
                suggestions.map((suggestion) => (
                  <Link 
                    to={`/athlete/${suggestion.id}`} 
                    key={suggestion.id}
                    className="block group p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-gold/10 flex items-center justify-center font-bold text-brand-gold group-hover:bg-brand-gold group-hover:text-black transition-colors">
                        {suggestion.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-brand-text group-hover:text-brand-gold transition-colors">{suggestion.name}</h4>
                        <p className="text-[10px] text-brand-text-dim uppercase tracking-wider font-bold mt-0.5">{suggestion.sport} · {suggestion.state}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link to="/coach/explore" className="w-full mt-6 gold-button-outline !py-2.5 text-sm flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" /> Advanced Filter
            </Link>
          </div>

          <div className="glass-card p-6 border-brand-accent/20">
            <h2 className="text-lg font-display font-bold text-brand-text mb-2">Scouting Tip</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              Check out athletes with form scores above 85 in your sport. They show high technical accuracy and potential.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
