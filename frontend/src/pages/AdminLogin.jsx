import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, RefreshCw, AlertTriangle, ArrowRight, Zap } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, setGodMode, isAuthenticated, user, godModeToken } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Senior Polish: Effect-Driven Instant Redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetRole = user.role || (godModeToken || user.is_god_mode ? 'founder' : 'admin')
      if (targetRole === 'founder' || godModeToken) {
        navigate('/god-mode', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, godModeToken, navigate])

  // Senior Render Guard: If authorized, don't show the form to avoid "fighting" UI
  if (isAuthenticated && !loading) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/godmode/access', { email, password })
      const { token, access_token, user: resUser, is_god_mode } = res.data
      const authToken = token || access_token
      
      if (is_god_mode) {
        setGodMode(authToken)
      }
      
      // Store user and token — triggers useEffect redirect instantly
      login(resUser || { 
        email: email || 'founder@sporttalenthunt.in', 
        role: is_god_mode ? 'founder' : 'admin', 
        name: is_god_mode ? 'Founder' : 'Administrator' 
      }, authToken)
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4 animate-glow">
            <Shield className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-2xl font-display font-bold text-brand-text mb-2">Admin Portal</h1>
          <p className="text-brand-text-dim text-sm">Secure access for platform administrators</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] text-brand-text-dim uppercase font-bold tracking-widest mb-2 px-1">Email Address (Optional for Master Access)</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim group-focus-within:text-brand-gold transition-colors" />
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11" placeholder="admin@sporttalenthunt.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-brand-text-dim uppercase font-bold tracking-widest mb-2 px-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim group-focus-within:text-brand-gold transition-colors" />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11" placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <button 
            type="submit" disabled={loading}
            className="gold-button w-full flex items-center justify-center gap-2 py-4 h-auto group disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Confirm Credentials
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-brand-text-dim flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Immutable system audit logs active for this session
          </p>
        </div>
      </motion.div>

      {/* Secret Entry Link Indicator (subtle) */}
      <Link to="/" className="fixed bottom-4 left-4 text-[8px] text-white/5 hover:text-brand-gold transition-colors">
        System Root
      </Link>
    </div>
  )
}
