import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Award, CheckCircle, XCircle, Eye, AlertTriangle, Clock,
  Shield, Search, Filter, ChevronDown, Building2, FileText
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import ConfirmModal from '../components/ConfirmModal'

import api from '../lib/api'
import { toast } from 'react-toastify'

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    setLoading(true)
    
    // Professional approach: Use centralized API instance
    api.get('/admin/applications')
      .then(response => {
        const data = response.data
        // Map backend keys to frontend expected keys
        const mapped = data.map(app => {
          // Normalize aiDecision: backend sends 'approved'/'pending', UI expects 'approve'/'review'
          const rawAiDecision = app.ai_decision || app.status || 'pending'
          let aiDecision = 'review'
          if (rawAiDecision === 'approved' || rawAiDecision === 'approve') aiDecision = 'approve'
          else if (rawAiDecision === 'rejected' || rawAiDecision === 'reject') aiDecision = 'reject'
          
          return {
            id: app.id || app.user_id,
            name: app.name,
            sport: app.sport,
            org: app.organisation || 'N/A',
            experience: app.experience_yrs || app.experience || 0,
            aiScore: app.ai_score || 0,
            aiDecision: aiDecision,
            status: app.status,
            statement: app.bio || app.statement || '',
            reason: app.reason || 'AI verified base application details.',
            redFlags: app.red_flags || [],
            certValid: app.cert_valid !== undefined ? app.cert_valid : null,
            orgRecognized: app.org_recognized !== undefined ? app.org_recognized : true,
            certUrl: app.certificate_url || null,
            idProofUrl: app.id_proof_url || null,
            time: 'Just now'
          }
        })
        setApplications(mapped)
      })
      .catch(err => {
        console.error('Failed to fetch applications:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const filtered = applications.filter((app) => {
    if (filter !== 'all') {
      const currentTab = app.status === 'approved' ? 'approve' : 
                         app.status === 'rejected' ? 'reject' : 'review'
      if (currentTab !== filter) return false
    }
    if (search && !app.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAction = async (id, action) => {
    if (action === 'rejected' && (!isConfirmOpen || pendingAction?.id !== id)) {
      setPendingAction({ id, action })
      setIsConfirmOpen(true)
      return
    }
    
    const endpoint = action === 'approved' ? `/admin/approve-coach/${id}` : `/admin/reject-coach/${id}`
    
    try {
      // Professional approach: Use centralized API instance with empty body to avoid 415 error
      await api.post(endpoint, {});
      
      if (action === 'rejected') {
        setApplications((prev) => prev.filter((app) => app.id !== id))
        toast.success("Coach application rejected and account deleted.")
      } else {
        setApplications((prev) =>
          prev.map((app) => app.id === id ? { ...app, status: 'approved', aiDecision: 'approve' } : app)
        )
        toast.success("Coach application approved successfully!")
      }
      setSelected(null)
    } catch (err) {
      console.error('Action failed:', err)
      toast.error('Action failed: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-brand-text flex items-center gap-2">
          <Award className="w-6 h-6 text-brand-gold" /> Coach Applications
        </h1>
        <p className="text-brand-text-muted text-sm mt-1">Review and manage coach verification applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..." className="input-field !pl-10" />
        </div>
        <div className="flex gap-1 p-1 bg-brand-surface rounded-xl">
          {[
            { key: 'all', label: 'All' },
            { key: 'approve', label: 'Approved', color: 'text-brand-accent' },
            { key: 'review', label: 'Review', color: 'text-brand-gold' },
            { key: 'reject', label: 'Rejected', color: 'text-brand-danger' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-brand-text-dim">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-brand-text-dim">No applications found.</div>
        ) : filtered.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card-hover p-6 ${app.status !== 'pending' ? 'opacity-60' : ''}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold font-display font-bold text-lg">
                  {app.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-brand-text">{app.name}</h3>
                    <span className={`badge ${
                      app.aiDecision === 'approve' ? 'badge-green' :
                      app.aiDecision === 'review' ? 'badge-gold' : 'badge-red'
                    }`}>
                      {app.aiDecision === 'approve' && <CheckCircle className="w-3 h-3" />}
                      {app.aiDecision === 'reject' && <XCircle className="w-3 h-3" />}
                      {app.aiDecision === 'review' && <Eye className="w-3 h-3" />}
                      AI: {app.aiDecision}
                    </span>
                    {app.status !== 'pending' && (
                      <span className={`badge ${app.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                        {app.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {app.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-brand-text-dim flex-wrap">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {app.sport}</span>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {app.org}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {app.experience} years</span>
                    <span>{app.time}</span>
                  </div>
                </div>
              </div>

              {/* Right: AI Score + Actions */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 ${
                  app.aiScore >= 80 ? 'border-brand-accent bg-brand-accent/5' :
                  app.aiScore >= 30 ? 'border-brand-gold bg-brand-gold/5' :
                  'border-brand-danger bg-brand-danger/5'
                }`}>
                  <span className={`text-xl font-display font-bold ${
                    app.aiScore >= 80 ? 'text-brand-accent' :
                    app.aiScore >= 30 ? 'text-brand-gold' : 'text-brand-danger'
                  }`}>
                    {app.aiScore}
                  </span>
                  <span className="text-[10px] text-brand-text-dim">AI Score</span>
                </div>

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(app)} className="gold-button-outline !px-3 !py-2 text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Details
                    </button>
                    <button onClick={() => handleAction(app.id, 'approved')}
                      className="px-3 py-2 rounded-lg bg-brand-accent/10 text-brand-accent text-xs font-medium hover:bg-brand-accent/20 transition-all flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => handleAction(app.id, 'rejected')}
                      className="px-3 py-2 rounded-lg bg-brand-danger/10 text-brand-danger text-xs font-medium hover:bg-brand-danger/20 transition-all flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Red Flags */}
            {app.redFlags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {app.redFlags.map((flag) => (
                  <span key={flag} className="text-xs px-2 py-1 rounded-md bg-brand-danger/10 text-brand-danger flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {flag}
                  </span>
                ))}
              </div>
            )}

            {/* AI Reason */}
            <p className="text-xs text-brand-text-dim mt-3 bg-brand-dark/30 rounded-lg px-3 py-2">
              🤖 AI: {app.reason}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-surface border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-xl font-display font-bold text-brand-text mb-6">Application Details</h2>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-brand-text-dim">Name:</span> <span className="text-brand-text ml-2">{selected.name}</span></div>
                  <div><span className="text-brand-text-dim">Sport:</span> <span className="text-brand-text ml-2">{selected.sport}</span></div>
                  <div><span className="text-brand-text-dim">Experience:</span> <span className="text-brand-text ml-2">{selected.experience} years</span></div>
                  <div><span className="text-brand-text-dim">Organisation:</span> <span className="text-brand-text ml-2">{selected.org}</span></div>
                  <div><span className="text-brand-text-dim">Cert Valid:</span> <span className={`ml-2 ${selected.certValid === true ? 'text-brand-accent' : selected.certValid === false ? 'text-brand-danger' : 'text-brand-text-dim'}`}>{selected.certValid === null ? 'Unknown' : selected.certValid ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-brand-text-dim">Org Recognized:</span> <span className={`ml-2 ${selected.orgRecognized ? 'text-brand-accent' : 'text-brand-danger'}`}>{selected.orgRecognized ? 'Yes' : 'No'}</span></div>
                </div>
                {selected.statement && (
                  <div>
                    <span className="text-brand-text-dim">Professional Summary:</span>
                    <p className="text-brand-text mt-2 bg-brand-dark/50 rounded-lg p-3 text-xs leading-relaxed">{selected.statement}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {selected.certUrl ? (
                     <a href={selected.certUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-brand-surface border border-white/10 rounded-xl hover:border-brand-accent/50 transition-colors">
                       <FileText className="w-5 h-5 text-brand-accent" />
                       <span className="text-sm font-medium">View Certificate</span>
                     </a>
                  ) : (
                     <div className="flex items-center justify-center gap-2 py-3 bg-brand-surface/50 border border-white/5 rounded-xl text-brand-text-dim">
                       <FileText className="w-5 h-5" />
                       <span className="text-sm font-medium cursor-not-allowed">No Certificate</span>
                     </div>
                  )}

                  {selected.idProofUrl ? (
                     <a href={selected.idProofUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-brand-surface border border-white/10 rounded-xl hover:border-brand-accent/50 transition-colors">
                       <Shield className="w-5 h-5 text-brand-accent" />
                       <span className="text-sm font-medium">View ID Proof</span>
                     </a>
                  ) : (
                     <div className="flex items-center justify-center gap-2 py-3 bg-brand-surface/50 border border-white/5 rounded-xl text-brand-text-dim">
                       <Shield className="w-5 h-5" />
                       <span className="text-sm font-medium cursor-not-allowed">No ID Proof</span>
                     </div>
                  )}
                </div>

                <div>
                  <span className="text-brand-text-dim">AI Reason:</span>
                  <p className="text-brand-text mt-1 text-xs">{selected.reason}</p>
                </div>
                {selected.redFlags.length > 0 && (
                  <div>
                    <span className="text-brand-text-dim">Red Flags:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.redFlags.map((f) => (
                        <span key={f} className="badge-red"><AlertTriangle className="w-3 h-3" /> {f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => { handleAction(selected.id, 'approved') }}
                  className="flex-1 py-3 rounded-xl bg-brand-accent/10 text-brand-accent font-medium hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve Coach
                </button>
                <button onClick={() => { handleAction(selected.id, 'rejected') }}
                  className="flex-1 py-3 rounded-xl bg-brand-danger/10 text-brand-danger font-medium hover:bg-brand-danger/20 transition-all flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => handleAction(pendingAction?.id, pendingAction?.action)}
        title="Permanently Delete Application?"
        message="CAUTION: This will delete the coach's application AND their entire user account from the database. This action is irreversible. Proceed?"
        confirmText="Delete Account"
        type="danger"
      />
    </div>
  )
}
