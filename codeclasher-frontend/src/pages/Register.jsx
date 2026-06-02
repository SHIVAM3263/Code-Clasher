import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Swords, Eye, EyeOff, Zap, Shield } from 'lucide-react'

function Field({ label, type = 'text', value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ width: '100%', padding: '10px 14px', background: 'var(--dark-3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', first_name: '', last_name: '' })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { toast.error('Passwords do not match!'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Now enter the arena.')
      navigate('/login')
    } catch (err) {
      const errs = err.response?.data
      if (errs) Object.values(errs).flat().forEach(msg => toast.error(msg))
      else toast.error('Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px', background: 'radial-gradient(ellipse at 50% 0%, rgba(180,79,255,0.04), transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '44px 40px', background: 'var(--dark-2)', border: '1px solid var(--border-subtle)', position: 'relative', boxShadow: '0 0 60px rgba(180,79,255,0.05)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 3, background: 'var(--purple)', boxShadow: '0 0 10px var(--purple)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 3, background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }} />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#000', boxShadow: '0 0 30px rgba(180,79,255,0.3)' }}>
            <Shield size={22} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.15em', color: 'var(--text-primary)', marginBottom: 6 }}>CREATE YOUR WARRIOR</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Join the arena and start your battle journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Field label="First Name" value={form.first_name} onChange={set('first_name')} placeholder="John" />
            <Field label="Last Name" value={form.last_name} onChange={set('last_name')} placeholder="Doe" />
          </div>
          <Field label="Username *" value={form.username} onChange={set('username')} placeholder="epic_coder_99" hint="This is your battle handle — choose wisely." />
          <Field label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="you@arena.gg" />
          <Field label="Password *" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" hint="Minimum 8 characters." />
          <Field label="Confirm Password *" type="password" value={form.password2} onChange={set('password2')} placeholder="••••••••" />

          <button type="submit" disabled={loading} className="btn btn-purple" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            {loading ? 'CREATING WARRIOR...' : <><Zap size={15} /> CREATE ACCOUNT</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 14 }}>
          Already a warrior?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)' }}>Login here</Link>
        </p>
      </div>
    </div>
  )
}
