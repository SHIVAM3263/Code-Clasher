import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../contexts/AuthContext'
import { battlesAPI } from '../api'
import HealthBar from '../components/HealthBar'
import toast from 'react-hot-toast'
import {
  Swords, Play, Flag, Clock, Terminal, CheckCircle, XCircle,
  AlertTriangle, ChevronDown, ChevronUp, Zap, Shield, Eye,
  Snowflake, Cpu, Bomb
} from 'lucide-react'

// ─── Ability Definitions ─────────────────────────────────────────────────────
const ABILITIES = {
  freeze:      { id: 'freeze',      name: 'FREEZE',      icon: Snowflake, cost: 30, cooldown: 60,  duration: 10, color: '#00f5ff', desc: 'Lock opponent\'s editor for 10s' },
  malfunction: { id: 'malfunction', name: 'MALFUNCTION',  icon: Cpu,       cost: 40, cooldown: 90,  duration: 6,  color: '#b44fff', desc: 'Corrupt opponent\'s code for 6s' },
  timebomb:    { id: 'timebomb',    name: 'TIME BOMB',    icon: Bomb,      cost: 20, cooldown: 40,  duration: 8,  color: '#ff6b35', desc: 'Shake & distract opponent for 8s' },
  shield:      { id: 'shield',      name: 'SHIELD',       icon: Shield,    cost: 25, cooldown: 45,  duration: 15, color: '#00ff88', desc: 'Block next wrong-answer damage' },
  hack:        { id: 'hack',        name: 'HACK',         icon: Eye,       cost: 35, cooldown: 120, duration: 4,  color: '#ffd60a', desc: 'Peek opponent\'s code for 4s' },
}

const LANGUAGES = [
  { id: 'python',     label: 'Python 3' },
  { id: 'cpp',        label: 'C++17 (coming soon)', disabled: true },
  { id: 'java',       label: 'Java (coming soon)',  disabled: true },
]

const VERDICTS = {
  AC:  { label: 'ACCEPTED',            color: 'var(--green)', icon: CheckCircle,  bg: 'rgba(0,255,136,0.1)' },
  WA:  { label: 'WRONG ANSWER',        color: 'var(--red)',   icon: XCircle,      bg: 'rgba(255,45,85,0.1)'  },
  TLE: { label: 'TIME LIMIT EXCEEDED', color: 'var(--gold)',  icon: Clock,        bg: 'rgba(255,214,10,0.1)' },
  RE:  { label: 'RUNTIME ERROR',       color: 'var(--red)',   icon: XCircle,      bg: 'rgba(255,45,85,0.1)'  },
  CE:  { label: 'COMPILE ERROR',       color: 'var(--red)',   icon: AlertTriangle,bg: 'rgba(255,45,85,0.1)'  },
  MLE: { label: 'MEMORY LIMIT',        color: '#ff6b35',      icon: AlertTriangle,bg: 'rgba(255,107,53,0.1)' },
  PE:  { label: 'PENDING',             color: 'var(--cyan)',  icon: Zap,          bg: 'rgba(0,245,255,0.1)'  },
}

const ENERGY_MAX = 100
const ENERGY_REGEN = 5      // per tick
const ENERGY_TICK_MS = 8000 // every 8 seconds

export default function Battle() {
  const { roomCode } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [battle, setBattle]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [code, setCode]                 = useState('')
  const [language, setLanguage]         = useState('python')

  // Keep codeRef in sync so WS callbacks always read fresh value
  useEffect(() => { codeRef.current = code }, [code])
  const [submitting, setSubmitting]     = useState(false)
  const [lastVerdict, setLastVerdict]   = useState(null)
  const [showConsole, setShowConsole]   = useState(true)
  const [submissions, setSubmissions]   = useState([])
  const [timeLeft, setTimeLeft]         = useState(0)
  const [showDesc, setShowDesc]         = useState(true)

  // ── Ability state ──────────────────────────────────────────────────────────
  const [energy, setEnergy]             = useState(60)
  const [cooldowns, setCooldowns]       = useState({})      // { abilityId: timestampEnd }
  const [shielded, setShielded]         = useState(false)
  const [activeEffect, setActiveEffect] = useState(null)   // { type, endsAt }
  const frozenCodeRef = useRef(null)                        // saved code before malfunction (ref avoids stale closure)
  const [hackData, setHackData]         = useState(null)   // { code, endsAt }
  const [screenShake, setScreenShake]   = useState(false)
  const [tabWarnings, setTabWarnings]   = useState(0)  // tab-switch violation count
  const [showTabWarning, setShowTabWarning] = useState(false)

  const wsRef      = useRef(null)
  const codeRef    = useRef('')   // always-fresh code for use inside WS callbacks
  const timerRef   = useRef(null)
  const energyRef  = useRef(null)
  const effectRef  = useRef(null)
  const editorRef  = useRef(null)

  // ── Tab-switch detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!battle || battle.status !== 'IN_PROGRESS') return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarnings(prev => {
          const next = prev + 1
          setShowTabWarning(true)
          setTimeout(() => setShowTabWarning(false), 4000)
          if (next >= 3) {
            toast.error('⚠️ 3 tab switches detected — auto-forfeit warning!', { duration: 5000 })
          }
          return next
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [battle?.status])

  // ── Fetch battle ─────────────────────────────────────────────────────────
  const fetchBattle = useCallback(async () => {
    try {
      const { data } = await battlesAPI.getRoom(roomCode)
      setBattle(data)
      setTimeLeft(data.time_remaining || 0)
      setSubmissions(data.submissions || [])
      if (!code && data.problem_data?.starter_code?.python) {
        setCode(data.problem_data.starter_code.python)
      }
    } catch {
      toast.error('Battle not found.')
      navigate('/arena')
    } finally {
      setLoading(false)
    }
  }, [roomCode, navigate])

  useEffect(() => { fetchBattle() }, [fetchBattle])

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (battle?.status === 'IN_PROGRESS') {
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [battle?.status])

  // ── Energy regen ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (battle?.status !== 'IN_PROGRESS') return
    energyRef.current = setInterval(() => {
      setEnergy(e => Math.min(ENERGY_MAX, e + ENERGY_REGEN))
    }, ENERGY_TICK_MS)
    return () => clearInterval(energyRef.current)
  }, [battle?.status])

  // ── Active effect expiry watcher ──────────────────────────────────────────
  useEffect(() => {
    if (!activeEffect) return
    const remaining = activeEffect.endsAt - Date.now()
    if (remaining <= 0) { clearEffect(); return }
    effectRef.current = setTimeout(clearEffect, remaining)
    return () => clearTimeout(effectRef.current)
  }, [activeEffect])

  // ── Hack expiry ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hackData) return
    const remaining = hackData.endsAt - Date.now()
    if (remaining <= 0) { setHackData(null); return }
    const t = setTimeout(() => setHackData(null), remaining)
    return () => clearTimeout(t)
  }, [hackData])

  const clearEffect = () => {
    setActiveEffect(prev => {
      if (prev?.type === 'malfunction' && frozenCodeRef.current !== null) {
        setCode(frozenCodeRef.current)
        frozenCodeRef.current = null
      }
      return null
    })
    setScreenShake(false)
  }

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token") || ""
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/battle/${roomCode}/?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'battle_update') {
        const { event, data } = msg
        if (event === 'submission') {
          setBattle(prev => prev ? {
            ...prev,
            p1_health: data.p1_health,
            p2_health: data.p2_health,
            status: data.battle_status,
          } : prev)
          if (data.verdict === 'AC' && data.user !== user?.username) {
            toast('💀 Your opponent solved it!', { icon: '⚔️' })
          }
          if (data.battle_status === 'COMPLETED') {
            clearInterval(timerRef.current)
            fetchBattle()
          }
        } else if (event === 'player_joined') {
          toast.success(`⚔️ ${data.player2} joined the battle!`)
          fetchBattle()
        } else if (event === 'forfeit') {
          toast(`${data.forfeited_by} forfeited!`, { icon: '🏳️' })
          fetchBattle()
        }
      }

      // ── Ability events ────────────────────────────────────────────────────
      if (msg.type === 'ability_used') {
        const isTargeted = msg.target_username === user?.username
        const isOwn      = msg.from_username  === user?.username

        if (isOwn && !isTargeted) {
          toast(`⚡ ${msg.ability_name} deployed!`, { duration: 2000 })
        }

        if (isTargeted) {
          applyAbilityEffect(msg.ability_id, msg.duration, msg.code_snapshot)
        }

        if (msg.ability_id === 'ability_result') {
          if (msg.result === 'shield_blocked') {
            toast('🛡 Opponent\'s shield blocked your attack!', { duration: 2500 })
          }
        }
      }

      if (msg.type === 'ability_result') {
        if (msg.result === 'shield_blocked' && msg.username !== user?.username) {
          toast('🛡 Opponent\'s SHIELD blocked your attack!', { duration: 2500 })
        }
      }

      // Hack: attacker receives opponent's code
      if (msg.type === 'hack_response' && msg.target_username === user?.username) {
        setHackData({ code: msg.code, endsAt: Date.now() + 4000 })
      }
    }

    ws.onerror = () => {}
    return () => ws.close()
  }, [roomCode, user, fetchBattle])

  // ── Apply incoming ability effect ─────────────────────────────────────────
  const applyAbilityEffect = (abilityId, duration, codeSnapshot) => {
    const endsAt = Date.now() + duration * 1000
    switch (abilityId) {
      case 'freeze':
        toast('❄️ YOU ARE FROZEN!', { duration: 3000, style: { background: '#001a2e', color: '#00f5ff', border: '1px solid #00f5ff' } })
        setActiveEffect({ type: 'freeze', endsAt })
        break

      case 'malfunction':
        toast('💀 MALFUNCTION — CODE CORRUPTED!', { duration: 3000, style: { background: '#1a001a', color: '#b44fff', border: '1px solid #b44fff' } })
        frozenCodeRef.current = code   // save synchronously — no stale closure risk
        setCode(prev => corruptCode(prev))
        setActiveEffect({ type: 'malfunction', endsAt })
        break

      case 'timebomb':
        toast('💣 TIME BOMB — BRACE YOURSELF!', { duration: 2000, style: { background: '#1a0800', color: '#ff6b35', border: '1px solid #ff6b35' } })
        setScreenShake(true)
        setActiveEffect({ type: 'timebomb', endsAt })
        setTimeout(() => setScreenShake(false), duration * 1000)
        break

      case 'shield':
        // Shield was used by opponent on themselves — no effect on us, but we see it
        toast('🛡 Opponent activated SHIELD!', { duration: 2000 })
        break

      case 'hack':
        toast('🔍 OPPONENT IS PEEKING YOUR CODE!', { duration: 3000, style: { background: '#1a1500', color: '#ffd60a', border: '1px solid #ffd60a' } })
        // Send our current code back to the attacker
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'hack_response',
            target_username: msg.from_username,
            code: codeRef.current.slice(0, 500),
          }))
        }
        break
    }
  }

  // ── Corrupt code for malfunction ──────────────────────────────────────────
  const corruptCode = (originalCode) => {
    const glitchChars = '█▓▒░@#$%&*!?~^<>|\\÷×±°∞§¶'
    return originalCode.split('').map(ch => {
      if (ch === '\n') return ch
      if (Math.random() < 0.3) return glitchChars[Math.floor(Math.random() * glitchChars.length)]
      return ch
    }).join('')
  }

  // ── Use ability ───────────────────────────────────────────────────────────
  const useAbility = (abilityId) => {
    const ability = ABILITIES[abilityId]
    if (!ability || !wsRef.current) return

    if (energy < ability.cost) {
      toast.error(`Not enough energy! Need ${ability.cost}, have ${Math.floor(energy)}.`)
      return
    }

    const now = Date.now()
    if (cooldowns[abilityId] && cooldowns[abilityId] > now) {
      const remaining = Math.ceil((cooldowns[abilityId] - now) / 1000)
      toast.error(`${ability.name} on cooldown — ${remaining}s remaining`)
      return
    }

    // Shield applies to self
    if (abilityId === 'shield') {
      if (shielded) { toast.error('Shield already active!'); return }
      setShielded(true)
      setTimeout(() => setShielded(false), ability.duration * 1000)
      toast.success('🛡 SHIELD ACTIVE — next damage blocked!', { duration: 2500 })
    }

    // Deduct energy + set cooldown
    setEnergy(e => e - ability.cost)
    setCooldowns(prev => ({ ...prev, [abilityId]: now + ability.cooldown * 1000 }))

    // Send via WebSocket
    const targetUsername = isP1 ? battle?.player2_profile?.username : battle?.player1_profile?.username
    wsRef.current.send(JSON.stringify({
      type: 'use_ability',
      ability_id: abilityId,
      target_username: abilityId === 'shield' ? user?.username : targetUsername,
      code_snapshot: '',  // hack: target responds with their code via hack_response
    }))
  }

  // ── Intercept damage with shield ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!code.trim()) { toast.error('Write some code first!'); return }
    setSubmitting(true)
    setLastVerdict(null)
    try {
      const { data: sub } = await battlesAPI.submit(roomCode, { code, language })
      setLastVerdict(sub.verdict)
      setSubmissions(prev => [sub, ...prev])

      if (sub.verdict === 'AC') {
        toast.success('✅ ACCEPTED! You win the battle!')
        fetchBattle()
      } else {
        const v = VERDICTS[sub.verdict] || VERDICTS.PE
        const blocked = shielded && sub.damage_dealt > 0
        if (blocked) {
          setShielded(false)
          toast.success('🛡 SHIELD BLOCKED the damage!', { duration: 2500 })
          wsRef.current?.send(JSON.stringify({ type: 'ability_result', ability_id: 'shield', result: 'shield_blocked' }))
        } else {
          toast.error(`${v.label} — -${sub.damage_dealt} HP`)
          setBattle(prev => prev ? {
            ...prev,
            p1_health: isP1 ? prev.p1_health - sub.damage_dealt : prev.p1_health,
            p2_health: !isP1 ? prev.p2_health - sub.damage_dealt : prev.p2_health,
          } : prev)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForfeit = async () => {
    if (!confirm('Forfeit this battle? You will lose MMR.')) return
    try { await battlesAPI.forfeit(roomCode); navigate('/arena') }
    catch { toast.error('Could not forfeit.') }
  }

  const handleLeaveRoom = async () => {
    if (!confirm('Leave this room? It will be deleted.')) return
    try { await battlesAPI.leaveRoom(roomCode); navigate('/arena') }
    catch { toast.error('Could not leave room.') }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast.success('Room code copied!')
  }

  if (loading || !battle) return <LoadingArena />

  const isP1        = battle.player1_profile?.username === user?.username
  const myProfile   = isP1 ? battle.player1_profile : battle.player2_profile
  const oppProfile  = isP1 ? battle.player2_profile : battle.player1_profile
  const myHealth    = isP1 ? battle.p1_health : battle.p2_health
  const oppHealth   = isP1 ? battle.p2_health : battle.p1_health
  const problem     = battle.problem_data
  const isOver      = battle.status === 'COMPLETED' || battle.status === 'DRAW'
  const iWon        = battle.winner_username === user?.username
  const isFrozen    = activeEffect?.type === 'freeze'
  const isMalfunctioning = activeEffect?.type === 'malfunction'

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const effectSecsLeft = activeEffect
    ? Math.max(0, Math.ceil((activeEffect.endsAt - Date.now()) / 1000))
    : 0

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 64, overflow: 'hidden',
      animation: screenShake ? 'battle-shake 0.3s infinite' : 'none',
    }}>

      {/* ── BATTLE HEADER ─────────────────────────────────────────────── */}
      <div style={headerStyles.bar}>
        <div style={headerStyles.playerSide}>
          <PlayerChip profile={myProfile} isYou health={myHealth} shielded={shielded} />
          <div style={{ flex: 1, maxWidth: 260 }}>
            <HealthBar current={myHealth} max={100} color="var(--cyan)" />
          </div>
        </div>

        <div style={headerStyles.center}>
          <Swords size={18} color={isOver ? (iWon ? 'var(--gold)' : 'var(--red)') : 'var(--cyan)'} />
          {battle.status === 'WAITING' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={headerStyles.statusText}>WAITING FOR OPPONENT...</div>
              <button onClick={copyRoomCode} style={{
                fontFamily: 'var(--font-code)', fontSize: 15, letterSpacing: 4,
                color: 'var(--cyan)', background: 'rgba(0,245,255,0.08)',
                border: '1px solid rgba(0,245,255,0.3)', borderRadius: 6,
                padding: '4px 14px', cursor: 'pointer',
              }} title="Click to copy">{roomCode} 📋</button>
              <button onClick={handleLeaveRoom} style={{
                fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1,
                color: 'var(--red)', background: 'transparent',
                border: '1px solid rgba(255,45,85,0.3)', borderRadius: 4,
                padding: '3px 10px', cursor: 'pointer',
              }}>✕ LEAVE ROOM</button>
            </div>
          ) : isOver ? (
            <div style={{ ...headerStyles.statusText, color: iWon ? 'var(--gold)' : 'var(--red)', fontSize: 15 }}>
              {iWon ? '🏆 VICTORY!' : '💀 DEFEATED'}
            </div>
          ) : (
            <div style={{
              ...headerStyles.timer,
              color: timeLeft < 60 ? 'var(--red)' : timeLeft < 300 ? 'var(--gold)' : 'var(--cyan)',
              animation: timeLeft < 30 ? 'pulse-glow 0.5s infinite' : 'none',
            }}>
              <Clock size={14} /> {formatTime(timeLeft)}
            </div>
          )}
          <div style={headerStyles.modeTag}>{battle.mode}</div>
        </div>

        <div style={{ ...headerStyles.playerSide, flexDirection: 'row-reverse' }}>
          {oppProfile ? (
            <>
              <PlayerChip profile={oppProfile} health={oppHealth} />
              <div style={{ flex: 1, maxWidth: 260 }}>
                <HealthBar current={oppHealth} max={100} color="var(--red)" reversed />
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.1em', animation: 'pulse-glow 1.5s infinite' }}>
              AWAITING CHALLENGER...
            </div>
          )}
        </div>
      </div>

      {/* ── TAB SWITCH WARNING ──────────────────────────────────────────── */}
      {showTabWarning && (
        <div style={{
          padding: '8px 20px', flexShrink: 0,
          background: tabWarnings >= 3 ? 'rgba(255,45,85,0.15)' : 'rgba(255,214,10,0.1)',
          borderBottom: `1px solid ${tabWarnings >= 3 ? 'var(--red)' : 'var(--gold)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'slideIn 0.2s ease',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
            color: tabWarnings >= 3 ? 'var(--red)' : 'var(--gold)',
          }}>
            {tabWarnings >= 3
              ? `🚨 TAB SWITCH #${tabWarnings} — Repeated violations may result in forfeit`
              : `⚠️ TAB SWITCH DETECTED — Warning ${tabWarnings}/3`}
          </span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: 11,
            color: tabWarnings >= 3 ? 'var(--red)' : 'var(--gold)' }}>
            {tabWarnings} violation{tabWarnings !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── ABILITY BAR ───────────────────────────────────────────────── */}
      {battle.status === 'IN_PROGRESS' && !isOver && (
        <AbilityBar
          energy={energy}
          cooldowns={cooldowns}
          onUse={useAbility}
          shielded={shielded}
          activeEffect={activeEffect}
          effectSecsLeft={effectSecsLeft}
        />
      )}

      {/* ── ACTIVE EFFECT BANNER ─────────────────────────────────────── */}
      {activeEffect && (
        <EffectBanner effect={activeEffect} secsLeft={effectSecsLeft} />
      )}

      {/* ── BATTLE BODY ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>

        {/* Left: Problem panel */}
        <div style={problemPanelStyles.panel}>
          <div style={problemPanelStyles.header}>
            <div style={{ flex: 1 }}>
              <span style={{ ...problemPanelStyles.diffTag, ...getDiffStyle(problem?.difficulty) }}>
                {problem?.difficulty}
              </span>
              <h2 style={problemPanelStyles.title}>{problem?.title || 'Loading...'}</h2>
            </div>
            <button onClick={() => setShowDesc(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {showDesc ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px 20px' }}>
            {showDesc && problem && (
              <>
                <div style={problemPanelStyles.desc} dangerouslySetInnerHTML={{ __html: markdownToHtml(problem.description) }} />
                {problem.examples?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={problemPanelStyles.sectionLabel}>EXAMPLES</div>
                    {problem.examples.slice(0, 2).map((ex, i) => (
                      <div key={i} style={problemPanelStyles.example}>
                        <div style={problemPanelStyles.exampleRow}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Input:</span>
                          <code style={problemPanelStyles.code}>{ex.input}</code>
                        </div>
                        <div style={problemPanelStyles.exampleRow}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Output:</span>
                          <code style={problemPanelStyles.code}>{ex.output}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={problemPanelStyles.constraint}>⏱ {problem.time_limit_ms}ms</span>
                  <span style={problemPanelStyles.constraint}>💾 {problem.memory_limit_mb}MB</span>
                </div>
              </>
            )}

            {submissions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={problemPanelStyles.sectionLabel}>BATTLE LOG</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {submissions.slice(0, 8).map((sub, i) => {
                    const v = VERDICTS[sub.verdict] || VERDICTS.PE
                    const VIcon = v.icon
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: v.bg, border: `1px solid ${v.color}20` }}>
                        <VIcon size={14} color={v.color} />
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: v.color, flex: 1 }}>{v.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.username}</span>
                        {sub.damage_dealt > 0 && <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-code)' }}>-{sub.damage_dealt} HP</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + console */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid var(--border-subtle)', position: 'relative' }}>

          {/* Freeze overlay */}
          {isFrozen && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'all',
              background: 'rgba(0, 30, 40, 0.6)',
              backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12,
              border: '2px solid var(--cyan)',
            }}>
              <Snowflake size={48} color="var(--cyan)" style={{ animation: 'spin 2s linear infinite' }} />
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', fontSize: 20, letterSpacing: 4 }}>
                FROZEN — {effectSecsLeft}s
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Editor toolbar */}
          <div style={editorStyles.toolbar}>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={editorStyles.langSelect}>
              {LANGUAGES.map(l => <option key={l.id} value={l.id} disabled={l.disabled}>{l.label}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {!isOver && battle.status === 'IN_PROGRESS' && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={handleForfeit}>
                    <Flag size={13} /> Forfeit
                  </button>
                  <button
                    className="btn btn-cyan btn-sm"
                    onClick={handleSubmit}
                    disabled={submitting || isOver || isFrozen}
                    style={{ minWidth: 120, justifyContent: 'center', opacity: isFrozen ? 0.4 : 1 }}
                  >
                    {submitting ? <><span style={{ animation: 'pulse-glow 0.5s infinite' }}>⚡</span> JUDGING...</> : <><Play size={13} /> SUBMIT</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden', filter: isMalfunctioning ? 'hue-rotate(90deg) contrast(1.3)' : 'none' }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={v => !isFrozen && !isMalfunctioning && setCode(v || '')}
              theme="clasher"
              options={{
                fontSize: 14,
                fontFamily: 'Share Tech Mono, monospace',
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                readOnly: isOver || isFrozen || isMalfunctioning,
                cursorStyle: 'line',
                smoothScrolling: true,
              }}
              beforeMount={monaco => {
                monaco.editor.defineTheme('clasher', {
                  base: 'vs-dark', inherit: true,
                  rules: [
                    { token: 'comment', foreground: '445566', fontStyle: 'italic' },
                    { token: 'keyword', foreground: '00f5ff' },
                    { token: 'string',  foreground: '00ff88' },
                    { token: 'number',  foreground: 'ffd60a' },
                  ],
                  colors: {
                    'editor.background': '#0a0a0f',
                    'editor.foreground': '#e8f4f8',
                    'editorLineNumber.foreground': '#334455',
                    'editorCursor.foreground': '#00f5ff',
                    'editor.selectionBackground': '#00f5ff20',
                    'editor.lineHighlightBackground': '#0f0f1a',
                  },
                })
              }}
            />
          </div>

          {/* Console */}
          <div style={editorStyles.console}>
            <button onClick={() => setShowConsole(v => !v)} style={editorStyles.consoleToggle}>
              <Terminal size={14} />
              <span>CONSOLE</span>
              {lastVerdict && (
                <span style={{ color: VERDICTS[lastVerdict]?.color, fontFamily: 'var(--font-display)', fontSize: 11, marginLeft: 8 }}>
                  {VERDICTS[lastVerdict]?.label}
                </span>
              )}
              {showConsole ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            {showConsole && (
              <div style={editorStyles.consoleBody}>
                {lastVerdict ? (() => {
                  const v = VERDICTS[lastVerdict]
                  const Icon = v.icon
                  return (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <Icon size={18} color={v.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: v.color, marginBottom: 4 }}>{v.label}</div>
                        {submissions[0]?.error_msg && (
                          <pre style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-code)' }}>
                            {submissions[0].error_msg}
                          </pre>
                        )}
                        {submissions[0] && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-code)' }}>
                            Tests: {submissions[0].test_cases_passed}/{submissions[0].test_cases_total} · {submissions[0].runtime_ms}ms
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })() : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Submit your code to see the verdict here.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hack overlay — show opponent's code */}
      {hackData && (
        <div style={{
          position: 'fixed', top: 80, right: 20, zIndex: 100,
          background: 'var(--dark-2)', border: '2px solid var(--gold)',
          borderRadius: 8, padding: 16, maxWidth: 360,
          boxShadow: '0 0 30px rgba(255,214,10,0.3)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', marginBottom: 8, letterSpacing: 1 }}>
            🔍 OPPONENT CODE — {Math.ceil((hackData.endsAt - Date.now()) / 1000)}s
          </div>
          <pre style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
            {hackData.code || '(empty)'}
          </pre>
        </div>
      )}

      {/* Victory/Defeat overlay */}
      {isOver && (
        <div style={overlayStyles.backdrop}>
          <div style={overlayStyles.panel}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{iWon ? '🏆' : '💀'}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: iWon ? 'var(--gold)' : 'var(--red)', letterSpacing: '0.15em', textShadow: `0 0 30px ${iWon ? 'var(--gold)' : 'var(--red)'}`, marginBottom: 8 }}>
              {iWon ? 'VICTORY!' : 'DEFEATED'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32 }}>
              {iWon ? `You solved it before ${oppProfile?.username}!` : `${battle.winner_username} solved it first.`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-cyan" onClick={() => navigate('/arena')}><Swords size={16} /> BATTLE AGAIN</button>
              <button className="btn btn-ghost" onClick={() => navigate('/leaderboard')}>VIEW RANKINGS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AbilityBar Component ─────────────────────────────────────────────────────
function AbilityBar({ energy, cooldowns, onUse, shielded, activeEffect }) {
  const now = Date.now()

  return (
    <div style={{
      background: 'var(--dark-2)', borderBottom: '1px solid var(--border-subtle)',
      padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
    }}>
      {/* Energy bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
        <Zap size={12} color="var(--gold)" />
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${energy}%`, borderRadius: 3,
            background: `linear-gradient(90deg, var(--gold), #ffaa00)`,
            boxShadow: '0 0 6px rgba(255,214,10,0.5)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--gold)', minWidth: 28 }}>
          {Math.floor(energy)}
        </span>
      </div>

      <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

      {/* Ability buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.values(ABILITIES).map(ability => {
          const Icon = ability.icon
          const cdEnd = cooldowns[ability.id] || 0
          const onCd = cdEnd > now
          const cdLeft = onCd ? Math.ceil((cdEnd - now) / 1000) : 0
          const noEnergy = energy < ability.cost
          const isShieldActive = ability.id === 'shield' && shielded
          const disabled = onCd || noEnergy || isShieldActive

          return (
            <div key={ability.id} style={{ position: 'relative' }} title={`${ability.desc} | Cost: ${ability.cost} ⚡ | CD: ${ability.cooldown}s`}>
              <button
                onClick={() => onUse(ability.id)}
                disabled={disabled}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 10px', minWidth: 64,
                  background: isShieldActive ? `${ability.color}22` : disabled ? 'var(--dark-3)' : `${ability.color}11`,
                  border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : ability.color + '44'}`,
                  borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  transition: 'all 0.15s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = ability.color }}
                onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = ability.color + '44' }}
              >
                {/* Cooldown overlay */}
                {onCd && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-muted)',
                    zIndex: 2,
                  }}>{cdLeft}s</div>
                )}
                <Icon size={16} color={isShieldActive ? ability.color : disabled ? 'var(--text-muted)' : ability.color} />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 8, letterSpacing: 0.5,
                  color: disabled ? 'var(--text-muted)' : ability.color,
                  whiteSpace: 'nowrap',
                }}>{ability.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                  {ability.cost}⚡
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Active effect indicator */}
      {activeEffect && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)', borderRadius: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--red)', letterSpacing: 1 }}>
            UNDER ATTACK
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Effect Banner ─────────────────────────────────────────────────────────────
function EffectBanner({ effect, secsLeft }) {
  const meta = {
    freeze:      { label: '❄️ FROZEN — Editor locked', color: 'var(--cyan)',   bg: 'rgba(0,245,255,0.08)' },
    malfunction: { label: '💀 MALFUNCTION — Code corrupted', color: '#b44fff', bg: 'rgba(180,79,255,0.08)' },
    timebomb:    { label: '💣 TIME BOMB — Brace yourself', color: '#ff6b35',   bg: 'rgba(255,107,53,0.08)' },
  }[effect.type]
  if (!meta) return null

  return (
    <div style={{
      padding: '6px 20px', background: meta.bg,
      borderBottom: `1px solid ${meta.color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: meta.color, letterSpacing: 1 }}>
        {meta.label}
      </span>
      <span style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: meta.color }}>{secsLeft}s</span>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function PlayerChip({ profile, isYou, health, shielded }) {
  if (!profile) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: isYou ? 'linear-gradient(135deg,var(--cyan-dim),var(--cyan))' : 'linear-gradient(135deg,var(--red-dim),var(--red))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 900, color: '#000',
        boxShadow: shielded ? '0 0 12px var(--green)' : 'none',
        border: shielded ? '2px solid var(--green)' : '2px solid transparent',
      }}>
        {profile.username?.[0]?.toUpperCase()}
      </div>
      {shielded && (
        <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--green)', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={8} color="#000" />
        </div>
      )}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {profile.username} {isYou && <span style={{ color: 'var(--cyan)', fontSize: 10 }}>YOU</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile.rank} · {profile.rating}</div>
      </div>
    </div>
  )
}

function LoadingArena() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Swords size={40} color="var(--cyan)" style={{ animation: 'pulse-glow 1s infinite', marginBottom: 16 }} />
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', letterSpacing: '0.2em' }}>LOADING BATTLE...</div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDiffStyle(diff) {
  const map = {
    EASY:   { color: 'var(--easy)',   border: '1px solid rgba(0,255,136,0.3)',  background: 'rgba(0,255,136,0.1)'  },
    MEDIUM: { color: 'var(--medium)', border: '1px solid rgba(255,214,10,0.3)', background: 'rgba(255,214,10,0.1)' },
    HARD:   { color: 'var(--hard)',   border: '1px solid rgba(255,107,53,0.3)', background: 'rgba(255,107,53,0.1)' },
    ELITE:  { color: 'var(--elite)',  border: '1px solid rgba(255,45,85,0.3)',  background: 'rgba(255,45,85,0.1)'  },
  }
  return map[diff] || map.EASY
}

function markdownToHtml(md = '') {
  return md
    .replace(/^## (.+)$/gm, '<h3 style="font-family:var(--font-display);font-size:14px;color:var(--cyan);margin:16px 0 8px;letter-spacing:0.08em">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:var(--dark-4);color:var(--cyan);padding:1px 6px;border-radius:2px;font-family:var(--font-code);font-size:13px">$1</code>')
    .replace(/\n/g, '<br/>')
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const headerStyles = {
  bar: { display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, background: 'var(--dark-2)', borderBottom: '1px solid var(--border-subtle)', height: 68, flexShrink: 0 },
  playerSide: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, minWidth: 110 },
  timer: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.1em' },
  statusText: { fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--text-muted)' },
  modeTag: { fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-muted)', padding: '2px 8px', border: '1px solid var(--border-subtle)' },
}

const problemPanelStyles = {
  panel: { display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--dark-1)', borderRight: '1px solid var(--border-subtle)' },
  header: { padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--dark-2)', flexShrink: 0 },
  title: { fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.06em', color: 'var(--text-primary)', marginTop: 6 },
  diffTag: { display: 'inline-block', padding: '2px 10px', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 },
  desc: { color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginTop: 14 },
  sectionLabel: { fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 8 },
  example: { background: 'var(--dark-3)', border: '1px solid var(--border-subtle)', padding: '10px', marginBottom: 6 },
  exampleRow: { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 },
  code: { fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--cyan)', whiteSpace: 'pre-wrap', flex: 1 },
  constraint: { fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--text-muted)', background: 'var(--dark-4)', padding: '3px 10px', border: '1px solid var(--border-subtle)' },
}

const editorStyles = {
  toolbar: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', background: 'var(--dark-2)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 },
  langSelect: { background: 'var(--dark-3)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '5px 10px', fontFamily: 'var(--font-code)', fontSize: 13, outline: 'none', cursor: 'pointer' },
  console: { borderTop: '1px solid var(--border-subtle)', background: 'var(--dark-2)', flexShrink: 0 },
  consoleToggle: { width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' },
  consoleBody: { padding: '10px 16px', maxHeight: 110, overflowY: 'auto', borderTop: '1px solid var(--border-subtle)' },
}

const overlayStyles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  panel: { textAlign: 'center', padding: '60px 80px', background: 'var(--dark-2)', border: '1px solid var(--border-normal)', maxWidth: 480, boxShadow: '0 0 80px rgba(0,245,255,0.1)', animation: 'fadeInUp 0.4s ease' },
}
