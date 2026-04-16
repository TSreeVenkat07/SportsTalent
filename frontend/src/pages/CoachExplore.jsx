import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Users, UserPlus, Mail, Trophy,
  MapPin, Video, TrendingUp, ChevronDown, Compass, Sparkles,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'
import AthleteDetailModal from '../components/AthleteDetailModal'

const SPORT_OPTIONS = ['All Sports', 'Wrestling', 'Athletics', 'Boxing', 'Badminton', 'Cricket', 'Football', 'Swimming', 'Kabaddi', 'Hockey', 'Weightlifting', 'Other']

const GRADIENT_PAIRS = [
  'from-amber-500/30 to-orange-600/20',
  'from-emerald-500/30 to-teal-600/20',
  'from-violet-500/30 to-purple-600/20',
  'from-sky-500/30 to-blue-600/20',
  'from-rose-500/30 to-pink-600/20',
  'from-cyan-500/30 to-teal-500/20',
  'from-fuchsia-500/30 to-purple-500/20',
  'from-lime-500/30 to-green-600/20',
]

import api from '../lib/api'

export default function CoachExplore() {
  const { token, user } = useAuthStore()
  const [athletes, setAthletes] = useState([])
  const [search, setSearch] = useState('')
  const [sportFilter, setSportFilter] = useState('All Sports')
  const [loading, setLoading] = useState(true)
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [connections, setConnections] = useState({}) // { athleteId: 'accepted' | 'pending' }
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    const params = {}
    if (search.trim()) params.search = search.trim()
    if (sportFilter !== 'All Sports') params.sport = sportFilter

    // 1. Fetch Athletes
    api.get('/coach/browse-athletes', { params })
      .then(res => {
        if (Array.isArray(res.data)) setAthletes(res.data)
      })
      .catch(err => console.error('Athletes fetch failed:', err))
      .finally(() => setLoading(false))

    // 2. Fetch Connections (Mark existing connections)
    api.get('/connect/athletes')
      .then(res => {
        if (Array.isArray(res.data)) {
          const connMap = {}
          res.data.forEach(c => { connMap[c.id] = 'accepted' })
          setConnections(connMap)
        }
      })
      .catch(err => console.error('Connections fetch failed:', err))
  }, [token, search, sportFilter])

  const handleConnect = async (athlete) => {
    try {
      // Professional approach: Use centralized API instance
      const response = await api.post('/connect/request', { athlete_id: athlete.id });
      
      if (response.status === 200 || response.status === 201) {
        setConnections(prev => ({ ...prev, [athlete.id]: 'accepted' }))
        toast.success(`Connected with ${athlete.name}!`)
      }
    } catch (err) {
      console.error('Connection failed:', err)
      toast.error(err.response?.data?.error || "Connection request failed.")
    }
  }

  const [revealedEmails, setRevealedEmails] = useState({}) // { athleteId: true }
  
  const handleEmail = (athlete) => {
    if (athlete.email) {
      setRevealedEmails(prev => ({ ...prev, [athlete.id]: !prev[athlete.id] }))
    } else {
      toast.info('Email not available for this athlete.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-accent/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-brand-text">
              Explore Athletes
            </h1>
            <p className="text-brand-text-muted text-sm">
              Discover talented sportspersons · Connect · Coach · Support
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes by name, sport, or state..."
              className="input-field !pl-10 !py-2.5"
            />
          </div>
          {/* Sport Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="gold-button-outline !py-2.5 !px-4 flex items-center gap-2 text-sm w-full sm:w-auto justify-between"
            >
              <Filter className="w-4 h-4" />
              {sportFilter}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-white/10 rounded-xl overflow-hidden shadow-xl z-10"
                >
                  {SPORT_OPTIONS.map(sport => (
                    <button
                      key={sport}
                      onClick={() => { setSportFilter(sport); setShowFilterDropdown(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sportFilter === sport
                          ? 'bg-brand-gold/10 text-brand-gold'
                          : 'text-brand-text-muted hover:bg-white/5 hover:text-brand-text'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-brand-text-dim">
          {loading ? 'Loading...' : (
            <>
              <span className="text-brand-gold font-semibold">{athletes.length}</span> athletes found
              {sportFilter !== 'All Sports' && <span> in <span className="text-brand-accent">{sportFilter}</span></span>}
            </>
          )}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-brand-text-dim">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          <span>AI-powered talent discovery</span>
        </div>
      </div>

      {/* Athletes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4" />
              <div className="h-4 bg-white/5 rounded-lg mb-2 w-3/4 mx-auto" />
              <div className="h-3 bg-white/5 rounded-lg mb-4 w-1/2 mx-auto" />
              <div className="h-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      ) : athletes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Users className="w-16 h-16 text-brand-text-dim mx-auto mb-4 opacity-30" />
          <p className="text-brand-text-muted text-lg">No athletes found</p>
          <p className="text-brand-text-dim text-sm mt-1">Try adjusting your search or sport filter</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {athletes.map((athlete, i) => (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card-hover p-5 cursor-pointer group relative overflow-hidden"
              onClick={() => setSelectedAthlete(athlete)}
            >
              {/* Decorative gradient blob */}
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${GRADIENT_PAIRS[i % GRADIENT_PAIRS.length]} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Connection badge */}
              {connections[athlete.id] && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="badge-green text-[10px]">
                    <CheckCircle className="w-2.5 h-2.5" /> Connected
                  </span>
                </div>
              )}

              {/* Avatar */}
              <div className="flex justify-center mb-4 relative">
                <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${GRADIENT_PAIRS[i % GRADIENT_PAIRS.length]} flex items-center justify-center text-3xl font-display font-black text-brand-gold group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  style={{ width: '4.5rem', height: '4.5rem' }}
                >
                  {athlete.name?.[0]}
                </div>
              </div>

              {/* Name & Info */}
              <div className="text-center mb-4 relative">
                <h3 className="font-display font-bold text-brand-text text-base group-hover:text-brand-gold transition-colors">
                  {athlete.name}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                  <span className="badge-gold text-[10px]">
                    <Trophy className="w-2.5 h-2.5" /> {athlete.sport}
                  </span>
                  <span className="text-[11px] text-brand-text-dim flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {athlete.state}
                  </span>
                </div>
              </div>

              {/* Bio preview */}
              <p className="text-xs text-brand-text-dim text-center line-clamp-2 mb-4 min-h-[2.5rem]">
                {athlete.bio || 'Passionate athlete looking for coaching support.'}
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Video className="w-3 h-3 text-brand-gold" />
                    <span className="font-display font-bold text-brand-text text-sm">{athlete.totalVideos || 0}</span>
                  </div>
                  <span className="text-[10px] text-brand-text-dim">Videos</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <TrendingUp className="w-3 h-3 text-brand-accent" />
                    <span className="font-display font-bold text-brand-text text-sm">{athlete.avgScore || 0}</span>
                  </div>
                  <span className="text-[10px] text-brand-text-dim">Avg Score</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 relative" onClick={(e) => e.stopPropagation()}>
                {connections[athlete.id] ? (
                  <button
                    onClick={() => handleEmail(athlete)}
                    className="gold-button flex-1 !py-2 text-xs flex flex-col items-center justify-center gap-0.5"
                  >
                    {revealedEmails[athlete.id] ? (
                      <span className="font-mono lowercase select-all">{athlete.email}</span>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Show Email</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleConnect(athlete)}
                      className="gold-button flex-1 !py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Connect
                    </button>
                    <button
                      onClick={() => handleEmail(athlete)}
                      className="gold-button-outline flex-1 !py-2 text-xs flex flex-col items-center justify-center gap-0.5"
                    >
                      {revealedEmails[athlete.id] ? (
                        <span className="font-mono lowercase select-all text-brand-gold">{athlete.email}</span>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Show Email</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <AthleteDetailModal
          athlete={selectedAthlete}
          onClose={() => setSelectedAthlete(null)}
          onConnect={handleConnect}
          onEmail={handleEmail}
          connectionStatus={connections[selectedAthlete.id]}
        />
      )}



    </div>
  )
}
