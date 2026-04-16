import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Zap, Shield, Video, Users, Star, ArrowRight, 
  ChevronRight, Activity, Target, TrendingUp, Award, Globe
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
}

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* ====== HERO ====== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-32">
        {/* Background gradients */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/3 rounded-full blur-[150px]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(245,200,66,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-brand-gold text-sm font-medium">AI-Powered Talent Discovery</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black leading-[0.9] tracking-tight mb-6"
          >
            <span className="text-brand-text">Discover</span>
            <span className="gold-gradient-text">.</span>
            <br />
            <span className="text-brand-text">Verify</span>
            <span className="gold-gradient-text">.</span>
            <br />
            <span className="gold-gradient-text">Elevate</span>
            <span className="text-brand-text">.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl text-brand-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            India's first AI-powered sports talent platform. Upload your game,
            get instant form analysis, and connect with{' '}
            <span className="text-brand-accent font-medium">verified coaches</span>{' '}
            who can take you to the next level.
          </motion.p>

          {/* ── Role Selection Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-2xl mx-auto"
          >
            {/* Athlete Card */}
            <Link
              to="/login?role=athlete&mode=signup"
              className="group w-full sm:w-72 relative overflow-hidden rounded-2xl border border-brand-gold/20 bg-brand-surface/80 backdrop-blur-sm p-8 text-center transition-all duration-300 hover:border-brand-gold/50 hover:shadow-[0_0_40px_rgba(245,200,66,0.1)] hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-gold/20 group-hover:scale-110 transition-all duration-300">
                  <Activity className="w-8 h-8 text-brand-gold" />
                </div>
                <h3 className="text-xl font-display font-bold text-brand-text mb-2">I'm an Athlete</h3>
                <p className="text-brand-text-muted text-sm mb-4">Upload videos, get AI analysis, and improve your game</p>
                <div className="flex items-center justify-center gap-1 text-brand-gold text-sm font-medium group-hover:gap-2 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Coach Card */}
            <Link
              to="/login?role=coach&mode=signup"
              className="group w-full sm:w-72 relative overflow-hidden rounded-2xl border border-brand-accent/20 bg-brand-surface/80 backdrop-blur-sm p-8 text-center transition-all duration-300 hover:border-brand-accent/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-accent/20 group-hover:scale-110 transition-all duration-300">
                  <Shield className="w-8 h-8 text-brand-accent" />
                </div>
                <h3 className="text-xl font-display font-bold text-brand-text mb-2">I'm a Coach</h3>
                <p className="text-brand-text-muted text-sm mb-4">Get verified, connect with athletes, and guide talent</p>
                <div className="flex items-center justify-center gap-1 text-brand-accent text-sm font-medium group-hover:gap-2 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: '10K+', label: 'Athletes' },
              { value: '500+', label: 'Verified Coaches' },
              { value: '28', label: 'Sports' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-brand-gold">{stat.value}</div>
                <div className="text-xs text-brand-text-dim mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-brand-text-dim/30 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-brand-gold" />
          </div>
        </motion.div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="badge-gold mb-4 inline-flex">
              <Zap className="w-3 h-3" /> Platform Features
            </span>
            <h2 className="section-heading text-brand-text">
              Everything you need to <span className="gold-gradient-text">go pro</span>
            </h2>
            <p className="section-subheading mx-auto mt-4">
              AI-powered analysis, verified coaches, and a community built for athletes who mean business.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Video,
                title: 'AI Form Analysis',
                description: 'Upload exercise videos and get instant AI-powered form scoring using MediaPipe pose detection. 33-point body tracking for precise feedback.',
                color: 'text-brand-gold',
                bg: 'bg-brand-gold/10',
              },
              {
                icon: Shield,
                title: 'Verified Coaches',
                description: 'Every coach is AI-verified against legitimate Indian sports bodies. SAI, NIS Patiala, BCCI, AIFF — no fakes get through.',
                color: 'text-brand-accent',
                bg: 'bg-brand-accent/10',
              },
              {
                icon: Target,
                title: 'Smart Matching',
                description: 'Connect with coaches in your sport and region who can provide personalized guidance for your athletic journey.',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
              },
              {
                icon: Activity,
                title: 'Progress Tracking',
                description: 'Watch your form scores improve over time with detailed breakdowns. Depth, alignment, stability — every metric tracked.',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
              },
              {
                icon: TrendingUp,
                title: 'Leaderboards',
                description: 'Compete with athletes across India. Rise through state and national rankings based on your form scores.',
                color: 'text-orange-400',
                bg: 'bg-orange-400/10',
              },
              {
                icon: Globe,
                title: 'Pan-India Coverage',
                description: 'From rural villages to metro cities — talent is everywhere. We make sure the best athletes get discovered.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-400/10',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                {...stagger}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card-hover p-8 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 
                                 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-display font-bold text-brand-text mb-3">{feature.title}</h3>
                <p className="text-brand-text-muted text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-brand-surface/50" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="badge-gold mb-4 inline-flex">
              <Activity className="w-3 h-3" /> How It Works
            </span>
            <h2 className="section-heading text-brand-text">
              Three steps to <span className="gold-gradient-text">greatness</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Your Game',
                description: 'Record your exercise — squats, push-ups, lunges, jumps. Upload the video and our AI analyses every frame.',
                icon: Video,
              },
              {
                step: '02',
                title: 'Get AI Analysis',
                description: 'MediaPipe tracks 33 body landmarks. Get instant scores on depth, alignment, stability, and detailed improvement tips.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Connect with Coaches',
                description: 'AI-verified coaches review your performance, provide expert feedback, and guide your training journey.',
                icon: Users,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...stagger}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-brand-gold/30 to-transparent z-10" />
                )}

                <div className="glass-card p-8 text-center group hover:border-brand-gold/20 transition-all duration-300">
                  {/* Step number */}
                  <div className="text-5xl font-display font-black text-brand-gold/10 mb-4 group-hover:text-brand-gold/20 transition-colors">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center mx-auto mb-5 
                                  group-hover:bg-brand-gold/20 group-hover:scale-110 transition-all duration-300">
                    <item.icon className="w-7 h-7 text-brand-gold" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-brand-text mb-3">{item.title}</h3>
                  <p className="text-brand-text-muted text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SOCIAL PROOF ====== */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="badge-gold mb-4 inline-flex">
              <Star className="w-3 h-3" /> Success Stories
            </span>
            <h2 className="section-heading text-brand-text">
              Athletes who <span className="gold-gradient-text">made it</span>
            </h2>
            <p className="section-subheading mx-auto mt-4">
              From village grounds to national stages — these athletes used SportTalentHunt to level up.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                sport: 'Athletics — Sprint',
                location: 'Rajgarh, MP',
                quote: 'My coach found me through STH. I never thought someone from my village could compete at nationals.',
                score: 94,
              },
              {
                name: 'Arjun Meena',
                sport: 'Wrestling',
                location: 'Sangli, Maharashtra',
                quote: "The AI form analysis helped me fix my takedown technique. My score went from 58 to 91 in three months.",
                score: 91,
              },
              {
                name: 'Kavitha S',
                sport: 'Weightlifting',
                location: 'Erode, Tamil Nadu',
                quote: 'Verified coaches gave me real feedback, not fake promises. Now I train with a SAI-certified coach.',
                score: 88,
              },
            ].map((story, i) => (
              <motion.div
                key={story.name}
                {...stagger}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card-hover p-8"
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-gold font-display font-bold text-xl">
                    {story.name[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-text">{story.name}</h4>
                    <p className="text-brand-text-dim text-xs">{story.sport} · {story.location}</p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-brand-text-muted text-sm leading-relaxed mb-6 italic">
                  "{story.quote}"
                </p>

                {/* Score */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-brand-dark overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${story.score}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-gold to-brand-accent"
                    />
                  </div>
                  <span className="text-brand-gold font-mono font-bold text-sm">{story.score}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-gold/5 to-transparent" />
        <motion.div
          {...fadeUp}
          className="max-w-3xl mx-auto text-center relative"
        >
          <div className="glass-card p-12 md:p-16 border-brand-gold/10 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-brand-gold/10 rounded-full blur-[80px]" />
            
            <div className="relative">
              <Award className="w-12 h-12 text-brand-gold mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-text mb-4">
                Ready to show what<br />you're{' '}
                <span className="gold-gradient-text">made of</span>?
              </h2>
              <p className="text-brand-text-muted mb-8 max-w-md mx-auto">
                Join thousands of athletes across India who are using AI to improve their game and get noticed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login?mode=signup" className="gold-button text-lg !px-8 !py-4 flex items-center gap-2 group">
                  Create Free Account
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="text-brand-text-muted hover:text-brand-gold transition-colors flex items-center gap-1">
                  Already have an account? <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
