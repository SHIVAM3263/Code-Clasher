import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { battlesAPI } from '../api'
import toast from 'react-hot-toast'
import {
  Swords, Zap, Users, Hash, ChevronRight, Loader,
  Snowflake, Cpu, Bomb, Shield, Eye, X, CheckCircle
} from 'lucide-react'

// ── Ability reference for the instructions modal ──────────────────────────────
const ABILITY_GUIDE = [
  { icon: Snowflake, name: 'FREEZE',      color: '#00f5ff', cost: 30, cd: '60s', effect: "Locks opponent's editor for 10 seconds — they can't type a single character." },
  { icon: Cpu,       name: 'MALFUNCTION', color: '#b44fff', cost: 40, cd: '90s', effect: "Corrupts opponent's code with glitch characters for 6 seconds, then restores it." },
  { icon: Bomb,      name: 'TIME BOMB',   color: '#ff6b35', cost: 20, cd: '40s', effect: "Shakes the entire enemy screen for 8 seconds to shatter their concentration." },
  { icon: Shield,    name: 'SHIELD',      color: '#00ff88', cost: 25, cd: '45s', effect: "Absorbs your next wrong-answer damage completely. Shows as a green glow on you." },
  { icon: Eye,       name: 'HACK',        color: '#ffd60a', cost: 35, cd: '120s',effect: "Peeks the first 300 characters of your opponent's current code for 4 seconds." },
]

const HOW_TO_WIN = [
  { icon: '⚔️', text: 'Be the first to submit an Accepted solution to the problem.' },
  { icon: '💥', text: "Every wrong answer deals damage to your HP. Reach 0 HP and you lose even without a solve." },
  { icon: '⚡', text: 'Energy regenerates over time. Spend it wisely on abilities to tilt the fight.' },
  { icon: '🛡', text: 'Use Shield before submitting a risky answer to block potential damage.' },
  { icon: '⏱', text: 'Time runs out when the battle timer hits zero — lowest HP loses on timeout.' },
]

function InstructionsModal({ onStart }) {
  const [tab, setTab] = useState('rules')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,8,0.92)',
      backdropFilter: 'blur(12px)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeInUp 0.3s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 640,
        background: 'var(--dark-2)',
        border: '1px solid var(--border-normal)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 0 80px rgba(0,245,255,0.08)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px 0',
          background: 'linear-gradient(135deg, var(--dark-3) 0%, var(--dark-2) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Swords size={24} color="var(--cyan)" />
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2, color: 'var(--text-primary)' }}>
                BATTLE BRIEFING
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Read the rules before entering the arena
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {[['rules', '📋 How To Win'], ['abilities', '⚡ Abilities']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
                color: tab === key ? 'var(--cyan)' : 'var(--text-muted)',
                borderBottom: tab === key ? '2px solid var(--cyan)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px', maxHeight: 360, overflowY: 'auto' }}>
          {tab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {HOW_TO_WIN.map((rule, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '14px 16px',
                  background: 'var(--dark-3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{rule.icon}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {rule.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'abilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                You start with 60 energy. It regenerates 5 every 8 seconds (max 100). Use abilities from the bar below the health bars during a battle.
              </p>
              {ABILITY_GUIDE.map(ab => {
                const Icon = ab.icon
                return (
                  <div key={ab.name} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    padding: '12px 16px',
                    background: `${ab.color}08`,
                    border: `1px solid ${ab.color}22`,
                    borderRadius: 8,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `${ab.color}18`, border: `1px solid ${ab.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={ab.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: ab.color, letterSpacing: 1 }}>
                          {ab.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--text-muted)', background: 'var(--dark-4)', padding: '1px 6px', borderRadius: 3 }}>
                          {ab.cost}⚡
                        </span>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--text-muted)', background: 'var(--dark-4)', padding: '1px 6px', borderRadius: 3 }}>
                          CD {ab.cd}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {ab.effect}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onStart}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 32px',
              background: 'var(--cyan)', color: '#000',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 2,
              fontWeight: 900, boxShadow: '0 0 20px rgba(0,245,255,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(0,245,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(0,245,255,0.3)'}
          >
            <CheckCircle size={16} />
            GOT IT — FIND MATCH
          </button>
        </div>
      </div>

      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

const MODES = [
  { id: 'RANKED', label: 'RANKED BATTLE', desc: 'Compete for MMR. Matched against players near your rating.', color: 'var(--gold)',   glow: 'rgba(255,214,10,0.15)' },
  { id: 'CASUAL', label: 'CASUAL BATTLE', desc: 'No MMR at stake. Great for practice and warm-up.',           color: 'var(--cyan)',   glow: 'rgba(0,245,255,0.15)'  },
]

export default function Arena() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedMode, setSelectedMode]     = useState('RANKED')
  const [showInstructions, setShowInstructions] = useState(false)
  const [queuing, setQueuing]               = useState(false)
  const [queueTime, setQueueTime]           = useState(0)
  const [roomCode, setRoomCode]             = useState('')
  const [joinLoading, setJoinLoading]       = useState(false)
  const [createLoading, setCreateLoading]   = useState(false)

  // ── Poll queue status when queuing ────────────────────────────────────────
  useEffect(() => {
    if (!queuing) return

    const timer    = setInterval(() => setQueueTime(t => t + 1), 1000)
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await battlesAPI.queueStatus()
        if (data.matched && data.room_code) {
          // Match found for player 1 (who was waiting in queue)
          clearInterval(pollInterval)
          clearInterval(timer)
          setQueuing(false)
          toast.success('⚔️ Match found! Entering arena...')
          navigate(`/battle/${data.room_code}`)
        } else if (!data.in_queue && !data.matched) {
          // Removed from queue for other reason (e.g. server restart)
          clearInterval(pollInterval)
          clearInterval(timer)
          setQueuing(false)
        }
      } catch {}
    }, 2000) // Poll every 2 seconds for snappier response

    return () => { clearInterval(timer); clearInterval(pollInterval) }
  }, [queuing, navigate])

  const handleFindMatchClick = () => {
    // Show instructions first
    setShowInstructions(true)
  }

  const handleJoinQueue = async () => {
    setShowInstructions(false)
    setQueuing(true)
    setQueueTime(0)
    try {
      const { data } = await battlesAPI.joinQueue(selectedMode)
      if (data.room_code) {
        // Matched instantly (player 2 scenario)
        setQueuing(false)
        toast.success('⚔️ Match found! Entering arena...')
        navigate(`/battle/${data.room_code}`)
      } else {
        toast('🔍 Searching for opponent...', { icon: '🎯' })
        // Polling useEffect takes over
      }
    } catch (err) {
      toast.error('Failed to join queue.')
      setQueuing(false)
    }
  }

  const handleLeaveQueue = async () => {
    try { await battlesAPI.leaveQueue() } catch {}
    setQueuing(false)
    setQueueTime(0)
  }

  const handleCreateRoom = async () => {
    setCreateLoading(true)
    try {
      const { data } = await battlesAPI.createRoom({ mode: 'CASUAL' })
      toast.success(`Room ${data.room_code} created!`)
      navigate(`/battle/${data.room_code}`)
    } catch {
      toast.error('Failed to create room.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    if (!roomCode.trim()) return
    setJoinLoading(true)
    try {
      const { data } = await battlesAPI.joinRoom(roomCode.toUpperCase().trim())
      toast.success('Joined the battle!')
      navigate(`/battle/${data.room_code}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Room not found.')
    } finally {
      setJoinLoading(false)
    }
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <>
      {/* ── Instructions Modal ─────────────────────────────────────────────── */}
      {showInstructions && (
        <InstructionsModal onStart={handleJoinQueue} />
      )}

      <div style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(0,245,255,0.04), transparent 60%)', minHeight: '100vh', paddingTop: 64 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.25em', color: 'var(--cyan)', marginBottom: 10 }}>BATTLE ARENA</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '0.1em', marginBottom: 8 }}>
              SELECT <span style={{ color: 'var(--cyan)' }}>BATTLE MODE</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
              Welcome back, <span style={{ color: 'var(--cyan)' }}>{user?.username}</span> · Rating: <span style={{ color: 'var(--gold)' }}>{user?.rating}</span> · {user?.rank}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

            {/* Left */}
            <div>
              {/* Mode cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                {MODES.map(({ id, label, desc, color, glow }) => (
                  <button key={id} onClick={() => setSelectedMode(id)} style={{
                    background: selectedMode === id ? glow : 'var(--dark-2)',
                    border: `1px solid ${selectedMode === id ? color : 'var(--border-subtle)'}`,
                    borderRadius: 10, padding: '24px 20px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                    boxShadow: selectedMode === id ? `0 0 30px ${glow}` : 'none',
                  }}>
                    {selectedMode === id && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, boxShadow: `0 0 8px ${color}` }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Swords size={18} color={color} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color, letterSpacing: '0.08em' }}>{label}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{desc}</p>
                  </button>
                ))}
              </div>

              {/* Find Match / Queuing */}
              {!queuing ? (
                <button
                  onClick={handleFindMatchClick}
                  style={{
                    width: '100%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 12, background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 8,
                    cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 2,
                    fontWeight: 900, boxShadow: '0 0 24px rgba(0,245,255,0.25)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(0,245,255,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(0,245,255,0.25)'}
                >
                  <Swords size={20} />
                  FIND MATCH — {selectedMode}
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div style={{
                  padding: '24px 32px', borderRadius: 10,
                  background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Loader size={22} color="var(--cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--cyan)', letterSpacing: '0.1em' }}>
                        SEARCHING FOR OPPONENT
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2, fontFamily: 'var(--font-code)' }}>
                        {formatTime(queueTime)} elapsed · {selectedMode}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLeaveQueue}
                    style={{
                      padding: '8px 16px', background: 'transparent',
                      border: '1px solid var(--border-subtle)', borderRadius: 6,
                      color: 'var(--text-muted)', cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1,
                    }}
                  >CANCEL</button>
                </div>
              )}

              {/* Radar animation */}
              {queuing && (
                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: 120, height: 120 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        position: 'absolute', inset: 0,
                        border: '1px solid rgba(0,245,255,0.3)',
                        borderRadius: '50%',
                        animation: `pulse-glow 2s ${i * 0.5}s infinite`,
                        transform: `scale(${i * 0.4})`,
                      }} />
                    ))}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)', animation: 'pulse-glow 1s infinite' }}>
                      <Swords size={28} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Custom rooms + stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Create room */}
              <div style={{ padding: '28px 24px', background: 'var(--dark-2)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Hash size={18} color="var(--purple)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--purple)', letterSpacing: '0.1em' }}>PRIVATE ROOM</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                  Create a custom room and challenge a friend with a code.
                </p>
                <button onClick={handleCreateRoom} disabled={createLoading} style={{
                  width: '100%', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'rgba(180,79,255,0.1)', border: '1px solid rgba(180,79,255,0.4)',
                  borderRadius: 6, cursor: 'pointer', color: 'var(--purple)',
                  fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
                }}>
                  {createLoading ? 'CREATING...' : <><Zap size={15} /> CREATE ROOM</>}
                </button>
              </div>

              {/* Join room */}
              <div style={{ padding: '28px 24px', background: 'var(--dark-2)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Users size={18} color="var(--green)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--green)', letterSpacing: '0.1em' }}>JOIN ROOM</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  Have a room code? Enter it below.
                </p>
                <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    style={{
                      flex: 1, padding: '10px 14px',
                      background: 'var(--dark-3)', border: '1px solid var(--border-subtle)',
                      borderRadius: 6, color: 'var(--cyan)',
                      fontFamily: 'var(--font-code)', fontSize: 15, letterSpacing: '0.2em', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--green)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                  <button type="submit" disabled={joinLoading || !roomCode} style={{
                    padding: '10px 16px', background: 'rgba(0,255,136,0.1)',
                    border: '1px solid rgba(0,255,136,0.4)', borderRadius: 6, cursor: 'pointer',
                    color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
                  }}>
                    {joinLoading ? '...' : 'JOIN'}
                  </button>
                </form>
              </div>

              {/* Stats */}
              <div style={{ padding: '24px', background: 'var(--dark-2)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 16 }}>YOUR STATS</div>
                {[
                  ['Rating',     user?.rating,    'var(--gold)'  ],
                  ['Rank',       user?.rank,      'var(--purple)'],
                  ['Win Rate',   `${user?.win_rate || 0}%`, 'var(--green)'],
                  ['Win Streak', user?.win_streak, 'var(--cyan)' ],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color }}>{val ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </>
  )
}
