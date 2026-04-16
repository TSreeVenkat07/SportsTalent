import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Video, CheckCircle, AlertCircle, Loader2,
  Activity, Target, ChevronDown, Zap
} from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const getExercisesForSport = (sport) => {
  const s = (sport || '').toLowerCase()
  if (s === 'cricket') {
    return [
      { value: 'batting', label: 'Batting Drive', emoji: '🏏' },
      { value: 'bowling', label: 'Pace Bowling', emoji: '🎯' },
      { value: 'catching', label: 'Slip Catching', emoji: '🧤' },
      { value: 'fielding', label: 'Ground Fielding', emoji: '🏃' },
    ]
  }
  if (s === 'badminton' || s === 'tennis') {
    return [
      { value: 'serve', label: 'Serve', emoji: '🏸' },
      { value: 'smash', label: 'Smash', emoji: '⚡' },
      { value: 'forehand', label: 'Forehand', emoji: '🖐️' },
      { value: 'backhand', label: 'Backhand', emoji: '🔙' },
    ]
  }
  if (s === 'shooting' || s === 'archery') {
    return [
      { value: 'precision_aim', label: 'Precision Aim', emoji: '🎯' },
      { value: 'stance_holding', label: 'Stance Stability', emoji: '🧍' },
      { value: 'trigger_pull', label: 'Trigger Control', emoji: '🔫' },
      { value: 'reload_speed', label: 'Reload Technique', emoji: '🔄' },
    ]
  }
  if (s === 'boxing' || s === 'mma') {
    return [
      { value: 'jab_cross', label: 'Jab & Cross', emoji: '🥊' },
      { value: 'hook_uppercut', label: 'Hook & Uppercut', emoji: '🔥' },
      { value: 'footwork', label: 'Footwork Drills', emoji: '👟' },
      { value: 'defense', label: 'Defensive Guard', emoji: '🛡️' },
    ]
  }
  if (s === 'football' || s === 'soccer') {
    return [
      { value: 'penalty', label: 'Penalty Shot', emoji: '⚽' },
      { value: 'dribbling', label: 'Cone Dribbling', emoji: '🔀' },
      { value: 'passing', label: 'Long Passing', emoji: '📐' },
      { value: 'goalkeeping', label: 'Diving Save', emoji: '🧤' },
    ]
  }
  if (s === 'basketball') {
    return [
      { value: 'free_throw', label: 'Free Throw', emoji: '🏀' },
      { value: 'jump_shot', label: 'Jump Shot', emoji: '☄️' },
      { value: 'layup', label: 'Layup Drill', emoji: '🆙' },
      { value: 'dribbling', label: 'Crossover⚡', emoji: '⚡' },
    ]
  }
  if (s === 'wrestling' || s === 'judo') {
    return [
      { value: 'takedown', label: 'Takedown', emoji: '🤼' },
      { value: 'sprawl', label: 'Sprawl Defense', emoji: '⬇️' },
      { value: 'bridge', label: 'Neck Bridge', emoji: '🏗️' },
      { value: 'pinning', label: 'Pinning Control', emoji: '📍' },
    ]
  }
  // Default to general fitness tests
  return [
    { value: 'squat', label: 'Squat', emoji: '🏋️' },
    { value: 'pushup', label: 'Push-up', emoji: '💪' },
    { value: 'lunge', label: 'Lunge', emoji: '🦵' },
    { value: 'jump', label: 'Jump', emoji: '🦘' },
  ]
}
export default function VideoUpload() {
  const user = useAuthStore((s) => s.user)
  const exercises = getExercisesForSport(user?.sport)
  const navigate = useNavigate()

  // Extra safety: redirect if not an athlete
  useEffect(() => {
    if (user && user.role !== 'athlete') {
      console.warn('Strict Role Enforcement: Redirecting non-athlete from upload page')
      navigate('/')
    }
  }, [user, navigate])
  
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [exercise, setExercise] = useState('')
  const [uploading, setUploading] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('')
  const [step, setStep] = useState(1) // 1=upload, 2=analysing, 3=results
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f && f.type.startsWith('video/')) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleUpload = async () => {
    if (!file || !exercise) return
    setStep(2)
    setUploading(true)

    try {
      // Step 1: Upload the actual video file to get a unique hash-based URL
      const formData = new FormData()
      formData.append('video', file)
      formData.append('exercise', exercise)

      const uploadRes = await api.post('/video/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const videoUrl = uploadRes.data.video_url
      setUploadedVideoUrl(videoUrl)
      setUploading(false)
      setAnalysing(true)

      // Step 2: Analyse using the REAL video URL (contains unique file hash)
      const response = await api.post('/video/analyse', {
        video_url: videoUrl,
        exercise: exercise
      })

      setAnalysing(false)
      setResult(response.data)
      setStep(3)
    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysing(false)
      setStep(1)
      toast.error(error.response?.data?.error || 'Analysis failed. Is the backend running?')
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setExercise('')
    setResult(null)
    setUploadedVideoUrl('')
    setStep(1)
  }

  const handleSaveToProfile = async () => {
    if (!result || !uploadedVideoUrl) return
    setSaving(true)
    try {
      await api.post('/video/save', {
        video_url: uploadedVideoUrl,
        exercise: exercise,
        overall: result.overall,
        breakdown: result.breakdown,
        feedback: result.feedback
      })
      navigate('/athlete/dashboard')
    } catch (error) {
      console.error('Failed to save video:', error)
      toast.error(error.response?.data?.error || 'Failed to save video to your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-brand-text flex items-center gap-2">
          <Upload className="w-6 h-6 text-brand-gold" />
          Upload & Analyse
        </h1>
        <p className="text-brand-text-muted text-sm mt-1">
          Upload your exercise video for instant AI-powered form analysis
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { n: 1, label: 'Upload' },
          { n: 2, label: 'Analysing' },
          { n: 3, label: 'Results' },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s.n
                ? 'bg-brand-gold text-brand-dark'
                : 'bg-brand-surface-light text-brand-text-dim'
            }`}>
              {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-sm hidden sm:block ${step >= s.n ? 'text-brand-text' : 'text-brand-text-dim'}`}>
              {s.label}
            </span>
            {s.n < 3 && <div className={`flex-1 h-px ${step > s.n ? 'bg-brand-gold' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ===== STEP 1: Upload ===== */}
        {step === 1 && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Exercise selector */}
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-3">
                Select Exercise {user?.sport ? `for ${user.sport}` : ''}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {exercises.map((ex) => (
                  <button
                    key={ex.value}
                    onClick={() => setExercise(ex.value)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      exercise === ex.value
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                        : 'border-white/5 bg-brand-surface hover:border-white/10 text-brand-text-muted'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{ex.emoji}</span>
                    <span className="text-sm font-medium">{ex.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`glass-card border-2 border-dashed cursor-pointer transition-all p-12 text-center ${
                file
                  ? 'border-brand-accent/30 bg-brand-accent/5'
                  : 'border-white/10 hover:border-brand-gold/30 hover:bg-brand-gold/5'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload-input"
              />
              {file ? (
                <div>
                  <CheckCircle className="w-12 h-12 text-brand-accent mx-auto mb-3" />
                  <p className="text-brand-text font-medium">{file.name}</p>
                  <p className="text-sm text-brand-text-dim mt-1">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  {preview && (
                    <video
                      src={preview}
                      controls
                      className="mt-4 mx-auto rounded-lg max-h-60"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <Video className="w-12 h-12 text-brand-text-dim mx-auto mb-3" />
                  <p className="text-brand-text font-medium">Drop your video here</p>
                  <p className="text-sm text-brand-text-dim mt-1">
                    or click to browse · MP4, MOV, AVI · Max 100MB
                  </p>
                </div>
              )}
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || !exercise || uploading || analysing}
              className="gold-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              id="upload-analyse-btn"
            >
              {uploading || analysing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {!file ? 'Select a video' : !exercise ? 'Select an exercise above' : 'Upload & Analyse'}
            </button>
          </motion.div>
        )}

        {/* ===== STEP 2: Analysing ===== */}
        {step === 2 && (
          <motion.div
            key="analysing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-brand-gold/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-3 bg-brand-gold/10 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-brand-gold" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-brand-text mb-2">
              {uploading ? 'Uploading video...' : 'AI is analysing your form...'}
            </h3>
            <p className="text-brand-text-muted text-sm">
              {uploading
                ? 'Securely uploading to our servers'
                : 'MediaPipe is tracking 33 body landmarks across every frame'}
            </p>
          </motion.div>
        )}

        {/* ===== STEP 3: Results ===== */}
        {step === 3 && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <div className="glass-card p-8 text-center">
              <p className="text-brand-text-muted text-sm mb-3">Overall Form Score</p>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1d2e" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#goldGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.overall / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F5C842" />
                      <stop offset="100%" stopColor="#4AFFA0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-display font-black text-brand-gold"
                  >
                    {result.overall}
                  </motion.span>
                </div>
              </div>
              <p className={`font-medium text-sm mt-2 ${
                result.overall >= 75 ? 'text-brand-accent' : result.overall >= 50 ? 'text-brand-gold' : 'text-brand-danger'
              }`}>
                {result.verdict || (result.overall >= 75 ? 'Strong form.' : result.overall >= 50 ? 'Developing form — review feedback.' : 'Needs focused work.')}
              </p>
            </div>

            {/* Breakdown + Feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Breakdown */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-brand-text mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-gold" />
                  Score Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(result.breakdown).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-brand-text-muted capitalize">{key}</span>
                        <span className="font-mono text-brand-text">{val}</span>
                      </div>
                      <div className="h-2 rounded-full bg-brand-dark overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            val >= 80 ? 'bg-brand-accent' : val >= 60 ? 'bg-brand-gold' : 'bg-brand-danger'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-brand-text mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-gold" />
                  AI Feedback
                </h3>
                <div className="space-y-3">
                  {result.feedback.map((fb, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
                        fb.type === 'good' ? 'bg-brand-accent/5 text-brand-accent' :
                        fb.type === 'warning' ? 'bg-brand-gold/5 text-brand-gold' :
                        'bg-blue-400/5 text-blue-400'
                      }`}
                    >
                      {fb.type === 'good' ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                       fb.type === 'warning' ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                       <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                      {fb.text}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={reset} 
                disabled={saving}
                className="gold-button-outline flex-1 disabled:opacity-50"
              >
                Upload Another
              </button>
              <button 
                onClick={handleSaveToProfile}
                disabled={saving}
                className="gold-button flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Add to Profile & Feed'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
