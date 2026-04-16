import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, Upload, LayoutDashboard, Shield, Users, LogOut, Award, Compass } from 'lucide-react'
import STLogo from './STLogo'
import useAuthStore from '../store/authStore'

const navLinks = {
  athlete: [
    { to: '/athlete/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/athlete/upload', label: 'Upload', icon: Upload },
  ],
  coach: [
    { to: '/coach/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/coach/explore', label: 'Explore', icon: Compass },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/applications', label: 'Applications', icon: Award },
  ],
  founder: [
    { to: '/god-mode', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/god-mode?tab=applications', label: 'Applications', icon: Award },
    { to: '/god-mode?tab=team', label: 'Team', icon: Shield },
  ],
  reviewer: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/applications', label: 'Applications', icon: Award },
  ],
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, logout, godModeToken } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isGodModeActive = !!godModeToken

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  let links = []
  if (isGodModeActive) {
    links = navLinks.founder
  } else if (user?.role) {
    links = navLinks[user.role] || []
  }

  const getProfileLink = () => {
    if (isGodModeActive) return '/god-mode'
    if (user?.role === 'admin' || user?.role === 'reviewer') return '/admin/dashboard'
    return `/${user?.role === 'coach' ? 'coach' : 'athlete'}/${user?.id || 'me'}`
  }

  const showNavItems = !!(isAuthenticated && user)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <STLogo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!showNavItems ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/login" className="gold-button text-sm !px-4 !py-2">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {links.map((link) => {
                  const Icon = link.icon
                  const isActive = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-gold/10 text-brand-gold'
                          : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  )
                })}
                <div className="w-px h-6 bg-white/10 mx-2" />
                <Link
                  to={getProfileLink()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-text-muted hover:text-brand-text hover:bg-white/5 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-gold/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-brand-gold" />
                  </div>
                  <span className="max-w-[100px] truncate">{isGodModeActive ? 'Founder' : user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-brand-text-dim hover:text-brand-danger transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-brand-text-muted hover:text-brand-text"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-brand-surface border-b border-white/5"
          >
            <div className="px-4 py-4 space-y-1">
              {!showNavItems ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-brand-text-muted hover:text-brand-text rounded-lg hover:bg-white/5 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block gold-button text-center mt-2"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  {links.map((link) => {
                    const Icon = link.icon
                    const isActive = location.pathname === link.to
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-brand-gold/10 text-brand-gold'
                            : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    )
                  })}
                  <hr className="border-white/5 my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-brand-danger hover:bg-brand-danger/10 transition-all w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
