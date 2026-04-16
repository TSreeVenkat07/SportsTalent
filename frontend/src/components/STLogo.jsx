import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import GodModeModal from './GodModeModal'

const GOD_MODE_CLICKS = 17
const CLICK_WINDOW_MS = 10000

export default function STLogo({ size = 'default' }) {
  const [clickCount, setClickCount] = useState(0)
  const [showGodModal, setShowGodModal] = useState(false)
  const [flash, setFlash] = useState(false)
  const timerRef = useRef(null)

  const sizeClasses = {
    small: 'text-xl',
    default: 'text-2xl',
    large: 'text-4xl',
  }

  const handleLogoClick = useCallback((e) => {
    e.preventDefault()
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setClickCount(0)
    }, CLICK_WINDOW_MS)

    setClickCount((prev) => {
      const next = prev + 1
      if (next === GOD_MODE_CLICKS) {
        clearTimeout(timerRef.current)
        setFlash(true)
        setTimeout(() => setFlash(false), 600)
        setTimeout(() => setShowGodModal(true), 400)
        return 0
      }
      return next
    })
  }, [])

  return (
    <>
      {/* Gold flash overlay */}
      {flash && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #F5C842 0%, #FFD970 50%, #D4A828 100%)',
            animation: 'flash 0.6s ease forwards',
          }}
        />
      )}

      {/* Logo */}
      <div
        onClick={handleLogoClick}
        className="cursor-pointer select-none flex items-center gap-2 group"
        style={{ userSelect: 'none' }}
      >
        {/* ST Mark */}
        <div className={`${sizeClasses[size]} font-display font-black relative`}>
          <span className="text-brand-gold group-hover:text-brand-gold-light transition-colors duration-300">
            S
          </span>
          <span className="text-brand-text group-hover:text-white transition-colors duration-300">
            T
          </span>
          {/* Kinetic slash */}
          <div
            className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 -rotate-12 
                        bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent
                        group-hover:via-brand-gold transition-all duration-300"
          />
        </div>

        {/* Full name (hidden on mobile) */}
        {size !== 'small' && (
          <span className="hidden sm:block text-sm font-medium text-brand-text-muted group-hover:text-brand-text transition-colors">
            SportTalentHunt
          </span>
        )}
      </div>

      {/* God Mode Modal */}
      {showGodModal && (
        <GodModeModal onClose={() => setShowGodModal(false)} />
      )}
    </>
  )
}
