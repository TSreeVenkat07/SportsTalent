import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Target, Activity, CheckCircle, AlertTriangle, Lightbulb, Clock, Video } from 'lucide-react'
import useAuthStore from '../store/authStore'

import api from '../lib/api'

export default function SubmissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)

    // Professional approach: Use centralized API instance
    api.get(`/video/submission/${id}`)
      .then(response => {
        setSubmission(response.data)
      })
      .catch(err => {
        console.error('Failed to fetch submission:', err)
        setError(err.response?.data?.error || 'Submission not found or unauthorized')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id, token])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] max-w-md mx-auto text-center">
        <Video className="w-16 h-16 text-brand-text-dim mb-4 opacity-50" />
        <h2 className="text-xl font-display font-bold text-brand-text mb-2">Video Not Found</h2>
        <p className="text-brand-text-dim mb-6">The analysis you are looking for could not be found or you don't have permission to view it.</p>
        <button onClick={() => navigate(-1)} className="gold-button-outline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-xl bg-brand-surface border border-white/5 flex items-center justify-center text-brand-text-dim hover:text-brand-gold hover:border-brand-gold/30 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-text capitalize">
            {submission.exercise} Analysis
          </h1>
          <p className="text-sm text-brand-text-dim flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" /> 
            Submitted on {new Date(submission.date).toLocaleDateString()} at {new Date(submission.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Video & Verdict */}
        <div className="space-y-6">
          <div className="glass-card overflow-hidden">
            <video 
              src={submission.video_url} 
              controls
              className="w-full aspect-video object-cover"
              autoPlay
              muted
              loop
            />
          </div>

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
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - submission.score / 100) }}
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
                  {submission.score}
                </motion.span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown & Feedback */}
        <div className="space-y-6">
          {/* Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-gold" />
              Metric Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(submission.breakdown || {}).map(([key, val], i) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-brand-text-dim capitalize">{key}</span>
                    <span className="font-mono text-brand-gold">{val}/100</span>
                  </div>
                  <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
                      className={`h-full rounded-full ${
                        val >= 80 ? 'bg-brand-accent' :
                        val >= 60 ? 'bg-brand-gold' : 'bg-brand-danger'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Notes */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-accent" />
              Detailed Feedback
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {Array.isArray(submission.feedback) ? (
                submission.feedback.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.8 }}
                    className="flex gap-3 text-sm p-3 rounded-lg bg-black/20 border border-white/5"
                  >
                    {item.type === 'good' && <CheckCircle className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />}
                    {item.type === 'warning' && <AlertTriangle className="w-4 h-4 text-brand-danger shrink-0 mt-0.5" />}
                    {item.type === 'tip' && <Lightbulb className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />}
                    <span className="text-brand-text-muted">{item.text}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-brand-text-muted text-sm">{submission.feedback}</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
