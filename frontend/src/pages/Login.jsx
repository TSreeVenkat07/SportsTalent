import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, User, Activity, Shield, MapPin, Dumbbell, Building2, Clock, CheckCircle, FileUp } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedRole = searchParams.get('role') || 'athlete' // 'athlete' or 'coach'
  const modeParam = searchParams.get('mode') // 'signin' or 'signup'
  const [mode, setMode] = useState(modeParam === 'signup' ? 'signup' : 'signin')

  const toggleRole = (role) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('role', role)
    setSearchParams(newParams)
    setError('')
  }

  useEffect(() => {
    if (modeParam === 'signup' || modeParam === 'signin') {
      setMode(modeParam)
    }
  }, [modeParam])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuthStore()

  // Senior Polish: Effect-Driven Instant Redirect
  // This is the smoothest way to transition — as soon as the store updates,
  // the component reacts and navigates away.
  useEffect(() => {
    if (isAuthenticated && user) {
      const serverRole = user.role
      if (serverRole === 'admin' || serverRole === 'founder' || serverRole === 'reviewer') {
        navigate('/admin/dashboard', { replace: true })
      } else if (serverRole === 'coach') {
        // 🪄 Master Logic Sync: Use definitive onboarding status from backend
        const status = user.onboarding_status
        
        if (status === 'approved') {
          navigate('/coach/dashboard', { replace: true })
        } else if (status === 'pending') {
          // If pending, they stay on a "Verification Pending" splash or dashboard restricted view
          // For now, we'll send to dashboard which will handle the "Pending" overlay
          navigate('/coach/dashboard', { replace: true })
        } else {
          // 'new' Status: Redirect to application flow
          navigate('/coach/apply', { replace: true })
        }
      } else {
        navigate('/athlete/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  // Signup-only fields
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Coach Multi-Step Wizard State
  const [signupStep, setSignupStep] = useState(1) // 1: Basic, 2: Profession, 3: Credentials
  const [experienceYears, setExperienceYears] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [bio, setBio] = useState('')
  const [certFile, setCertFile] = useState(null)
  const [idFile, setIdFile] = useState(null)

  const isAthlete = selectedRole === 'athlete'
  const accentColor = isAthlete ? 'brand-gold' : 'brand-accent'

  // Senior Render Guard: If authorized, don't show the form to avoid "fighting" UI
  if (isAuthenticated && !loading) return null

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const response = await api.post('/auth/login', { 
        email, 
        password
      });
      
      const data = response.data
      // Store update triggers the useEffect redirect instantly
      login(data.user, data.token)
    } catch (err) {
      console.error('Login error:', err)
      const errorMsg = err.response?.data?.error || 'Invalid credentials'
      setError(errorMsg)
    } finally { setLoading(false) }
  }

  const handleSignUp = async (e) => {
    if (e) e.preventDefault()
    
    // Step 1 Validation (Basics)
    if (signupStep === 1) {
      if (!name || !email || !password || !confirmPassword) {
        setError('Please fill in all basic account details'); return
      }
      if (password.length < 8) { setError('Password must be at least 8 characters'); return }
      if (password !== confirmPassword) { setError('Passwords do not match'); return }
      
      if (!isAthlete) {
        setSignupStep(2)
        setError('')
        return
      }
    }

    // Step 2 Validation (Coach Only: Profession)
    if (!isAthlete && signupStep === 2) {
      if (!sport || !experienceYears || !organisation) {
        setError('Please provide your professional details'); return
      }
      setSignupStep(3)
      setError('')
      return
    }

    // Step 3 Validation (Coach Only: Credentials)
    if (!isAthlete && signupStep === 3) {
      if (!bio) {
        setError('Please provide your professional summary'); return
      }
    }

    // Final Submission
    setLoading(true); setError('')
    try {
      if (isAthlete) {
        // Standard Athlete Registration (Unified)
        const body = { role: 'athlete', name, email, password, sport, state, district }
        const response = await api.post('/auth/register', body)
        login(response.data.user, response.data.token)
      } else {
        // Advanced Coach Multi-Step Registration
        // 1. Create Basic Account
        const regRes = await api.post('/auth/register', { 
          role: 'coach', name, email, password, sport, state: '', district: '' 
        })
        
        // 2. Upload Credentials & Documents
        const formData = new FormData()
        formData.append('sport', sport)
        formData.append('experience_yrs', experienceYears)
        formData.append('organisation', organisation)
        formData.append('statement', bio)
        if (certFile) formData.append('certificate', certFile)
        if (idFile) formData.append('idProof', idFile)

        // 🪄 Unified Networking: Using our hardened Axios with the new token
        await api.post('/coach/apply', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${regRes.data.token}`
          }
        })

        // Finalize state update
        const updatedUser = {
          ...regRes.data.user,
          onboarding_status: 'pending',
          is_verified: false
        }
        login(updatedUser, regRes.data.token)
      }
    } catch (err) {
      console.error('Registration error:', err)
      const errorMsg = err.response?.data?.error || 
                      (err.code === 'ERR_NETWORK' ? 'Network error: Cannot reach the backend server. Please check your connection.' : 'Registration failed')
      setError(errorMsg)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      {/* Background */}
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 right-1/4 w-[400px] h-[400px] ${isAthlete ? 'bg-brand-gold/5' : 'bg-brand-accent/5'} rounded-full blur-[120px]`} />
        <div className={`absolute bottom-1/4 left-1/4 w-[300px] h-[300px] ${isAthlete ? 'bg-brand-accent/5' : 'bg-brand-gold/5'} rounded-full blur-[100px]`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Back to role selection */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-text-dim hover:text-brand-text-muted transition-colors text-sm mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Change role
        </Link>

        {/* Role Selector Toggle */}
        <div className="flex bg-brand-surface/40 rounded-2xl p-1.5 mb-6 border border-white/5 relative z-10">
          <button
            onClick={() => toggleRole('athlete')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isAthlete 
                ? 'bg-brand-gold text-black shadow-[0_0_20px_rgba(245,200,66,0.3)]' 
                : 'text-brand-text-dim hover:text-brand-text'
            }`}
          >
            <Activity className="w-4 h-4" /> Athlete Portal
          </button>
          <button
            onClick={() => toggleRole('coach')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              !isAthlete 
                ? 'bg-brand-accent text-brand-dark shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'text-brand-text-dim hover:text-brand-text'
            }`}
          >
            <Shield className="w-4 h-4" /> Coach Portal
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold text-brand-text mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-brand-text-muted text-sm">
            {mode === 'signin'
              ? `Sign in to your ${isAthlete ? 'athlete' : 'coach'} profile`
              : `Join our elite community as ${isAthlete ? 'an athlete' : 'a coach'}`
            }
          </p>
        </div>

        {/* Sign In / Sign Up Toggle */}
        <div className="flex bg-brand-surface/60 rounded-xl p-1 mb-6 border border-white/5">
          <button
            onClick={() => { setMode('signin'); setError('') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'signin'
                ? `bg-${accentColor}/10 text-${accentColor} border border-${accentColor}/20`
                : 'text-brand-text-dim hover:text-brand-text-muted'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'signup'
                ? `bg-${accentColor}/10 text-${accentColor} border border-${accentColor}/20`
                : 'text-brand-text-dim hover:text-brand-text-muted'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'signin' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'signin' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
            className="glass-card p-8 space-y-4"
          >
            {/* Coach Step Indicator */}
            {!isAthlete && mode === 'signup' && (
              <div className="flex items-center justify-between mb-8 px-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      signupStep === s ? 'bg-brand-accent text-brand-dark shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                      signupStep > s ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-surface text-brand-text-dim'
                    }`}>
                      {signupStep > s ? <CheckCircle className="w-4 h-4" /> : s}
                    </div>
                    {s < 3 && <div className={`w-8 h-0.5 rounded-full ${signupStep > s ? 'bg-brand-accent/30' : 'bg-brand-surface'}`} />}
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1: Account Basics */}
            {mode === 'signup' && signupStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="input-field !pl-10" id="auth-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder={isAthlete ? 'athlete@email.com' : 'coach@email.com'}
                      className="input-field !pl-10" id="auth-email"
                    />
                  </div>
                </div>

                {isAthlete && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-brand-text-muted mb-2">Sport</label>
                      <div className="relative">
                        <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                        <input
                          type="text" value={sport} onChange={(e) => setSport(e.target.value)}
                          placeholder="e.g. Athletics"
                          className="input-field !pl-10 text-sm" id="auth-sport-athlete"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-text-muted mb-2">State</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                        <input
                          type="text" value={state} onChange={(e) => setState(e.target.value)}
                          placeholder="e.g. Maharashtra"
                          className="input-field !pl-10 text-sm" id="auth-state"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                      <input
                        type={showPassword ? 'text' : 'password'} value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field !pl-10 !pr-10 text-sm" id="auth-password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-2">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                      <input
                        type="password" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field !pl-10 text-sm" id="auth-confirm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Professional Details (Coach Only) */}
            {!isAthlete && mode === 'signup' && signupStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Sport Specialisation</label>
                  <div className="relative">
                    <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type="text" value={sport} onChange={(e) => setSport(e.target.value)}
                      placeholder="e.g. Sprinting, Wrestling, etc."
                      className="input-field !pl-10" id="auth-sport-coach"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Years of Experience</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="e.g. 5"
                      className="input-field !pl-10" id="auth-experience"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Current Organisation</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)}
                      placeholder="e.g. Sports Authority of India"
                      className="input-field !pl-10" id="auth-org"
                    />
                  </div>
                </div>

                <button
                  type="button" onClick={() => setSignupStep(1)}
                  className="text-xs text-brand-text-dim hover:text-brand-text flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to account basics
                </button>
              </motion.div>
            )}

            {/* STEP 3: Credentials (Coach Only) */}
            {!isAthlete && mode === 'signup' && signupStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Detailed Profession Summary</label>
                  <textarea
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your coaching philosophy and achievements..."
                    className="input-field min-h-[100px] py-3 text-sm" id="auth-bio"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-brand-text-dim">Professional Certificate (Optional)</label>
                    <label className="relative flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-brand-accent/50 transition-colors cursor-pointer group">
                      <FileUp className="w-5 h-5 text-brand-text-dim group-hover:text-brand-accent" />
                      <span className="text-xs text-brand-text-muted">{certFile ? certFile.name : 'Click to upload Certificate'}</span>
                      <input type="file" className="hidden" onChange={(e) => setCertFile(e.target.files[0])} accept=".pdf,image/*" />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-brand-text-dim">Government Identity Proof (Optional)</label>
                    <label className="relative flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-brand-accent/50 transition-colors cursor-pointer group">
                      <Shield className="w-5 h-5 text-brand-text-dim group-hover:text-brand-accent" />
                      <span className="text-xs text-brand-text-muted">{idFile ? idFile.name : 'Click to upload ID Proof'}</span>
                      <input type="file" className="hidden" onChange={(e) => setIdFile(e.target.files[0])} accept=".pdf,image/*" />
                    </label>
                  </div>
                </div>

                <button
                  type="button" onClick={() => setSignupStep(2)}
                  className="text-xs text-brand-text-dim hover:text-brand-text flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to professional info
                </button>
              </motion.div>
            )}

            {/* Email (Signin only) */}
            {mode === 'signin' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="coach@email.com"
                      className="input-field !pl-10" id="auth-email-signin"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-dim" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field !pl-10 !pr-10" id="auth-password-signin"
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-brand-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-brand-danger text-sm">
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 !py-3.5 rounded-xl font-semibold transition-all ${
                isAthlete
                  ? 'gold-button'
                  : 'bg-brand-accent hover:bg-brand-accent/90 text-brand-dark'
              }`}
              id="auth-submit"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : (
                    isAthlete ? 'Create Account' : (
                      signupStep < 3 ? 'Next Step' : 'Submit Application'
                    )
                  )} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
