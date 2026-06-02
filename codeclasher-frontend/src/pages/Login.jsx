import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Swords, Eye, EyeOff, Zap } from 'lucide-react'

function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={layoutStyles.page}>
      <div style={layoutStyles.orb1} />
      <div style={layoutStyles.orb2} />

      <div style={layoutStyles.card}>
        {/* Corner accents */}
        <div style={layoutStyles.cornerTL} />
        <div style={layoutStyles.cornerBR} />

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={layoutStyles.logo}>
            <Swords size={22} />
          </div>
          <h1 style={layoutStyles.title}>{title}</h1>
          <p style={layoutStyles.subtitle}>{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  )
}

const layoutStyles = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '80px 24px 40px',
    position: 'relative', overflow: 'hidden',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.04), transparent 60%)',
  },
  orb1: {
    position: 'fixed', top: '10%', left: '10%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,245,255,0.06), transparent)',
    filter: 'blur(60px)', pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '10%', right: '10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(180,79,255,0.06), transparent)',
    filter: 'blur(60px)', pointerEvents: 'none',
  },
  card: {
    width: '100%', maxWidth: 440,
    padding: '48px 40px',
    background: 'var(--dark-2)',
    border: '1px solid var(--border-subtle)',
    position: 'relative',
    boxShadow: '0 0 60px rgba(0,245,255,0.05)',
    animation: 'fadeInUp 0.5s ease',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 30, height: 3, background: 'var(--cyan)',
    boxShadow: '0 0 10px var(--cyan)',
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 3, background: 'var(--purple)',
    boxShadow: '0 0 10px var(--purple)',
  },
  logo: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px', color: '#000',
    boxShadow: '0 0 30px rgba(0,245,255,0.3)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 22, letterSpacing: '0.15em',
    color: 'var(--text-primary)', marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, color: 'var(--text-muted)',
  },
}

// ─── Shared form field ─────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, children }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={fieldStyles.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={fieldStyles.input}
          onFocus={e => { e.target.style.borderColor = 'var(--cyan)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,245,255,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={fieldStyles.eyeBtn}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

const fieldStyles = {
  label: {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontSize: 11, letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
    marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    width: '100%', padding: '11px 14px',
    background: 'var(--dark-3)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontSize: 15, fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back, warrior!')
      navigate('/arena')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="ENTER THE ARENA" subtitle="Log in to continue your battle journey">
      <form onSubmit={handleSubmit}>
        <Field label="Username" value={form.username} onChange={set('username')} placeholder="your_handle" />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />

        <button
          type="submit" disabled={loading}
          className="btn btn-cyan"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        >
          {loading ? 'AUTHENTICATING...' : <><Zap size={15} /> LOGIN</>}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 14 }}>
        New to the arena?{' '}
        <Link to="/register" style={{ color: 'var(--cyan)' }}>Create account</Link>
      </p>
    </AuthLayout>
  )
}
