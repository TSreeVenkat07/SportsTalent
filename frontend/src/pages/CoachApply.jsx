import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, Upload, FileText, Award, Building2, Clock, 
  User, ChevronRight, ArrowRight, CheckCircle
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import { toast } from 'react-toastify'

const STEPS = ['Personal Info', 'Credentials', 'Statement', 'Review']

export default function CoachApply() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  
  const [form, setForm] = useState({
    sport: user?.sport || '', 
    experience_yrs: '', 
    organisation: '',
    statement: '', 
    cert_file: null, 
    id_file: null,
  })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleFile = (field) => (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, [field]: file }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Professional approach: Use the centralized API instance
      // This automatically handles the correct token (sth_token) and base URL
      const formData = new FormData();
      formData.append('sport', form.sport);
      formData.append('experience_yrs', form.experience_yrs);
      formData.append('organisation', form.organisation);
      formData.append('statement', form.statement);
      if (form.cert_file) formData.append('certificate', form.cert_file);
      if (form.id_file) formData.append('idProof', form.id_file);

      const response = await api.post('/coach/apply', formData);

      if (response.status === 201) {
        setSubmitted(true)
        toast.success("Application submitted successfully!")
      } else {
        toast.error('Error submitting application: ' + (response.data?.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Submission error:', err)
      // Scalable error handling: Check for response or network error
      const errorMsg = err.response?.data?.error || err.message || 'Failed to connect to server'
      toast.error('Error submitting application: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
          <div className="w-20 h-20 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-accent" />
          </div>
          <h1 className="text-3xl font-display font-bold text-brand-text mb-4">Application Submitted!</h1>
          <p className="text-brand-text-muted mb-2">Your application is being reviewed by our AI verification system.</p>
          <p className="text-brand-text-dim text-sm">You'll receive an email with the decision within 24-48 hours.</p>
          <div className="mt-8 glass-card p-6 text-left max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-brand-text mb-3">What happens next?</h3>
            <div className="space-y-3 text-sm text-brand-text-muted">
              <div className="flex gap-2"><span className="text-brand-gold">1.</span> AI reviews your credentials</div>
              <div className="flex gap-2"><span className="text-brand-gold">2.</span> Score 80+ → auto-approved</div>
              <div className="flex gap-2"><span className="text-brand-gold">3.</span> Score 30-79 → human admin review</div>
              <div className="flex gap-2"><span className="text-brand-gold">4.</span> You receive email notification</div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-brand-text flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-gold" />
          Apply as Coach
        </h1>
        <p className="text-brand-text-muted text-sm mt-1">
          Submit your credentials for AI-powered verification
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= i ? 'bg-brand-gold text-brand-dark' : 'bg-brand-surface-light text-brand-text-dim'
            }`}>
              {step > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${step >= i ? 'text-brand-text' : 'text-brand-text-dim'}`}>{s}</span>
            {i < 3 && <div className={`flex-1 h-px ${step > i ? 'bg-brand-gold' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-2">Sport *</label>
              <select value={form.sport} onChange={handleChange('sport')} className="input-field">
                <option value="">Select your sport</option>
                {['Athletics','Wrestling','Boxing','Weightlifting','Kabaddi','Hockey','Cricket','Football','Badminton','Swimming','Other'].map(s =>
                  <option key={s} value={s}>{s}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-2">
                <Clock className="w-3.5 h-3.5 inline mr-1" /> Years of Experience *
              </label>
              <input type="number" min="1" max="50" value={form.experience_yrs} onChange={handleChange('experience_yrs')}
                placeholder="e.g. 5" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-2">
                <Building2 className="w-3.5 h-3.5 inline mr-1" /> Organisation *
              </label>
              <input type="text" value={form.organisation} onChange={handleChange('organisation')}
                placeholder="e.g. SAI Centre, NIS Patiala" className="input-field" />
            </div>
            <button onClick={() => setStep(1)} className="gold-button w-full flex items-center justify-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 1: Credentials */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-2">
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Coaching Certificate
              </label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-brand-gold/30 transition-colors"
                onClick={() => document.getElementById('cert-input')?.click()}>
                <Upload className="w-8 h-8 text-brand-text-dim mx-auto mb-2" />
                <p className="text-sm text-brand-text-muted">{form.cert_file?.name || 'Upload certificate (PDF, JPG, PNG)'}</p>
                <input id="cert-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile('cert_file')} className="hidden" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-2">
                <User className="w-3.5 h-3.5 inline mr-1" /> Government ID Proof
              </label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-brand-gold/30 transition-colors"
                onClick={() => document.getElementById('id-input')?.click()}>
                <Upload className="w-8 h-8 text-brand-text-dim mx-auto mb-2" />
                <p className="text-sm text-brand-text-muted">{form.id_file?.name || 'Upload ID proof (Aadhar, PAN, etc.)'}</p>
                <input id="id-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile('id_file')} className="hidden" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(0)} className="gold-button-outline flex-1">Back</button>
              <button onClick={() => setStep(2)} className="gold-button flex-1 flex items-center justify-center gap-2">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Statement */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-2">
                <Award className="w-3.5 h-3.5 inline mr-1" /> Personal Statement *
              </label>
              <textarea
                value={form.statement}
                onChange={handleChange('statement')}
                rows={6}
                placeholder="Tell us about your coaching experience, philosophy, achievements, and why you want to coach on SportTalentHunt..."
                className="input-field resize-none"
              />
              <p className="text-xs text-brand-text-dim mt-2">Min 50 characters. Be genuine — AI can detect copy-paste.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="gold-button-outline flex-1">Back</button>
              <button onClick={() => setStep(3)} className="gold-button flex-1 flex items-center justify-center gap-2">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <h3 className="text-lg font-display font-bold text-brand-text">Review Your Application</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-brand-text-muted">Sport</span>
                <span className="text-brand-text">{form.sport || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-brand-text-muted">Experience</span>
                <span className="text-brand-text">{form.experience_yrs || '—'} years</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-brand-text-muted">Organisation</span>
                <span className="text-brand-text">{form.organisation || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-brand-text-muted">Certificate</span>
                <span className="text-brand-text">{form.cert_file?.name || 'Not uploaded'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-brand-text-muted">ID Proof</span>
                <span className="text-brand-text">{form.id_file?.name || 'Not uploaded'}</span>
              </div>
              <div className="py-2">
                <span className="text-brand-text-muted block mb-1">Statement</span>
                <p className="text-brand-text text-sm bg-brand-dark/50 rounded-lg p-3">
                  {form.statement || '—'}
                </p>
              </div>
            </div>
            <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-4 text-sm text-brand-gold">
              ⚡ Your application will be reviewed by our AI system, which checks credentials against known Indian sports bodies (SAI, NIS, BCCI, AIFF, etc.)
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="gold-button-outline flex-1">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="gold-button flex-1 flex items-center justify-center gap-2">
                {loading ? 'Submitting...' : 'Submit Application'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
