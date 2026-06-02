import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../api'
import { Trophy, TrendingUp, Swords, Target, Zap } from 'lucide-react'

const RANK_ICONS = {
  UNRANKED: '⚫', BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇',
  PLATINUM: '💠', DIAMOND: '💎', MASTER: '🔮', GRANDMASTER: '👑'
}

const RANK_COLORS = {
  UNRANKED: '#666', BRONZE: '#e8a87c', SILVER: '#c0c8d8', GOLD: 'var(--gold)',
  PLATINUM: '#74b9ff', DIAMOND: 'var(--purple)', MASTER: '#fd79a8', GRANDMASTER: 'var(--red)'
}

const TABS = [
  { id: 'rating', label: 'RATING', icon: Trophy },
  { id: 'wins', label: 'WINS', icon: Swords },
  { id: 'problems', label: 'PROBLEMS', icon: Target },
  { id: 'streak', label: 'WIN STREAK', icon: Zap },
]

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('rating')

  useEffect(() => {
    usersAPI.leaderboard()
      .then(({ data }) => setPlayers(data))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...players].sort((a, b) => {
    if (tab === 'rating') return b.rating - a.rating
    if (tab === 'wins') return b.battles_won - a.battles_won
    if (tab === 'problems') return b.problems_solved - a.problems_solved
    if (tab === 'streak') return b.win_streak - a.win_streak
    return 0
  })

  return (
    <div className="page-container">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.25em', color: 'var(--gold)', marginBottom: 10 }}>HALL OF FAME</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '0.1em', marginBottom: 8 }}>
            <span style={{ color: 'var(--gold)' }}>GLOBAL</span> LEADERBOARD
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Top warriors ranked by performance across the arena.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--border-subtle)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === id ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.1em',
              cursor: 'pointer', transition: 'color 0.2s', marginBottom: -1,
            }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && sorted.length >= 3 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 40, alignItems: 'flex-end', justifyContent: 'center' }}>
            {[sorted[1], sorted[0], sorted[2]].map((p, i) => {
              const pos = i === 0 ? 2 : i === 1 ? 1 : 3
              const heights = { 1: 140, 2: 110, 3: 90 }
              const colors = { 1: 'var(--gold)', 2: '#c0c8d8', 3: '#e8a87c' }
              const icons = { 1: '🥇', 2: '🥈', 3: '🥉' }
              return (
                <div key={p.id} style={{ textAlign: 'center', flex: 1, maxWidth: 180 }}>
                  <div style={{ marginBottom: 8, fontSize: 32 }}>{icons[pos]}</div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${colors[pos]}, ${colors[pos]}88)`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: '#000', border: `2px solid ${colors[pos]}`, boxShadow: `0 0 20px ${colors[pos]}50` }}>
                      {p.username[0].toUpperCase()}
                    </div>
                    <Link to={`/profile/${p.id}`} style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: colors[pos], textDecoration: 'none', letterSpacing: '0.06em' }}>{p.username}</Link>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{RANK_ICONS[p.rank]} {p.rank}</div>
                  </div>
                  <div style={{ height: heights[pos], background: `linear-gradient(to top, ${colors[pos]}20, transparent)`, border: `1px solid ${colors[pos]}30`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 12, fontFamily: 'var(--font-display)', fontSize: 18, color: colors[pos] }}>
                    {tab === 'rating' ? p.rating : tab === 'wins' ? p.battles_won : tab === 'problems' ? p.problems_solved : p.win_streak}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full table */}
        <div style={{ background: 'var(--dark-2)', border: '1px solid var(--border-subtle)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 120px 100px 100px 100px', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
            <span>#</span><span>PLAYER</span><span style={{ textAlign: 'right' }}>RATING</span><span style={{ textAlign: 'right' }}>WINS</span><span style={{ textAlign: 'right' }}>SOLVED</span><span style={{ textAlign: 'right' }}>WIN %</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>LOADING WARRIORS...</div>
          ) : (
            sorted.map((p, i) => {
              const rankColor = RANK_COLORS[p.rank] || '#666'
              return (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '56px 1fr 120px 100px 100px 100px',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: i < 3 ? `linear-gradient(90deg, ${['rgba(255,214,10,0.04)', 'rgba(192,200,216,0.03)', 'rgba(232,168,124,0.03)'][i]}, transparent)` : 'transparent',
                  transition: 'background 0.2s',
                  alignItems: 'center',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,245,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = i < 3 ? `linear-gradient(90deg, ${['rgba(255,214,10,0.04)', 'rgba(192,200,216,0.03)', 'rgba(232,168,124,0.03)'][i]}, transparent)` : 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: i < 3 ? ['var(--gold)', '#c0c8d8', '#e8a87c'][i] : 'var(--text-muted)', fontWeight: 700 }}>
                    {i + 1}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${rankColor}40, ${rankColor}20)`, border: `1px solid ${rankColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, color: rankColor, flexShrink: 0 }}>
                      {p.username[0].toUpperCase()}
                    </div>
                    <div>
                      <Link to={`/profile/${p.id}`} style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none', letterSpacing: '0.04em' }}>{p.username}</Link>
                      <div style={{ fontSize: 11, color: rankColor, marginTop: 1 }}>{RANK_ICONS[p.rank]} {p.rank}</div>
                    </div>
                  </div>

                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)', fontWeight: 700 }}>{p.rating}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--green)' }}>{p.battles_won}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--cyan)' }}>{p.problems_solved}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--purple)' }}>{p.win_rate}%</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
