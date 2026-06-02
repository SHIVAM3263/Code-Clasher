import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { problemsAPI } from '../api'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Play, Clock, MemoryStick, CheckCircle,
  XCircle, AlertTriangle, Zap, Code2, ChevronDown, ChevronUp
} from 'lucide-react'

const DIFF_META = {
  EASY:   { color: '#00ff88', bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.25)'  },
  MEDIUM: { color: '#ffd60a', bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.25)' },
  HARD:   { color: '#ff6b35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.25)' },
  ELITE:  { color: '#ff2d55', bg: 'rgba(255,45,85,0.08)',  border: 'rgba(255,45,85,0.25)'  },
}

const VERDICTS = {
  AC:  { label: 'ACCEPTED',            color: '#00ff88', icon: CheckCircle  },
  WA:  { label: 'WRONG ANSWER',        color: '#ff2d55', icon: XCircle      },
  TLE: { label: 'TIME LIMIT EXCEEDED', color: '#ffd60a', icon: Clock        },
  RE:  { label: 'RUNTIME ERROR',       color: '#ff2d55', icon: XCircle      },
  CE:  { label: 'COMPILE ERROR',       color: '#ff2d55', icon: AlertTriangle},
  MLE: { label: 'MEMORY LIMIT',        color: '#ff6b35', icon: AlertTriangle},
}

function markdownToHtml(md = '') {
  return md
    .replace(/^## (.+)$/gm, '<h3 style="font-family:var(--font-display);font-size:14px;color:var(--cyan);margin:20px 0 8px;letter-spacing:0.08em">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,245,255,0.08);color:var(--cyan);padding:1px 6px;border-radius:3px;font-family:var(--font-code);font-size:13px">$1</code>')
    .replace(/\n/g, '<br/>')
}

export default function ProblemDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [problem, setProblem]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [code, setCode]             = useState('')
  const [running, setRunning]       = useState(false)
  const [result, setResult]         = useState(null)
  const [showConsole, setShowConsole] = useState(true)
  const [activeTab, setActiveTab]   = useState('description')

  useEffect(() => {
    problemsAPI.detail(slug)
      .then(({ data }) => {
        setProblem(data)
        setCode(data.starter_code?.python || '# Write your solution here\n')
      })
      .catch(() => { toast.error('Problem not found'); navigate('/problems') })
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const handleRun = async () => {
    if (!code.trim()) { toast.error('Write some code first!'); return }
    setRunning(true)
    setResult(null)
    try {
      const { data } = await problemsAPI.run(slug, { code, language: 'python' })
      setResult(data)
      setShowConsole(true)
      if (data.verdict === 'AC') {
        toast.success('✅ All test cases passed!')
      } else {
        toast.error(`${VERDICTS[data.verdict]?.label || data.verdict}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Execution failed.')
    } finally {
      setRunning(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', letterSpacing: 2, animation: 'pulse-glow 1s infinite' }}>
        LOADING...
      </div>
    </div>
  )

  if (!problem) return null

  const diff = DIFF_META[problem.difficulty] || DIFF_META.EASY

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 64, overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 20px', background: 'var(--dark-2)',
        borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
      }}>
        <Link to="/problems" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13,
          fontFamily: 'var(--font-display)', letterSpacing: 1,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={16} /> PROBLEMS
        </Link>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        <span style={{
          padding: '3px 10px', borderRadius: 4, fontSize: 10,
          fontFamily: 'var(--font-display)', letterSpacing: 1,
          color: diff.color, background: diff.bg, border: `1px solid ${diff.border}`,
        }}>{problem.difficulty}</span>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 1,
          color: 'var(--text-primary)',
        }}>{problem.title}</h1>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <Clock size={13} /> {problem.time_limit_ms}ms
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <Code2 size={13} /> {problem.memory_limit_mb}MB
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>

        {/* Left: Problem info */}
        <div style={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--dark-1)', borderRight: '1px solid var(--border-subtle)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--dark-2)', flexShrink: 0,
          }}>
            {['description', 'examples', 'tags'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '10px 18px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 10,
                letterSpacing: 1, textTransform: 'uppercase',
                color: activeTab === t ? 'var(--cyan)' : 'var(--text-muted)',
                borderBottom: activeTab === t ? '2px solid var(--cyan)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {activeTab === 'description' && (
              <div
                style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(problem.description) }}
              />
            )}

            {activeTab === 'examples' && (
              <div>
                {(problem.examples || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No examples available.</p>
                ) : (
                  (problem.examples || []).map((ex, i) => (
                    <div key={i} style={{
                      background: 'var(--dark-3)', border: '1px solid var(--border-subtle)',
                      borderRadius: 8, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>
                        EXAMPLE {i + 1}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Input</span>
                        <pre style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--cyan)', background: 'var(--dark-4)', padding: '8px 12px', borderRadius: 4, marginTop: 4 }}>
                          {ex.input}
                        </pre>
                      </div>
                      <div style={{ marginBottom: ex.explanation ? 8 : 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Output</span>
                        <pre style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: '#00ff88', background: 'var(--dark-4)', padding: '8px 12px', borderRadius: 4, marginTop: 4 }}>
                          {ex.output}
                        </pre>
                      </div>
                      {ex.explanation && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
                          {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'tags' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(problem.tags || []).map(tag => (
                  <span key={tag.id || tag} style={{
                    padding: '6px 14px', borderRadius: 6,
                    background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.2)',
                    color: 'var(--cyan)', fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 1,
                  }}>{tag.name || tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + console */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', background: 'var(--dark-2)',
            borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--text-muted)' }}>Python 3</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={handleRun} disabled={running} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 20px', background: running ? 'var(--dark-3)' : 'var(--cyan)',
                border: 'none', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer',
                color: running ? 'var(--text-muted)' : '#000',
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
                fontWeight: 900, transition: 'all 0.15s',
              }}>
                {running
                  ? <><Zap size={13} style={{ animation: 'pulse-glow 0.5s infinite' }} /> RUNNING...</>
                  : <><Play size={13} /> RUN CODE</>}
              </button>
            </div>
          </div>

          {/* Monaco */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language="python"
              value={code}
              onChange={v => setCode(v || '')}
              theme="clasher"
              options={{
                fontSize: 14,
                fontFamily: 'Share Tech Mono, monospace',
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
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
          <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--dark-2)', flexShrink: 0 }}>
            <button onClick={() => setShowConsole(v => !v)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
            }}>
              <Code2 size={14} />
              CONSOLE
              {result && (
                <span style={{
                  marginLeft: 8, color: VERDICTS[result.verdict]?.color || 'var(--cyan)',
                  fontFamily: 'var(--font-display)', fontSize: 11,
                }}>
                  {VERDICTS[result.verdict]?.label || result.verdict}
                </span>
              )}
              <span style={{ marginLeft: 'auto' }}>
                {showConsole ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
              </span>
            </button>

            {showConsole && (
              <div style={{ padding: '12px 16px', maxHeight: 160, overflowY: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
                {result ? (() => {
                  const v = VERDICTS[result.verdict]
                  const Icon = v?.icon || Zap
                  return (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <Icon size={18} color={v?.color || 'var(--cyan)'} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: v?.color || 'var(--cyan)', marginBottom: 6 }}>
                          {v?.label || result.verdict}
                        </div>
                        <div style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--text-muted)' }}>
                          Tests passed: {result.test_cases_passed ?? '?'} / {result.test_cases_total ?? '?'}
                          {result.runtime_ms != null && ` · ${result.runtime_ms}ms`}
                        </div>
                        {result.error_msg && (
                          <pre style={{ marginTop: 8, fontFamily: 'var(--font-code)', fontSize: 12, color: '#ff6b35', whiteSpace: 'pre-wrap' }}>
                            {result.error_msg}
                          </pre>
                        )}
                        {result.stdout && (
                          <pre style={{ marginTop: 8, fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {result.stdout}
                          </pre>
                        )}
                      </div>
                    </div>
                  )
                })() : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Run your code to see results here.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
