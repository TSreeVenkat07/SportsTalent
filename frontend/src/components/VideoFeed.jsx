import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, Share2, UserPlus, CheckCircle, 
  MapPin, Trophy, Play, Pause, Activity, Video
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function VideoFeed({ discovery = false }) {
  const { user, token } = useAuthStore()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const [connections, setConnections] = useState({}) // { athlete_id: 'status' }
  const [connectingToast, setConnectingToast] = useState(null)

  const feedRef = useRef(null)
  const videoRefs = useRef([])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    
    // Professional approach: Use centralized API with discovery param
    api.get(`/video/feed?discovery=${discovery}`)
      .then(response => {
        const data = response.data
        if (Array.isArray(data)) {
          setFeed(data)
          // Pre-populate connection state from feed data
          const connMap = {}
          data.forEach(item => {
            connMap[item.athlete_id] = item.connection_status
          })
          setConnections(connMap)
        }
      })
      .catch(err => {
        console.error('Feed loading failed:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token, discovery])

  // Handle intersection observer for video auto-play
  useEffect(() => {
    if (loading || feed.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.index)
          const videoElement = videoRefs.current[index]

          if (entry.isIntersecting) {
            setActiveVideoIndex(index)
            if (videoElement) {
              videoElement.currentTime = 0
              videoElement.play().catch(() => {}) // Catch auto-play blockers
            }
          } else {
            if (videoElement) {
              videoElement.pause()
            }
          }
        })
      },
      { threshold: 0.6 } // Video plays when at least 60% visible
    )

    const feedContainer = feedRef.current
    if (feedContainer) {
      Array.from(feedContainer.children).forEach((child) => observer.observe(child))
    }

    return () => observer.disconnect()
  }, [loading, feed])

  const handleConnect = async (athleteId) => {
    try {
      // Professional approach: Use centralized API with unified request endpoint
      const response = await api.post('/connect/request', { athlete_id: athleteId });
      
      if (response.status === 200 || response.status === 201) {
        setConnections(prev => ({ ...prev, [athleteId]: 'accepted' }))
        setConnectingToast('Added to your connections!')
        setTimeout(() => setConnectingToast(null), 3000)
      }
    } catch (err) {
      console.error('Connection failed:', err)
    }
  }


  const togglePlay = (index) => {
    const videoElement = videoRefs.current[index]
    if (!videoElement) return
    
    if (videoElement.paused) {
      videoElement.play()
    } else {
      videoElement.pause()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-brand-text-muted">
        <Video className="w-16 h-16 opacity-20 mb-4" />
        <p>No videos available in the feed yet.</p>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] max-w-lg mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      
      {/* Scrollable Feed Container */}
      <div 
        ref={feedRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative"
      >
        {feed.map((item, index) => {
          const isConnected = connections[item.athlete_id] === 'accepted'
          const isActive = index === activeVideoIndex

          return (
            <div 
              key={item.id} 
              data-index={index}
              className="h-full w-full snap-start relative bg-zinc-900 group flex items-center justify-center overflow-hidden"
              onClick={() => togglePlay(index)}
            >
              {/* Video Player */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={item.video_url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted // Muted by default helps with auto-play policies, can add unmute button if needed
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-4 left-4 right-16 z-10 pointer-events-none text-white">
                <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                  <Link to={`/athlete/${item.athlete_id}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-brand-accent flex items-center justify-center font-display font-bold text-black border-2 border-white/50 shadow-lg hover:scale-110 transition-transform">
                    {item.athlete_avatar}
                  </Link>
                  <div>
                    <Link to={`/athlete/${item.athlete_id}`} className="font-display font-bold text-base drop-shadow-md hover:text-brand-gold transition-colors block">
                      {item.athlete_name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs opacity-90 font-medium mt-0.5">
                      <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <Trophy className="w-3 h-3 text-brand-gold" /> {item.sport}
                      </span>
                      {item.state && (
                        <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          <MapPin className="w-3 h-3" /> {item.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/10 w-fit cursor-pointer hover:bg-black/60 transition-colors inline-block">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-brand-accent" />
                      <span className="text-sm font-semibold capitalize break-all line-clamp-1 max-w-[120px]">{item.exercise}</span>
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Score</span>
                      <span className={`text-sm font-display font-black leading-none ${
                        item.score >= 80 ? 'text-brand-accent' : 
                        item.score >= 60 ? 'text-brand-gold' : 'text-brand-danger'
                      }`}>
                        {item.score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="absolute bottom-8 right-3 z-10 flex flex-col items-center gap-5">
                {/* Profile / Connect */}
                <div className="relative">
                  <Link 
                    to={`/athlete/${item.athlete_id}`}
                    className="w-12 h-12 rounded-full border-2 border-white/50 bg-brand-surface/80 flex items-center justify-center text-xl font-bold font-display shadow-lg overflow-hidden backdrop-blur-sm cursor-pointer hover:border-brand-gold hover:scale-105 transition-all"
                  >
                    {item.athlete_avatar}
                  </Link>
                  {item.connection_status !== 'self' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isConnected) handleConnect(item.athlete_id) }}
                      className={`absolute -bottom-2 inset-x-0 mx-auto w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                        isConnected ? 'bg-brand-accent text-white scale-110' : 'bg-brand-gold hover:scale-110 hover:bg-yellow-400'
                      }`}
                    >
                      {isConnected ? <CheckCircle className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Like */}
                <button 
                  onClick={(e) => e.stopPropagation()} 
                  className="flex flex-col items-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:text-pink-500 transition-colors mb-1">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium drop-shadow-md text-white">{item.likes}</span>
                </button>


                {/* Share */}
                <button 
                  onClick={(e) => e.stopPropagation()} 
                  className="flex flex-col items-center group"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors mb-1">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium drop-shadow-md text-white">Share</span>
                </button>
              </div>

            </div>
          )
        })}
      </div>


      {/* Toast Notification */}
      <AnimatePresence>
        {connectingToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-accent text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle className="w-4 h-4" />
            {connectingToast}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  )
}
