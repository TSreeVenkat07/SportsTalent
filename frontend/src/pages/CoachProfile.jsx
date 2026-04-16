import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { Shield, MapPin, Trophy, Calendar, Users, CheckCircle, UserPlus } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function CoachProfile() {
  const { id } = useParams()
  const { token, user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/profile/${id}`)
      .then(res => {
        const data = res.data
        setProfile({
          id: data.id,
          name: data.name || 'Unknown Coach',
          sport: data.sport || 'General',
          org: data.org || data.organisation || 'Academy / Club',
          state: data.state || 'Unknown',
          experience: data.experience || 0,
          bio: data.bio || 'Professional coach dedicated to athlete development.',
          verified: data.is_active || false,
          athletes: data.athletes_count || 0,
          joined: data.joined || 'Recently',
        })
        setIsConnected(data.connection_status === 'accepted' || data.connection_status === 'self')
      })
      .catch(err => console.error('Coach profile load failed:', err))
      .finally(() => setLoading(false))
  }, [id, token])

  const handleConnect = async () => {
    if (connecting || isConnected) return
    setConnecting(true)
    try {
      const res = await api.post('/connect/request', { athlete_id: id })
      if (res.status === 200 || res.status === 201) {
        setIsConnected(true)
      }
    } catch (err) {
      console.error('Connect failed:', err)
    } finally {
      setConnecting(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-text-dim text-sm animate-pulse">Retrieving coach profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-accent/30 to-brand-gold/20 flex items-center justify-center text-4xl font-display font-black text-brand-accent">
            {profile.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-display font-bold text-brand-text">{profile.name}</h1>
              {profile.verified && <span className="badge-green text-xs"><CheckCircle className="w-3 h-3" /> Verified Coach</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-brand-text-muted">
              <span className="badge-gold"><Trophy className="w-3 h-3" /> {profile.sport}</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {profile.org}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.state}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {profile.experience} years exp</span>
            </div>
            <p className="text-brand-text-muted text-sm mt-3 italic">"{profile.bio}"</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="text-center group">
            <div className="text-2xl font-display font-bold text-brand-gold group-hover:scale-110 transition-transform">{profile.athletes}</div>
            <div className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Athletes</div>
          </div>
          <div className="text-center group">
            <div className="text-2xl font-display font-bold text-brand-accent group-hover:scale-110 transition-transform">{profile.experience}y</div>
            <div className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold">Experience</div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      {user?.id !== id && (
        <div className="flex gap-3">
          {isConnected ? (
            <div className="flex-1 py-4 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> Connected
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="gold-button w-full flex items-center justify-center gap-3 py-4 text-sm font-bold shadow-xl disabled:opacity-50"
            >
              {connecting ? (
                <div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-5 h-5" /> Connect with Coach</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
