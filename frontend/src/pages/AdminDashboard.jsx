import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, Users, Award, Shield, AlertTriangle,
  TrendingUp, Clock, CheckCircle, XCircle, Eye, BarChart3,
  Activity, ArrowUpRight, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ athletes: 0, coaches: 0, pending_apps: 0, videos: 0 })
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/applications')
      ])

      // Handle Stats
      if (results[0].status === 'fulfilled') {
        setStats(results[0].value.data)
      } else {
        console.error('Stats fetch failed:', results[0].reason)
      }

      // Handle Applications
      if (results[1].status === 'fulfilled') {
        setRecentApps(results[1].value.data.slice(0, 5))
      } else {
        console.error('Applications fetch failed:', results[1].reason)
      }
    } catch (err) {
      console.error('Dashboard data sync error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Athletes', value: stats.athletes, icon: Users, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { label: 'Active Coaches', value: stats.coaches, icon: Shield, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
    { label: 'Pending Apps', value: stats.pending_apps, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Videos Today', value: stats.videos, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-text flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-gold" />
            Admin Dashboard
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 text-brand-text-dim hover:text-brand-gold transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/admin/applications" className="gold-button flex items-center gap-2 text-sm px-4">
            <Award className="w-4 h-4" /> Review Queue
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-brand-text">{stat.value}</div>
            <div className="text-xs text-brand-text-dim mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-gold" /> Recent Applications
            </h2>
            <Link to="/admin/applications" className="text-xs text-brand-gold hover:text-brand-gold-light transition-colors">
              View all →
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="glass-card p-12 text-center text-brand-text-dim text-sm italic">
              No pending applications at the moment.
            </div>
          ) : (
            recentApps.map((app, i) => (
              <motion.div
                key={app.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold">
                      {app.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-text text-sm">{app.name}</h3>
                      <p className="text-xs text-brand-text-dim">{app.sport} · {app.experience}y Experience</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link 
                      to="/admin/applications"
                      className="p-2 rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Activity Feed Simulation */}
        <div>
          <h2 className="text-lg font-display font-semibold text-brand-text flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand-gold" /> Recent Activity
          </h2>
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 bg-brand-accent" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-text font-medium">System operational</p>
                <p className="text-xs text-brand-text-dim mt-0.5">Real-time sync active</p>
              </div>
            </div>
            <p className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold text-center pt-2">
              Last Updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
