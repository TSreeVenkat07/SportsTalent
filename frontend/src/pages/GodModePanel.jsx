import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Zap, Shield, Users, Activity, Database, Eye, Lock,
  Settings, BarChart3, AlertTriangle, Server, Globe,
  Clock, CheckCircle, Trash2, RefreshCw, Download, Plus, Mail, XCircle, Trophy
} from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from 'react-toastify'



const GOD_ACTIONS = [
  { id: 'system-health', label: 'System Health Monitor', desc: 'Real-time monitoring of AI processing nodes and database latency.', icon: Activity, danger: false },
  { id: 'ai-governance', label: 'AI Model Governance', desc: 'Review and calibrate threshold parameters for automated video verification.', icon: Zap, danger: false },
  { id: 'security-audit', label: 'Global Security Audit', desc: 'Trace administrative access logs and enforce multi-factor authentication.', icon: Shield, danger: false },
  { id: 'content-moderate', label: 'Content Moderation', desc: 'Manage reported videos and enforce community guidelines across the global feed.', icon: Eye, danger: true },
  { id: 'data-integrity', label: 'DB Integrity Check', desc: 'Validate foreign key constraints and synchronize staff-athlete profiles.', icon: Database, danger: true },
  { id: 'access-control', label: 'Advanced Access Control', desc: 'Override RLS policies for emergency data recovery or maintenance.', icon: Lock, danger: true },
]

export default function GodModePanel() {
  const [activeTab, setActiveTab] = useState('system')
  const [activeAction, setActiveAction] = useState(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // { type: 'reject' | 'system', id: string }
  const godModeToken = useAuthStore((s) => s.godModeToken)
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  
  // Hardened role detection: Prioritize founder if godModeToken exists
  const role = godModeToken ? 'founder' : (user?.role || 'admin')
  
  const [team, setTeam] = useState([])
  const [applications, setApplications] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, athletes: 0, coaches: 0, totalVideos: 0, activeNow: 0 })
  const [showCreate, setShowCreate] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'reviewer', sport_scope: 'all' })
  const [generatedCreds, setGeneratedCreds] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTeam()
    fetchApplications()
    fetchAuditLogs()
    fetchStats()

    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab && ['system', 'applications', 'team'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [location.search])

  const fetchStats = async () => {
    try {
      const res = await api.get('/godmode/stats')
      if (res.data) setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-log')
      if (Array.isArray(res.data)) setAuditLogs(res.data)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    }
  }

  const fetchApplications = async () => {
    try {
      const res = await api.get('/admin/applications')
      if (res.data) setApplications(res.data)
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    }
  }

  const fetchTeam = async () => {
    try {
      const res = await api.get('/admin/team')
      if (Array.isArray(res.data)) setTeam(res.data)
    } catch (err) {
      console.error('Failed to fetch team:', err)
    }
  }

  const handleApproveCoach = async (userId) => {
    try {
      await api.post(`/admin/approve-coach/${userId}`, {})
      fetchApplications()
      fetchAuditLogs()
      fetchStats() // Update stat counts
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  const handleRejectCoach = async (userId) => {
    if (!isConfirmOpen) {
      setPendingAction({ type: 'reject', id: userId })
      setIsConfirmOpen(true)
      return
    }
    try {
      await api.post(`/admin/reject-coach/${userId}`, {})
      fetchApplications()
      fetchAuditLogs()
      fetchStats()
      toast.success("Coach application rejected and account deleted.")
    } catch (err) {
      console.error('Reject failed:', err)
      toast.error("Failed to reject application.")
    }
  }

  const handleSystemAction = (actionId) => {
    setActiveAction(actionId)
    setPendingAction({ type: 'system', id: actionId })
    setIsConfirmOpen(true)
  }

  const executeSystemAction = () => {
     toast.info(`Executing ${pendingAction?.id}... Simulation complete.`)
  }

  const handleCreate = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/admin/create', newAdmin)
      const data = res.data
      setGeneratedCreds({ email: data.email, password: data.temp_password })
      fetchTeam()
      fetchAuditLogs()
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await api.post(`/admin/revoke/${id}`, {})
      fetchTeam()
      fetchAuditLogs()
    } catch (err) {
      console.error('Revoke failed:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center animate-glow">
            <Zap className="w-6 h-6 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold gold-gradient-text">God Mode</h1>
            <p className="text-brand-text-dim text-xs">Founder-only system control panel</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-danger/5 border border-brand-danger/20 text-brand-danger text-xs">
          <AlertTriangle className="w-4 h-4" />
          All actions in God Mode are logged to the immutable audit trail. Proceed with caution.
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-brand-gold' },
          { label: 'Athletes', value: stats.athletes, icon: Activity, color: 'text-brand-accent' },
          { label: 'Coaches', value: stats.coaches, icon: Shield, color: 'text-purple-400' },
          { label: 'Feed Videos', value: stats.totalVideos, icon: Database, color: 'text-orange-400' },
          { label: 'Active Now', value: stats.activeNow, icon: Globe, color: 'text-cyan-400' },
          { label: 'Uptime', value: '100%', icon: Clock, color: 'text-brand-accent' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <div className="text-lg font-display font-bold text-brand-text">{stat.value}</div>
            <div className="text-[10px] text-brand-text-dim">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-white/5 rounded-xl w-fit">
        <button onClick={() => setActiveTab('system')} 
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'system' ? 'bg-brand-gold text-brand-dark' : 'text-brand-text-dim hover:text-brand-text'}`}>
          System Control
        </button>
        <button onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'applications' ? 'bg-brand-gold text-brand-dark' : 'text-brand-text-dim hover:text-brand-text'}`}>
          Coach Review Queue
          {applications.filter(a => a.status === 'pending').length > 0 && (
            <span className="bg-brand-danger text-white px-1.5 rounded-full text-[10px]">
              {applications.filter(a => a.status === 'pending').length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'team' ? 'bg-brand-gold text-brand-dark' : 'text-brand-text-dim hover:text-brand-text'}`}>
          <Shield className="w-3 h-3" />
          Admin Team
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'system' ? (
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-brand-gold" /> System Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOD_ACTIONS.map((action, i) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSystemAction(action.id)}
                    className={`glass-card p-5 text-left transition-all hover:border-white/10 ${
                      activeAction === action.id ? 'border-brand-gold/30 bg-brand-gold/5' : ''
                    } ${action.danger ? 'hover:border-brand-danger/30' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        action.danger ? 'bg-brand-danger/10' : 'bg-brand-gold/10'
                      }`}>
                        <action.icon className={`w-4 h-4 ${action.danger ? 'text-brand-danger' : 'text-brand-gold'}`} />
                      </div>
                      <h3 className="text-sm font-semibold text-brand-text">{action.label}</h3>
                    </div>
                    <p className="text-xs text-brand-text-dim">{action.desc}</p>
                    {action.danger && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand-danger mt-2">
                        <AlertTriangle className="w-3 h-3" /> Destructive action
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>
          </div>
        ) : activeTab === 'team' ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Admin Management Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-gold" /> Admin Team
                </h2>
                {role === 'founder' ? (
                  <button 
                    onClick={() => { setShowCreate(true); setGeneratedCreds(null); setError(''); }}
                    className="gold-button !py-1.5 !px-3 text-xs flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Admin
                  </button>
                ) : (
                  <span className="text-[10px] text-brand-danger bg-brand-danger/10 px-2 py-1 rounded border border-brand-danger/20 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Admin Creation Locked
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {team.length === 0 && (
                  <div className="glass-card p-6 text-center">
                    <p className="text-brand-text-dim text-xs">No admin accounts created yet.</p>
                  </div>
                )}
                {team.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-card p-4 flex items-center justify-between ${!member.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold text-xs">
                        {member.name?.[0] || 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-brand-text">{member.name || 'System Admin'}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            member.role === 'admin' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-accent/10 text-brand-accent'
                          }`}>
                            {member.role || 'admin'}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-text-dim">{member.email || '-'}</p>
                      </div>
                    </div>
                    {member.is_active && role === 'founder' && (
                      <button onClick={() => handleRevoke(member.id)} className="p-1.5 rounded-lg text-brand-danger hover:bg-brand-danger/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-brand-gold" /> Coach Applications
              </h2>
              <div className="space-y-3">
                {applications.filter(a => a.status === 'pending').length === 0 && (
                  <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-brand-text-dim" />
                    </div>
                    <p className="text-brand-text-dim text-sm">Review queue is empty.</p>
                    <p className="text-[10px] text-brand-text-dim mt-1 uppercase tracking-widest font-bold">All coaches verified</p>
                  </div>
                )}
                {applications.filter(a => a.status === 'pending').map((app, i) => (
                  <motion.div key={app.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-brand-text">{app.name}</h3>
                          <span className="badge-gold text-[10px]">{app.sport}</span>
                        </div>
                        <p className="text-xs text-brand-text-dim mb-2">{app.email}</p>
                        <div className="flex items-center gap-3 text-[10px] text-brand-text-muted">
                          <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {app.experience}y Exp</span>
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {app.organisation}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApproveCoach(app.user_id)}
                          className="gold-button !py-1.5 !px-4 text-xs font-bold shadow-lg shadow-brand-gold/10 hover:shadow-brand-gold/20">
                          Approve Coach
                        </button>
                        <button onClick={() => handleRejectCoach(app.user_id)}
                          className="p-2 rounded-lg border border-white/5 text-brand-text-dim hover:text-brand-danger hover:bg-brand-danger/5 transition-all"
                          title="Reject and delete coach account">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Audit Log / Side Panel */}
        <div>
          <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand-gold" /> Persistent Audit Trail
          </h2>
          <div className="glass-card p-0 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <p className="text-[10px] text-brand-text-dim uppercase font-bold tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                Live Founder Actions
              </p>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[10px] text-brand-text-dim uppercase tracking-wider">No actions logged yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <p className="text-xs text-brand-text font-medium mb-1">{log.action}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-brand-gold/60 uppercase font-bold tracking-tighter">
                          {log.actor_role}
                        </span>
                        <span className="text-[9px] text-brand-text-dim">
                          {log.time ? new Date(log.time).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 mt-auto border-t border-white/5 bg-brand-dark/50">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-1.5 h-1.5 rounded-full ${role === 'founder' ? 'bg-brand-gold' : 'bg-brand-accent'}`} />
                <span className="text-[10px] font-bold text-brand-text capitalize">Logged as {role}</span>
              </div>
              <p className="text-[9px] text-brand-text-dim flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Trail is immutable — no DELETE policy exists
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-brand-surface border border-white/10 rounded-2xl p-8 w-full max-w-lg relative overflow-hidden">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-brand-text-dim hover:text-brand-text">
              <XCircle className="w-5 h-5" />
            </button>

            {!generatedCreds ? (
              <>
                <h2 className="text-xl font-display font-bold text-brand-text mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-gold" /> Create Admin Account
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-brand-text-muted mb-2 font-semibold uppercase tracking-wider">Full Name</label>
                    <input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin(p => ({...p, name: e.target.value}))}
                      className="input-field" placeholder="Admin name" />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-text-muted mb-2 font-semibold uppercase tracking-wider">Email Address</label>
                    <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin(p => ({...p, email: e.target.value}))}
                      className="input-field" placeholder="admin@sporttalenthunt.in" />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-text-muted mb-2 font-semibold uppercase tracking-wider">Setup Admin Password</label>
                    <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin(p => ({...p, password: e.target.value}))}
                      className="input-field" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-brand-text-muted mb-2 font-semibold uppercase tracking-wider">Role</label>
                      <select value={newAdmin.role} onChange={(e) => setNewAdmin(p => ({...p, role: e.target.value}))} className="input-field">
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-brand-text-muted mb-2 font-semibold uppercase tracking-wider">Sport Scope</label>
                      <select value={newAdmin.sport_scope} onChange={(e) => setNewAdmin(p => ({...p, sport_scope: e.target.value}))} className="input-field">
                        <option value="all">All Sports</option>
                        <option value="Athletics">Athletics</option>
                        <option value="Wrestling">Wrestling</option>
                        <option value="Cricket">Cricket</option>
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-brand-danger/10 border border-brand-danger/20 rounded-lg p-3 text-brand-danger text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button onClick={handleCreate} disabled={loading} className="gold-button w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Mail className="w-4 h-4" /> Create Account & Generate Credentials</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-brand-accent" />
                </div>
                <h2 className="text-xl font-display font-bold text-brand-text mb-2">Account Created!</h2>
                <p className="text-brand-text-dim text-xs mb-6">Credential generated successfully</p>
                <div className="bg-brand-dark/50 border border-white/5 rounded-xl p-4 space-y-4 text-left">
                  <div className="flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] text-brand-text-dim uppercase font-bold tracking-widest mb-1">Email</p>
                      <p className="text-sm text-brand-text font-mono tracking-tight">{generatedCreds.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] text-brand-text-dim uppercase font-bold tracking-widest mb-1">Temporary Password</p>
                      <p className="text-sm text-brand-gold font-mono tracking-tight">{generatedCreds.password}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setShowCreate(false)} className="gold-button flex-1">Done</button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (pendingAction?.type === 'reject') {
            handleRejectCoach(pendingAction.id)
          } else {
            executeSystemAction()
          }
        }}
        title={pendingAction?.type === 'reject' ? "Permanently Delete Coach?" : "Execute System Action?"}
        message={pendingAction?.type === 'reject' 
          ? "CAUTION: This will delete the coach's application AND their entire user account. This action is irreversible. Proceed?" 
          : "CAUTION: This operation is destructive and irreversible. It will bypass all standard security protocols. Proceed with administrative override?"
        }
        confirmText={pendingAction?.type === 'reject' ? "Delete Account" : "Confirm Execution"}
        type="danger"
      />
    </div>
  )
}
