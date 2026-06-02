import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Swords, Trophy, Code2, Users, LogOut, User, Menu, X, Zap } from 'lucide-react'

const RANK_ICONS = {
  UNRANKED: '⚫', BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇',
  PLATINUM: '💠', DIAMOND: '💎', MASTER: '🔮', GRANDMASTER: '👑'
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { path: '/arena',      icon: Swords,  label: 'Arena' },
    { path: '/problems',   icon: Code2,   label: 'Problems' },
    { path: '/leaderboard', icon: Trophy,  label: 'Rankings' },
  ]

  return (
    <nav style={styles.nav}>
      {/* Corner accents */}
      <div style={styles.cornerTL} />
      <div style={styles.cornerBR} />

      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Swords size={18} />
          </div>
          <div>
            <div style={styles.logoText}>CODE CLASHER</div>
            <div style={styles.logoSub}>BATTLE ARENA</div>
          </div>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div style={styles.navLinks}>
            {navLinks.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navLink,
                  ...(isActive(path) ? styles.navLinkActive : {}),
                }}
              >
                <Icon size={15} />
                {label}
                {isActive(path) && <div style={styles.navLinkUnderline} />}
              </Link>
            ))}
          </div>
        )}

        {/* Right section */}
        <div style={styles.right}>
          {user ? (
            <>
              {/* Player stat chip */}
              <div style={styles.statChip}>
                <span style={{ color: 'var(--gold)', fontSize: 13 }}>
                  {RANK_ICONS[user.rank]} {user.rating}
                </span>
                <div style={styles.statDivider} />
                <span style={{ color: 'var(--purple)', fontSize: 12 }}>
                  LVL {user.level}
                </span>
              </div>

              {/* Profile link */}
              <Link to="/profile" style={styles.profileBtn}>
                <div style={styles.avatar}>
                  {user.username?.[0]?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-display)' }}>
                  {user.username}
                </span>
              </Link>

              <button onClick={() => { logout(); navigate('/') }} style={styles.logoutBtn} title="Logout">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/login">
                <button className="btn btn-ghost btn-sm">Login</button>
              </Link>
              <Link to="/register">
                <button className="btn btn-cyan btn-sm">
                  <Zap size={13} /> Join Now
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Active page glow line */}
      <div style={styles.bottomGlow} />
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0,
    height: 64,
    background: 'rgba(5, 5, 8, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 245, 255, 0.12)',
    zIndex: 100,
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 40, height: 3,
    background: 'var(--cyan)',
    boxShadow: '0 0 15px var(--cyan)',
  },
  cornerBR: {
    position: 'absolute', top: 0, right: 0,
    width: 40, height: 3,
    background: 'var(--purple)',
    boxShadow: '0 0 15px var(--purple)',
  },
  inner: {
    maxWidth: 1400, margin: '0 auto', padding: '0 24px',
    height: '100%',
    display: 'flex', alignItems: 'center', gap: 32,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none',
  },
  logoIcon: {
    width: 36, height: 36,
    background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#000',
    clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 14, fontWeight: 900,
    letterSpacing: '0.15em',
    color: 'var(--cyan)',
    lineHeight: 1.1,
  },
  logoSub: {
    fontSize: 9, letterSpacing: '0.2em',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-display)',
  },
  navLinks: {
    display: 'flex', gap: 4, flex: 1,
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 16px',
    fontSize: 13, fontFamily: 'var(--font-display)',
    fontWeight: 600, letterSpacing: '0.08em',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s',
    position: 'relative',
  },
  navLinkActive: {
    color: 'var(--cyan)',
  },
  navLinkUnderline: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, background: 'var(--cyan)',
    boxShadow: '0 0 8px var(--cyan)',
  },
  right: {
    marginLeft: 'auto',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  statChip: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '4px 14px',
    background: 'var(--dark-3)',
    border: '1px solid var(--border-subtle)',
    fontFamily: 'var(--font-display)',
    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
  },
  statDivider: {
    width: 1, height: 14,
    background: 'var(--border-normal)',
  },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 12px',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
  avatar: {
    width: 28, height: 28,
    background: 'linear-gradient(135deg, var(--purple-dim), var(--purple))',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 900,
    fontFamily: 'var(--font-display)',
    color: '#fff',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-muted)',
    width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  bottomGlow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, var(--cyan-dim), var(--purple-dim), transparent)',
    opacity: 0.3,
  },
}
