import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'
import useAuthStore from '../store/authStore'

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export default function Layout() {
  const location = useLocation()
  // Force Navbar to re-render on any auth state change
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const godModeToken = useAuthStore((s) => s.godModeToken)
  const navKey = `nav-${isAuthenticated}-${user?.role || 'none'}-${user?.id || 'x'}-${!!godModeToken}`

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar key={navKey} />
      <main className="flex-1 pt-16">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...pageTransition}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
