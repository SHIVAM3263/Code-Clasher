import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usersAPI, battlesAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import {
  User, Swords, Trophy, Zap, Target, Shield, TrendingUp,
  Calendar, Star, Award, ChevronRight, Clock, Code2,
  Flame, BarChart3, GitBranch
} from 'lucide-react'
import toast from 'react-hot-toast'

const RANK_COLORS = {
  UNRANKED:    { color: '#445566', glow: 'rgba(68,85,102,0.3)',  label: 'UNRANKED'    },
  IRON:        { color: '#8b9ba8', glow: 'rgba(139,155,168,0.3)', label: 'IRON'        },
  BRONZE:      { color: '#cd7f32', glow: 'rgba(205,127,50,0.3)', label: 'BRONZE'      },
  SILVER:      { color: '#c0c0c0', glow: 'rgba(192,192,192,0.3)', label: 'SILVER'     },
  GOLD:        { color: '#ffd700', glow: 'rgba(255,215,0,0.3)',  label: 'GOLD'        },
  PLATINUM:    { color: '#00f5ff', glow: 'rgba(0,245,255,0.3)',  label: 'PLATINUM'    },
  DIAMOND:     { color: '#b44fff', glow: 'rgba(180,79,255,0.3)', label: 'DIAMOND'     },
  MASTER:      { color: '#ff6b35', glow: 'rgba(255,107,53,0.3)', label: 'MASTER'      },
  GRANDMASTER: { color: '#ff2d55', glow: 'rgba(255,45,85,0.4)', label: 'GRANDMASTER' },
}

const DIFF_COLORS = { EASY: '#00ff88', MEDIUM: '#ffd60a', HARD: '#ff6b35', ELITE: '#ff2d55' }

function StatRing({ value, max = 100, color, size = 80, label, sublabel }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = circ * (1 - pct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px`,
            fill: color, fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 700 }}>
          {sublabel || value}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase',
        letterSpacing: 1, fontFamily: 'var(--font-display)' }}>{label}</span>
    </div>
  )
}

function ActivityBar({ day, count, max }) {
  const h = max > 0 ? Math.max(4, (count / max) * 48) : 4
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 8, height: 48, display: 'flex', alignItems: 'flex-end' }}>
        <div style={{
          width: '100%', height: h, background: count > 0 ? 'var(--cyan)' : 'rgba(0,245,255,0.08)',
          borderRadius: 2, boxShadow: count > 0 ? '0 0 6px var(--cyan)' : 'none',
          transition: 'height 0.8s ease',
        }}/>
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>{day}</span>
    </div>
  )
}

function BattleCard({ battle, userId }) {
  const isP1 = battle.player1?.id === userId
  const me = isP1 ? battle.player1 : battle.player2
  const opp = isP1 ? battle.player2 : battle.player1
  const won = battle.winner?.id === userId
  const status = battle.status

  const resultColor = status !== 'COMPLETED' ? 'var(--text-secondary)'
    : won ? 'var(--green)' : 'var(--red)'
  const resultLabel = status !== 'COMPLETED' ? status
    : won ? 'VICTORY' : 'DEFEAT'

  return (
    <div style={{
      background: 'var(--dark-2)',
      border: `1px solid ${won ? 'rgba(0,255,136,0.15)' : 'rgba(255,45,85,0.1)'}`,
      borderRadius: 8, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'border-color 0.2s',
    }}>
      {/* Result badge */}
      <div style={{
        minWidth: 72, textAlign: 'center', padding: '4px 8px',
        background: won ? 'rgba(0,255,136,0.08)' : 'rgba(255,45,85,0.08)',
        border: `1px solid ${resultColor}33`, borderRadius: 4,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: resultColor,
          letterSpacing: 1 }}>{resultLabel}</span>
      </div>

      {/* VS info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
          vs <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)', fontSize: 11 }}>
            {opp?.username || 'Unknown'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {battle.mode} · {battle.problem?.title || 'Unknown Problem'}
        </div>
      </div>

      {/* Rating delta */}
      {battle.status === 'COMPLETED' && (
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            color: won ? 'var(--green)' : 'var(--red)',
          }}>
            {won ? '+' : ''}{isP1 ? battle.player1_rating_delta : battle.player2_rating_delta || 0}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>rating</div>
        </div>
      )}

      <ChevronRight size={14} color="var(--text-muted)" />
    </div>
  )
}

export default function Profile() {
  const { id } = useParams()
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const isOwnProfile = !id || id === authUser?.profile?.id?.toString()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const profileRes = isOwnProfile
          ? await usersAPI.me()
          : await usersAPI.getProfile(id)
        setProfile(profileRes.data)

        if (isOwnProfile) {
          const battlesRes = await battlesAPI.myBattles()
          setBattles(battlesRes.data?.results || battlesRes.data || [])
        }
      } catch {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, isOwnProfile])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '80vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '2px solid var(--cyan)',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite' }}/>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11,
        color: 'var(--cyan)', letterSpacing: 2 }}>LOADING PROFILE</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
      Profile not found
    </div>
  )

  const rank = RANK_COLORS[profile.rank] || RANK_COLORS.UNRANKED
  const winRate = profile.total_battles > 0
    ? Math.round((profile.wins / profile.total_battles) * 100) : 0
  const xpPct = profile.xp_to_next_level > 0
    ? Math.round((profile.xp % profile.xp_to_next_level / profile.xp_to_next_level) * 100) : 0

  // Mock activity for last 14 days
  const activity = Array.from({ length: 14 }, (_, i) => ({
    day: ['S','M','T','W','T','F','S','S','M','T','W','T','F','S'][i],
    count: Math.floor(Math.random() * 5),
  }))
  const maxActivity = Math.max(...activity.map(a => a.count))

  const tabs = ['overview', 'battles', 'achievements']

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark-3) 100%)',
        border: `1px solid ${rank.color}33`,
        borderRadius: 16, padding: '32px 36px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 280, height: 280,
          background: `radial-gradient(circle, ${rank.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}/>
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40,
          borderTop: `2px solid ${rank.color}`, borderLeft: `2px solid ${rank.color}`, borderRadius: '16px 0 0 0' }}/>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
          borderBottom: `2px solid ${rank.color}`, borderRight: `2px solid ${rank.color}`, borderRadius: '0 0 16px 0' }}/>

        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: `linear-gradient(135deg, ${rank.color}33, ${rank.color}11)`,
              border: `3px solid ${rank.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 24px ${rank.glow}`,
            }}>
              <User size={40} color={rank.color} />
            </div>
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              background: rank.color, borderRadius: 12, padding: '2px 8px',
              fontFamily: 'var(--font-display)', fontSize: 8, color: '#000',
              fontWeight: 900, letterSpacing: 1,
            }}>{rank.label}</div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22,
              color: 'var(--text-primary)', marginBottom: 4 }}>
              {profile.user?.username || profile.username}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {profile.bio || 'No bio set · Code Clasher'} &nbsp;·&nbsp;
              <span style={{ color: 'var(--cyan)' }}>Level {profile.level}</span>
            </div>
            {/* XP bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
                  letterSpacing: 1 }}>XP PROGRESS</span>
                <span style={{ fontSize: 10, color: rank.color, fontFamily: 'var(--font-code)' }}>
                  {profile.xp?.toLocaleString()} XP
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${xpPct}%`, borderRadius: 3,
                  background: `linear-gradient(90deg, ${rank.color}, ${rank.color}99)`,
                  boxShadow: `0 0 8px ${rank.glow}`,
                  transition: 'width 1s ease',
                }}/>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <StatRing value={profile.rating} max={3000} color={rank.color}
              size={80} label="Rating" sublabel={profile.rating} />
            <StatRing value={winRate} max={100} color="var(--green)"
              size={80} label="Win Rate" sublabel={`${winRate}%`} />
            <StatRing value={profile.current_streak || 0} max={20} color="var(--gold)"
              size={80} label="Streak" sublabel={profile.current_streak || 0} />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20,
        background: 'var(--dark-2)', borderRadius: 8, padding: 4,
        border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1,
            textTransform: 'uppercase',
            background: activeTab === tab ? 'var(--cyan)' : 'transparent',
            color: activeTab === tab ? '#000' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}>{tab}</button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Combat Stats */}
          <div style={{ background: 'var(--dark-2)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11,
              color: 'var(--cyan)', letterSpacing: 2, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8 }}>
              <Swords size={14}/> COMBAT STATS
            </div>
            {[
              { label: 'Total Battles', value: profile.total_battles || 0, icon: <Swords size={14}/> },
              { label: 'Victories', value: profile.wins || 0, icon: <Trophy size={14}/>, color: 'var(--green)' },
              { label: 'Defeats', value: profile.losses || 0, icon: <Shield size={14}/>, color: 'var(--red)' },
              { label: 'Win Rate', value: `${winRate}%`, icon: <Target size={14}/>, color: 'var(--gold)' },
              { label: 'Best Streak', value: profile.best_streak || 0, icon: <Flame size={14}/>, color: 'var(--gold)' },
              { label: 'Peak Rating', value: profile.peak_rating || profile.rating, icon: <TrendingUp size={14}/> },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                  color: 'var(--text-secondary)', fontSize: 13 }}>
                  <span style={{ color: color || 'var(--text-muted)' }}>{icon}</span>
                  {label}
                </div>
                <span style={{ fontFamily: 'var(--font-code)', color: color || 'var(--text-primary)',
                  fontSize: 14 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Activity */}
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11,
                color: 'var(--cyan)', letterSpacing: 2, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={14}/> ACTIVITY (14 DAYS)
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
                {activity.map((a, i) => (
                  <ActivityBar key={i} day={a.day} count={a.count} max={maxActivity} />
                ))}
              </div>
            </div>

            {/* Difficulty breakdown */}
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: 24, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11,
                color: 'var(--cyan)', letterSpacing: 2, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={14}/> PROBLEMS SOLVED
              </div>
              {[
                { diff: 'EASY',   solved: profile.easy_solved || 0,   total: 50  },
                { diff: 'MEDIUM', solved: profile.medium_solved || 0, total: 80  },
                { diff: 'HARD',   solved: profile.hard_solved || 0,   total: 60  },
                { diff: 'ELITE',  solved: profile.elite_solved || 0,  total: 20  },
              ].map(({ diff, solved, total }) => (
                <div key={diff} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: DIFF_COLORS[diff],
                      fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{diff}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-code)',
                      color: 'var(--text-secondary)' }}>{solved}/{total}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', width: `${(solved/total)*100}%`, borderRadius: 2,
                      background: DIFF_COLORS[diff],
                      boxShadow: `0 0 6px ${DIFF_COLORS[diff]}88`,
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Battles Tab ── */}
      {activeTab === 'battles' && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>
            {battles.length} RECENT BATTLES
          </div>
          {battles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Swords size={40} style={{ marginBottom: 12, opacity: 0.3 }}/>
              <p>No battles fought yet. Enter the arena!</p>
              <Link to="/arena" style={{ display: 'inline-block', marginTop: 16,
                padding: '10px 24px', background: 'var(--cyan)', color: '#000',
                borderRadius: 6, textDecoration: 'none',
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1 }}>
                FIND BATTLE
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {battles.map(b => (
                <BattleCard key={b.id} battle={b} userId={profile.user?.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Achievements Tab ── */}
      {activeTab === 'achievements' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: <Trophy size={24}/>, name: 'First Blood', desc: 'Win your first battle', earned: (profile.wins || 0) >= 1, color: 'var(--gold)' },
              { icon: <Flame size={24}/>, name: 'On Fire', desc: 'Win 5 in a row', earned: (profile.best_streak || 0) >= 5, color: 'var(--red)' },
              { icon: <Zap size={24}/>, name: 'Speed Demon', desc: 'Solve in under 5 minutes', earned: false, color: 'var(--cyan)' },
              { icon: <Star size={24}/>, name: 'Rising Star', desc: 'Reach Gold rank', earned: ['GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER'].includes(profile.rank), color: 'var(--gold)' },
              { icon: <Target size={24}/>, name: 'Sharpshooter', desc: 'Reach 70% win rate', earned: winRate >= 70, color: 'var(--green)' },
              { icon: <Award size={24}/>, name: 'Veteran', desc: 'Fight 100 battles', earned: (profile.total_battles || 0) >= 100, color: 'var(--purple)' },
              { icon: <GitBranch size={24}/>, name: 'Polyglot', desc: 'Use 3 different languages', earned: false, color: 'var(--cyan)' },
              { icon: <TrendingUp size={24}/>, name: 'Climber', desc: 'Reach 1500 rating', earned: (profile.rating || 0) >= 1500, color: 'var(--purple)' },
            ].map(ach => (
              <div key={ach.name} style={{
                background: ach.earned ? `${ach.color}11` : 'var(--dark-2)',
                border: `1px solid ${ach.earned ? ach.color + '33' : 'var(--border-subtle)'}`,
                borderRadius: 12, padding: 20,
                opacity: ach.earned ? 1 : 0.4,
                transition: 'opacity 0.2s',
              }}>
                <div style={{ color: ach.earned ? ach.color : 'var(--text-muted)', marginBottom: 10 }}>
                  {ach.icon}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11,
                  color: ach.earned ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: 1, marginBottom: 4 }}>{ach.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ach.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
