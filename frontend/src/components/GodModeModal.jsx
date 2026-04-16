import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function GodModeModal({ onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setGodMode = useAuthStore((s) => s.setGodMode)

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Password is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/godmode/access', { password })
      
      const { token, access_token } = res.data
      const authToken = token || access_token
      setGodMode(authToken)
      onClose()
      navigate('/god-mode')
    } catch (err) {
      console.error('God Mode access error:', err)
      const errorMsg = err.response?.data?.error || 'Connection failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-brand-surface border border-brand-gold/20 rounded-2xl p-8 w-full max-w-md 
                     shadow-2xl shadow-brand-gold/10 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-gold/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-gold/5 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-brand-gold" />
              </div>
              <h2 className="text-2xl font-display font-bold text-brand-gold">⚡ God Mode</h2>
            </div>
            <p className="text-brand-text-muted text-sm mb-1">
              Founder access only. This session will be logged.
            </p>
            <div className="flex items-center gap-1.5 mb-6">
              <AlertTriangle className="w-3 h-3 text-brand-gold/60" />
              <p className="text-brand-text-dim text-xs">
                IP address and user agent recorded for security
              </p>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Master password"
              autoFocus
              className="input-field mb-3"
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-brand-danger text-xs mb-3 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3 h-3" />
                {error}
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="gold-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
              ) : (
                <>Enter God Mode →</>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 text-brand-text-dim text-sm hover:text-brand-text transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
