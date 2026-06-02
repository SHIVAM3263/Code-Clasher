import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Swords, Zap, Trophy, Code2, Shield, Target, ChevronRight, Star } from 'lucide-react'

const STATS = [
  { value: '10K+', label: 'Coders Clashing' },
  { value: '500+', label: 'Battle Problems' },
  { value: '1M+', label: 'Submissions Judged' },
  { value: '50K+', label: 'Battles Fought' },
]

const FEATURES = [
  {
    icon: Swords,
    color: 'var(--cyan)',
    title: '1v1 BATTLE ARENA',
    desc: 'Duel opponents in real-time. Both players race to solve the same problem. First correct solution wins.',
  },
  {
    icon: Shield,
    color: 'var(--red)',
    title: 'HEALTH BAR SYSTEM',
    desc: 'Wrong submissions deal damage to your HP. Strategize: submit carefully or race recklessly?',
  },
  {
    icon: Trophy,
    color: 'var(--gold)',
    title: 'RANKED MATCHMAKING',
    desc: 'Climb from Bronze to Grandmaster. Our Elo system finds perfectly matched opponents.',
  },
  {
    icon: Target,
    color: 'var(--purple)',
    title: 'ELITE PROBLEMS',
    desc: 'Curated challenges across Easy to Elite difficulty. From arrays to dynamic programming.',
  },
  {
    icon: Zap,
    color: 'var(--green)',
    title: 'INSTANT JUDGING',
    desc: 'Code runs in our sandboxed environment. Results in milliseconds.',
  },
  {
    icon: Star,
    color: 'var(--gold)',
    title: 'XP & ACHIEVEMENTS',
    desc: 'Level up, unlock achievements, and flex your rank badge across the arena.',
  },
]

const RANKS = [
  { rank: 'BRONZE', icon: '🥉', color: '#e8a87c', range: '0–499' },
  { rank: 'SILVER', icon: '🥈', color: '#c0c8d8', range: '500–1499' },
  { rank: 'GOLD', icon: '🥇', color: 'var(--gold)', range: '1500–2999' },
  { rank: 'PLATINUM', icon: '💠', color: '#74b9ff', range: '3000–5999' },
  { rank: 'DIAMOND', icon: '💎', color: 'var(--purple)', range: '6000–9999' },
  { rank: 'GRANDMASTER', icon: '👑', color: 'var(--red)', range: '20000+' },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [particles, setParticles] = useState([])

  // Particle background
  useEffect(() => {
    const count = 60
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? 'var(--cyan)' : 'var(--purple)',
      delay: Math.random() * 4,
    })))
  }, [])

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={heroStyles.section}>
        {/* Grid overlay */}
        <div style={heroStyles.grid} />

        {/* Floating particles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute',
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              borderRadius: '50%',
              background: p.color,
              opacity: p.opacity,
              animation: `float ${3 + p.speed * 4}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 4px ${p.color}`,
            }} />
          ))}
        </div>

        {/* Glow orbs */}
        <div style={heroStyles.orb1} />
        <div style={heroStyles.orb2} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 120 }}>
          {/* Badge */}
          <div style={heroStyles.badge}>
            <Zap size={12} />
            THE ULTIMATE CODING BATTLE ARENA
            <Zap size={12} />
          </div>

          {/* Title */}
          <div style={heroStyles.titleWrap}>
            <h1 style={heroStyles.titleLine1}>CODE</h1>
            <div style={heroStyles.titleCenterRow}>
              <div style={heroStyles.titleDivider} />
              <div style={heroStyles.swordsIcon}><Swords size={40} /></div>
              <div style={heroStyles.titleDivider} />
            </div>
            <h1 style={heroStyles.titleLine2}>CLASHER</h1>
          </div>

          <p style={heroStyles.subtitle}>
            Step into the arena. Solve faster. Hit harder. Rise to Grandmaster.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {user ? (
              <button className="btn btn-cyan btn-lg" onClick={() => navigate('/arena')}>
                <Swords size={18} /> ENTER ARENA
              </button>
            ) : (
              <>
                <Link to="/register">
                  <button className="btn btn-cyan btn-lg">
                    <Zap size={18} /> START CLASHING
                  </button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-ghost btn-lg">
                    Login <ChevronRight size={16} />
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Stats row */}
          <div style={heroStyles.statsRow}>
            {STATS.map((s, i) => (
              <div key={i} style={heroStyles.statItem}>
                <div style={heroStyles.statValue}>{s.value}</div>
                <div style={heroStyles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div className="container">
          <div style={sectionHeader}>
            <div style={sectionTag}>GAME MECHANICS</div>
            <h2 style={sectionTitle}>HOW THE ARENA WORKS</h2>
          </div>

          <div style={featuresGrid}>
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <div key={i} style={{ ...featureCard, animationDelay: `${i * 0.1}s` }}>
                <div style={{ ...featureIcon, background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ ...featureTitle, color }}>{title}</h3>
                <p style={featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RANK LADDER ──────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, background: 'var(--dark-2)' }}>
        <div className="container">
          <div style={sectionHeader}>
            <div style={sectionTag}>PROGRESSION</div>
            <h2 style={sectionTitle}>CLIMB THE RANK LADDER</h2>
          </div>

          <div style={rankRow}>
            {RANKS.map(({ rank, icon, color, range }, i) => (
              <div key={rank} style={{ ...rankCard, borderColor: `${color}30` }}>
                <div style={{ fontSize: 36, marginBottom: 8, filter: `drop-shadow(0 0 8px ${color})` }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color, letterSpacing: '0.12em' }}>{rank}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-code)' }}>{range} MMR</div>
                <div style={{ marginTop: 12, width: '100%', height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, textAlign: 'center', paddingBottom: 100 }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--cyan)', marginBottom: 16, textShadow: '0 0 30px var(--cyan)' }}>
            READY TO CLASH?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 40 }}>
            Join thousands of coders battling right now.
          </p>
          <Link to={user ? '/arena' : '/register'}>
            <button className="btn btn-cyan btn-lg">
              <Swords size={20} />
              {user ? 'FIND A BATTLE' : 'CREATE FREE ACCOUNT'}
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const heroStyles = {
  section: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex', alignItems: 'center',
    overflow: 'hidden',
    paddingTop: 64,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 245, 255, 0.05) 0%, transparent 70%)',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
  },
  orb1: {
    position: 'absolute', top: '10%', left: '5%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,245,255,0.08), transparent 70%)',
    filter: 'blur(40px)',
    animation: 'float 8s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute', top: '20%', right: '5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(180,79,255,0.08), transparent 70%)',
    filter: 'blur(60px)',
    animation: 'float 10s ease-in-out 2s infinite',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 20px',
    background: 'rgba(0,245,255,0.08)',
    border: '1px solid rgba(0,245,255,0.25)',
    fontFamily: 'var(--font-display)',
    fontSize: 11, letterSpacing: '0.2em',
    color: 'var(--cyan)',
    marginBottom: 32,
    clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
  },
  titleWrap: { marginBottom: 24 },
  titleLine1: {
    fontSize: 'clamp(72px, 12vw, 140px)',
    fontFamily: 'var(--font-display)',
    fontWeight: 900, letterSpacing: '0.2em',
    color: 'transparent',
    WebkitTextStroke: '2px var(--cyan)',
    textShadow: '0 0 60px rgba(0,245,255,0.3)',
    lineHeight: 0.9,
  },
  titleCenterRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 20, margin: '8px 0',
  },
  titleDivider: {
    flex: 1, maxWidth: 200, height: 1,
    background: 'linear-gradient(90deg, transparent, var(--cyan))',
  },
  swordsIcon: {
    color: 'var(--cyan)', filter: 'drop-shadow(0 0 15px var(--cyan))',
    animation: 'pulse-glow 2s infinite',
  },
  titleLine2: {
    fontSize: 'clamp(72px, 12vw, 140px)',
    fontFamily: 'var(--font-display)',
    fontWeight: 900, letterSpacing: '0.2em',
    color: 'var(--cyan)',
    textShadow: '0 0 60px rgba(0,245,255,0.5), 0 0 120px rgba(0,245,255,0.2)',
    lineHeight: 0.9,
  },
  subtitle: {
    fontSize: 20, color: 'var(--text-secondary)',
    maxWidth: 560, margin: '0 auto',
    letterSpacing: '0.03em',
  },
  statsRow: {
    display: 'flex', gap: 0, justifyContent: 'center',
    marginTop: 80, flexWrap: 'wrap',
  },
  statItem: {
    padding: '20px 40px',
    borderLeft: '1px solid var(--border-subtle)',
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 32, fontWeight: 900, color: 'var(--cyan)',
    textShadow: '0 0 20px var(--cyan)',
  },
  statLabel: {
    fontSize: 12, color: 'var(--text-muted)',
    letterSpacing: '0.08em', marginTop: 4,
    textTransform: 'uppercase',
  },
}

const sectionStyle = {
  padding: '100px 0',
}

const sectionHeader = {
  textAlign: 'center', marginBottom: 60,
}

const sectionTag = {
  display: 'inline-block',
  fontFamily: 'var(--font-display)',
  fontSize: 11, letterSpacing: '0.25em',
  color: 'var(--cyan)', marginBottom: 12,
}

const sectionTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(24px, 4vw, 40px)',
  color: 'var(--text-primary)',
  letterSpacing: '0.08em',
}

const featuresGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 24,
}

const featureCard = {
  padding: 32,
  background: 'var(--dark-2)',
  border: '1px solid var(--border-subtle)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'border-color 0.3s, transform 0.3s',
  animation: 'fadeInUp 0.6s both',
}

const featureIcon = {
  width: 52, height: 52,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 20,
}

const featureTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: 14, letterSpacing: '0.1em',
  marginBottom: 12,
}

const featureDesc = {
  color: 'var(--text-secondary)',
  fontSize: 15, lineHeight: 1.6,
}

const rankRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 16,
}

const rankCard = {
  padding: '24px 16px',
  background: 'var(--dark-3)',
  border: '1px solid',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', textAlign: 'center',
}
