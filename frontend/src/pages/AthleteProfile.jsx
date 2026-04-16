import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../store/authStore'
import {
  MapPin, Trophy, Calendar, Video,
  User, Target, Edit2, Camera, Shield, Award, ChevronRight, Activity,
  Lock, CheckCircle, UserPlus, Play, X
} from 'lucide-react'

export default function AthleteProfile() {
  const { id } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!id) return;
    setLoading(true)

    api.get(`/profile/${id}`)
      .then(response => {
        const data = response.data
        setProfile({
          id: data.id,
          name: data.name || 'Athlete Name',
          sport: data.sport || 'General',
          state: data.state || 'Unknown',
          district: data.district || '-',
          bio: data.bio || 'Young athlete eager to improve and find top coaches. Dedicated to daily training and mastering the fundamentals.',
          avgScore: data.stats?.avgScore || 0,
          totalVideos: data.stats?.videos || 0,
          joined: data.joined || 'Recently',
          submissions: data.submissions || [],
          isConnected: data.connection_status === 'accepted' || data.connection_status === 'self'
        })
      })
      .catch(err => {
        console.error('Profile fetch failed:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token, id])

  const handleConnect = async () => {
    if (connecting || profile.isConnected) return
    setConnecting(true)
    try {
      const res = await api.post('/connect/request', { athlete_id: id })
      if (res.status === 200 || res.status === 201) {
        setProfile(prev => ({ ...prev, isConnected: true }))
      }
    } catch (err) {
      console.error('Connect failed:', err)
    } finally {
      setConnecting(false)
    }
  }

  // Permission check: Who can see full info?
  // 1. Same user (athlete looking at own profile)
  // 2. Connected coach
  // 3. Admin (optional, but let's stick to connected logic for now)
  const canSeeFullInfo = profile?.isConnected || (user?.role === 'athlete' && user?.id === id)

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-text-dim text-sm animate-pulse">Retrieving athlete profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-8 relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 blur-3xl -mr-32 -mt-32 rounded-full" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-gold/30 to-brand-accent/20 flex items-center justify-center text-4xl font-display font-black text-brand-gold border border-white/10 shadow-xl">
            {profile.name[0]}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold text-brand-text tracking-tight">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="badge-gold px-3 py-1 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> {profile.sport}</span>
              <span className="flex items-center gap-1.5 text-brand-text-dim bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <MapPin className="w-3.5 h-3.5 text-brand-accent" /> {profile.district}, {profile.state}
              </span>
              <span className="flex items-center gap-1.5 text-brand-text-dim bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <Calendar className="w-3.5 h-3.5" /> Joined {profile.joined}
              </span>
            </div>
            {/* Bio - Gated */}
            {canSeeFullInfo ? (
              <p className="text-brand-text-muted text-sm mt-4 leading-relaxed max-w-2xl">{profile.bio}</p>
            ) : (
              <div className="flex items-center gap-2 mt-4 text-brand-text-dim text-xs italic bg-white/5 w-fit px-3 py-1.5 rounded-lg">
                <Lock className="w-3 h-3" /> Bio restricted to connected coaches
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-6 self-stretch justify-between">
            {/* Stats - Gated */}
            <div className="flex gap-8">
              <div className="text-center group">
                <div className="text-2xl font-display font-bold text-brand-gold group-hover:scale-110 transition-transform">
                  {canSeeFullInfo ? profile.avgScore : '??'}
                </div>
                <div className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold">Avg Score</div>
              </div>
              <div className="text-center group">
                <div className="text-2xl font-display font-bold text-brand-text group-hover:scale-110 transition-transform">
                  {canSeeFullInfo ? profile.totalVideos : '??'}
                </div>
                <div className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold">Videos</div>
              </div>
            </div>

            {/* Connect Button (for Coaches) */}
            {user?.role === 'coach' && user?.id !== id && (
              <button
                onClick={handleConnect}
                disabled={connecting || profile.isConnected}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                  profile.isConnected 
                    ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30 pointer-events-none'
                    : 'bg-brand-gold text-black hover:bg-yellow-400 hover:scale-105 active:scale-95'
                }`}
              >
                {profile.isConnected ? (
                  <><CheckCircle className="w-4 h-4" /> Connected</>
                ) : connecting ? (
                  'Connecting...'
                ) : (
                  <><UserPlus className="w-4 h-4" /> Connect with Athlete</>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Submissions Grid — Instagram-style */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-brand-text flex items-center gap-2">
          <Activity className="w-6 h-6 text-brand-gold" /> Performance Tapes
        </h2>
        <div className="text-xs text-brand-text-dim bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          {canSeeFullInfo ? profile.submissions.length : '??'} Total Uploads
        </div>
      </div>

      {!canSeeFullInfo ? (
        <div className="glass-card p-20 text-center border-dashed border-white/10 bg-white/[0.02]">
          <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-brand-gold" />
          </div>
          <h3 className="text-xl font-display font-bold text-brand-text mb-2">Private Performance Feed</h3>
          <p className="text-brand-text-dim text-sm max-w-sm mx-auto mb-8">
            Connect with {profile.name} to unlock their full scouting bio, technical breakdown, and exclusive performance videos.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting || profile.isConnected}
            className="gold-button px-8 py-3 flex items-center gap-2 mx-auto"
          >
            <UserPlus className="w-5 h-5" /> Request Connection
          </button>
        </div>
      ) : profile.submissions.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Video className="w-16 h-16 text-brand-text-dim mx-auto mb-4 opacity-20" />
          <p className="text-brand-text-dim">No videos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {profile.submissions.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedVideo(sub.video_url)}
              className="aspect-[4/5] glass-card-hover flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10"
            >
              {/* Play Icon Placeholder */}
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-gold/10 transition-all">
                <Play className="w-6 h-6 text-brand-gold fill-current ml-1" />
              </div>
              
              <div className="mt-4 text-center px-4">
                <p className="text-sm font-bold text-brand-text truncate w-full group-hover:text-brand-gold transition-colors">{sub.exercise}</p>
                <p className="text-[10px] text-brand-text-dim font-bold tracking-widest uppercase mt-1">
                  {new Date(sub.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Score overlay on hover */}
              <div className="absolute inset-0 bg-brand-dark/90 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center flex-col backdrop-blur-sm">
                <div className="text-xs text-brand-text-dim mb-1 uppercase tracking-widest font-bold">Live AI Score</div>
                <div className={`text-4xl font-display font-black ${
                  sub.score >= 80 ? 'text-brand-accent' : sub.score >= 60 ? 'text-brand-gold' : 'text-brand-danger'
                }`}>
                  {sub.score}
                </div>
                <div className="mt-4 bg-brand-gold px-4 py-1.5 rounded-full text-[10px] font-bold text-black uppercase tracking-widest">
                  Watch Recording
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-brand-surface rounded-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="aspect-video bg-black flex items-center justify-center">
                <video
                  src={selectedVideo}
                  className="w-full h-full"
                  controls
                  autoPlay
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
