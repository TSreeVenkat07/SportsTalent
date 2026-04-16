import { Link } from 'react-router-dom'
import { Github, Twitter, Mail, Heart } from 'lucide-react'
import STLogo from './STLogo'

export default function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <STLogo size="small" />
            <p className="mt-4 text-brand-text-muted text-sm leading-relaxed">
              Discover. Verify. Elevate.
              <br />
              Uncovering athletic talent from every corner of India.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-brand-text-dim hover:text-brand-gold hover:bg-brand-gold/10 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-brand-text-dim hover:text-brand-gold hover:bg-brand-gold/10 transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-brand-text-dim hover:text-brand-gold hover:bg-brand-gold/10 transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Athletes */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text mb-4">Athletes</h4>
            <ul className="space-y-3">
              <li><Link to="/register" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Sign Up</Link></li>
              <li><Link to="/athlete/upload" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Upload Video</Link></li>
              <li><Link to="/athlete/dashboard" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Coaches */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text mb-4">Coaches</h4>
            <ul className="space-y-3">
              <li><Link to="/coach/apply" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Apply as Coach</Link></li>
              <li><Link to="/coach/dashboard" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Coach Dashboard</Link></li>
              <li><Link to="/login" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Coach Login</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-brand-text-muted hover:text-brand-gold transition-colors">Contact</a></li>
              <li className="pt-2 border-t border-white/5">
                <Link to="/admin/login" className="text-[10px] uppercase font-bold tracking-widest text-brand-text-dim hover:text-brand-gold transition-colors block mt-2">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brand-text-dim text-xs">
            © 2026 SportTalentHunt. All rights reserved.
          </p>
          <p className="text-brand-text-dim text-xs flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-brand-danger" /> for India's athletes
          </p>
        </div>
      </div>
    </footer>
  )
}
