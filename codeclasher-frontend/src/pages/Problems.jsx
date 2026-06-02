import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { problemsAPI } from '../api'
import { Search, Filter, Code2, ChevronRight, Zap, Lock, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const DIFF_META = {
  EASY:   { color: '#00ff88', bg: 'rgba(0,255,136,0.08)',   label: 'EASY'   },
  MEDIUM: { color: '#ffd60a', bg: 'rgba(255,214,10,0.08)',  label: 'MEDIUM' },
  HARD:   { color: '#ff6b35', bg: 'rgba(255,107,53,0.08)',  label: 'HARD'   },
  ELITE:  { color: '#ff2d55', bg: 'rgba(255,45,85,0.08)',   label: 'ELITE'  },
}

function DiffTag({ diff }) {
  const m = DIFF_META[diff] || DIFF_META.EASY
  return (
    <span style={{
      background: m.bg, color: m.color, border: `1px solid ${m.color}44`,
      borderRadius: 4, padding: '2px 8px',
      fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1,
    }}>{m.label}</span>
  )
}

function ProblemRow({ problem, index }) {
  const diff = DIFF_META[problem.difficulty] || DIFF_META.EASY
  const solved = problem.user_solved

  return (
    <Link to={`/problems/${problem.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto',
        alignItems: 'center', gap: 16,
        padding: '16px 24px',
        background: solved ? 'rgba(0,255,136,0.02)' : 'var(--dark-2)',
        border: `1px solid ${solved ? 'rgba(0,255,136,0.12)' : 'var(--border-subtle)'}`,
        borderRadius: 8, marginBottom: 6,
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = diff.color + '44'
          e.currentTarget.style.transform = 'translateX(4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = solved ? 'rgba(0,255,136,0.12)' : 'var(--border-subtle)'
          e.currentTarget.style.transform = 'translateX(0)'
        }}>

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          {solved
            ? <CheckCircle2 size={16} color="var(--green)" />
            : <span style={{ fontFamily: 'var(--font-code)', fontSize: 12,
                color: 'var(--text-muted)' }}>{index + 1}</span>}
        </div>

        {/* Title + tags */}
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600,
            fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
            {problem.title}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(problem.tags || []).slice(0, 4).map(tag => (
              <span key={tag.id || tag} style={{
                fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)', borderRadius: 3,
                padding: '1px 6px',
              }}>{tag.name || tag}</span>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <DiffTag diff={problem.difficulty} />

        {/* Acceptance */}
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 12,
            color: diff.color }}>{problem.acceptance_rate || '--'}%</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>accept</div>
        </div>

        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </Link>
  )
}

function StatChip({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--dark-2)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '14px 20px', textAlign: 'center',
    }}>
      <div style={{ color: color || 'var(--cyan)', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18,
        color: 'var(--text-primary)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

export default function Problems() {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState([])
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const PAGE_SIZE = 20

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, page_size: PAGE_SIZE }
      if (search) params.search = search
      if (difficulty) params.difficulty = difficulty
      if (tag) params.tags = tag
      const res = await problemsAPI.list(params)
      const data = res.data
      setProblems(data.results || data)
      setCount(data.count || (data.results || data).length)
    } catch {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [search, difficulty, tag, page])

  useEffect(() => { fetchProblems() }, [fetchProblems])

  useEffect(() => {
    // Load tags
    problemsAPI.list({ page_size: 1 }).catch(() => {})
  }, [])

  const totalPages = Math.ceil(count / PAGE_SIZE)

  const diffCounts = {
    EASY:   problems.filter(p => p.difficulty === 'EASY').length,
    MEDIUM: problems.filter(p => p.difficulty === 'MEDIUM').length,
    HARD:   problems.filter(p => p.difficulty === 'HARD').length,
    ELITE:  problems.filter(p => p.difficulty === 'ELITE').length,
  }
  const solved = problems.filter(p => p.user_solved).length

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Code2 size={24} color="var(--cyan)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20,
            color: 'var(--text-primary)', letterSpacing: 2 }}>PROBLEM VAULT</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Sharpen your skills. Master the battlefield. Each problem is a weapon.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatChip icon={<CheckCircle2 size={18}/>} label="Solved" value={solved} color="var(--green)"/>
        <StatChip icon={<Zap size={18}/>} label="Easy" value={diffCounts.EASY} color="var(--green)"/>
        <StatChip icon={<Clock size={18}/>} label="Medium" value={diffCounts.MEDIUM} color="var(--gold)"/>
        <StatChip icon={<Lock size={18}/>} label="Hard/Elite"
          value={diffCounts.HARD + diffCounts.ELITE} color="var(--red)"/>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search problems..."
            style={{
              width: '100%', padding: '11px 14px 11px 38px',
              background: 'var(--dark-2)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              fontFamily: 'var(--font-body)', outline: 'none',
            }}
          />
        </div>

        {/* Filter toggle */}
        <button onClick={() => setShowFilters(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', background: showFilters ? 'var(--cyan)' : 'var(--dark-2)',
          border: `1px solid ${showFilters ? 'var(--cyan)' : 'var(--border-subtle)'}`,
          borderRadius: 8, cursor: 'pointer',
          color: showFilters ? '#000' : 'var(--text-secondary)', fontSize: 12,
          fontFamily: 'var(--font-display)', letterSpacing: 1,
        }}>
          <Filter size={14}/> FILTER
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{
          background: 'var(--dark-2)', border: '1px solid var(--border-normal)',
          borderRadius: 10, padding: '16px 20px', marginBottom: 16,
          display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Difficulty filter */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
              letterSpacing: 1, marginBottom: 8 }}>DIFFICULTY</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['', 'EASY', 'MEDIUM', 'HARD', 'ELITE'].map(d => {
                const meta = d ? DIFF_META[d] : null
                const active = difficulty === d
                return (
                  <button key={d} onClick={() => { setDifficulty(d); setPage(1) }} style={{
                    padding: '5px 12px', border: `1px solid ${active && meta ? meta.color + '66' : 'var(--border-subtle)'}`,
                    borderRadius: 5, cursor: 'pointer',
                    background: active ? (meta ? meta.bg : 'rgba(0,245,255,0.08)') : 'transparent',
                    color: active ? (meta ? meta.color : 'var(--cyan)') : 'var(--text-secondary)',
                    fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1,
                  }}>{d || 'ALL'}</button>
                )
              })}
            </div>
          </div>

          {/* Clear */}
          {(difficulty || tag || search) && (
            <button onClick={() => { setDifficulty(''); setTag(''); setSearch(''); setPage(1) }}
              style={{ padding: '6px 14px', background: 'rgba(255,45,85,0.1)',
                border: '1px solid var(--red)', borderRadius: 6, cursor: 'pointer',
                color: 'var(--red)', fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1,
                marginLeft: 'auto',
              }}>CLEAR FILTERS</button>
          )}
        </div>
      )}

      {/* ── Problem list ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36,
            border: '2px solid var(--cyan)', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : problems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Code2 size={40} style={{ marginBottom: 12, opacity: 0.3 }}/>
          <p>No problems found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto',
            gap: 16, padding: '0 24px 8px',
            fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)',
            letterSpacing: 1, borderBottom: '1px solid var(--border-subtle)', marginBottom: 8 }}>
            <span>#</span>
            <span>TITLE</span>
            <span>DIFFICULTY</span>
            <span style={{ textAlign: 'right' }}>ACCEPTANCE</span>
            <span/>
          </div>

          {problems.map((p, i) => (
            <ProblemRow key={p.id || p.slug} problem={p} index={i + (page - 1) * PAGE_SIZE} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 36, height: 36, border: `1px solid ${page === p ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  background: page === p ? 'var(--cyan)' : 'var(--dark-2)',
                  color: page === p ? '#000' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)', fontSize: 11,
                }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
