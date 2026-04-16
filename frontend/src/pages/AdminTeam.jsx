import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, Users, Plus, Mail, Lock, AlertTriangle, CheckCircle, 
  XCircle, Settings, Trash2, Copy, Eye, EyeOff
} from 'lucide-react'
import useAuthStore from '../store/authStore'


import api from '../lib/api'

export default function AdminTeam() {
  const user = useAuthStore((s) => s.user)
  const godModeToken = useAuthStore((s) => s.godModeToken)
  const token = useAuthStore((s) => s.token)
  const [team, setTeam] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'reviewer', sport_scope: 'all' })
  const [generatedCreds, setGeneratedCreds] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get the auth token (prefer god mode token, fall back to user token)
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${godModeToken || token}` }
  })

  // Fetch team list on mount
  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      // Professional approach: Use centralized API with specific header override if needed
      const res = await api.get('/admin/team', getAuthHeader())
      if (Array.isArray(res.data)) {
        setTeam(res.data)
      } else {
        console.error("Backend did not return an array for the team list:", res.data)
        setTeam([])
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 422) {
        useAuthStore.getState().logout() // Clear all invalid tokens
        setError('God Mode session expired. Please log out and sign back in.')
      } else {
        console.error('Could not fetch team:', err)
        setTeam([])
      }
    }
  }

  const handleCreate = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Professional approach: Use centralized API with specific header override
      const res = await api.post('/admin/create', newAdmin, getAuthHeader())
      const data = res.data
      setGeneratedCreds({ email: data.email, password: data.temp_password })
      // Refresh the team list from the server
      fetchTeam()
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 422) {
        useAuthStore.getState().logout()
        setError('Session invalid. Please refresh and re-enter God Mode.')
      } else {
        console.error("Create admin error:", err)
        setError(err.response?.data?.error || 'Failed to create admin')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      // Professional approach: Use centralized API
      await api.post(`/admin/revoke/${id}`, {}, getAuthHeader())
      fetchTeam()
    } catch (err) {
      console.error('Revoke failed:', err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-text flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-gold" /> Admin Team
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">Manage admin accounts and permissions (Founder only)</p>
        </div>
        <button onClick={() => { setShowCreate(true); setGeneratedCreds(null); setError(''); setNewAdmin({ name: '', email: '', role: 'reviewer', sport_scope: 'all' }) }} className="gold-button flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Create Admin
        </button>
      </div>

      {/* Team List */}
      {team.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Users className="w-10 h-10 text-brand-text-dim mx-auto mb-3" />
          <p className="text-brand-text-muted text-sm">No admin accounts yet. Click "Create Admin" to add one.</p>
        </div>
      )}

      <div className="space-y-4">
        {team.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-5 ${!member.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  member.role === 'admin' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-accent/10 text-brand-accent'
                }`}>
                  {member.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-brand-text text-sm">{member.name}</h3>
                    <span className={`badge ${member.role === 'admin' ? 'badge-gold' : 'badge-green'}`}>
                      {member.role}
                    </span>
                    {!member.is_active && <span className="text-xs px-2 py-0.5 rounded bg-brand-danger/10 text-brand-danger">Revoked</span>}
                  </div>
                  <p className="text-xs text-brand-text-dim mt-1">
                    {member.email} · Sport: {member.sport_scope}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.permissions && (
                  <div className="flex gap-1 text-xs">
                    {Object.entries(member.permissions).map(([key, val]) => (
                      <span key={key} className={`px-2 py-0.5 rounded ${val ? 'bg-brand-accent/10 text-brand-accent' : 'bg-white/5 text-brand-text-dim'}`}>
                        {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {member.is_active && (
                  <button onClick={() => handleRevoke(member.id)}
                    className="p-2 rounded-lg text-brand-danger hover:bg-brand-danger/10 transition-all" title="Revoke access">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Admin Modal */}
      {showCreate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-brand-surface border border-white/10 rounded-2xl p-8 w-full max-w-lg">
            
            {!generatedCreds ? (
              <>
                <h2 className="text-xl font-display font-bold text-brand-text mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-gold" /> Create Admin Account
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-brand-text-muted mb-2">Full Name</label>
                    <input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin(p => ({...p, name: e.target.value}))}
                      className="input-field" placeholder="Admin name" />
                  </div>
                  <div>
                    <label className="block text-sm text-brand-text-muted mb-2">Email</label>
                    <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin(p => ({...p, email: e.target.value}))}
                      className="input-field" placeholder="admin@sporttalenthunt.in" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-brand-text-muted mb-2">Role</label>
                      <select value={newAdmin.role} onChange={(e) => setNewAdmin(p => ({...p, role: e.target.value}))} className="input-field">
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-brand-text-muted mb-2">Sport Scope</label>
                      <select value={newAdmin.sport_scope} onChange={(e) => setNewAdmin(p => ({...p, sport_scope: e.target.value}))} className="input-field">
                        <option value="all">All Sports</option>
                        <option value="Athletics">Athletics</option>
                        <option value="Wrestling">Wrestling</option>
                        <option value="Cricket">Cricket</option>
                      </select>
                    </div>
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-brand-danger text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {error}
                    </motion.p>
                  )}

                  <button onClick={handleCreate} disabled={loading} className="gold-button w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
                    ) : (
                      <><Mail className="w-4 h-4" /> Create Admin Account</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <CheckCircle className="w-14 h-14 text-brand-accent mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-brand-text mb-2">Account Created!</h2>
                <p className="text-brand-text-muted text-sm mb-6">Share these credentials with the admin. They can log in at the Sign In page.</p>
                <div className="bg-brand-dark rounded-xl p-4 space-y-3 text-left text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-dim">Email:</span>
                    <span className="text-brand-text font-mono">{generatedCreds.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-dim">Password:</span>
                    <span className="text-brand-gold font-mono">{generatedCreds.password}</span>
                  </div>
                  <p className="text-xs text-brand-text-dim">💡 The admin can now log in using the normal Sign In page with these credentials.</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="gold-button w-full mt-6">Done</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

