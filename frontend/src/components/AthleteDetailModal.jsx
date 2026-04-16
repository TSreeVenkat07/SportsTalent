import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Trophy, MapPin, Video, TrendingUp, UserPlus, Mail,
  CheckCircle, Shield, Activity
} from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function AthleteDetailModal({ athlete, onClose, onConnect, onEmail, connectionStatus }) {
  const [connecting, setConnecting] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const isConnected = connectionStatus === 'accepted'

  const handleConnect = async () => {
    setConnecting(true)
    await onConnect(athlete)
    setConnecting(false)
  }

  if (!athlete) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-brand-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Hero / Header */}
          <div className="relative h-40 bg-gradient-to-br from-brand-gold/20 via-brand-accent/10 to-purple-500/10 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-gold/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-brand-accent/10 blur-2xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar */}
            <div className="absolute -bottom-10 left-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-gold/40 to-brand-accent/30 border-4 border-brand-surface flex items-center justify-center text-4xl font-display font-black text-brand-gold shadow-xl">
                {athlete.name?.[0]}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-6 pt-14 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-brand-text">{athlete.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="badge-gold">
                    <Trophy className="w-3 h-3" /> {athlete.sport}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-brand-text-dim">
                    <MapPin className="w-3 h-3" /> {athlete.district ? `${athlete.district}, ` : ''}{athlete.state}
                  </span>
                </div>
              </div>
              {isConnected && (
                <span className="badge-green">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            {/* Bio */}
            <p className="text-sm text-brand-text-muted leading-relaxed mb-6">
              {athlete.bio || 'This athlete hasn\'t added a bio yet.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="glass-card p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Video className="w-4 h-4 text-brand-gold" />
                  <span className="text-xl font-display font-bold text-brand-text">{athlete.totalVideos || 0}</span>
                </div>
                <span className="text-xs text-brand-text-dim">Videos</span>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-brand-accent" />
                  <span className="text-xl font-display font-bold text-brand-text">{athlete.avgScore || 0}</span>
                </div>
                <span className="text-xs text-brand-text-dim">Avg Score</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="gold-button flex-1 flex items-center justify-center gap-2 !py-3"
                >
                  {connecting ? (
                    <div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              ) : (
                <div className="flex-1 glass-card flex items-center justify-center gap-2 py-3 text-brand-accent text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Connected
                </div>
              )}
              <button
                onClick={() => {
                  if (!revealed) setRevealed(true)
                  else onEmail(athlete)
                }}
                className="gold-button-outline flex-1 flex flex-col items-center justify-center gap-0.5 !py-3"
              >
                {revealed ? (
                  <span className="text-[11px] font-mono lowercase select-all text-brand-gold">{athlete.email}</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Show Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
