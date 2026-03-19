import { useToast } from '../context/ToastContext'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── Shared design tokens (same as LoginPage) ────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0612',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(201,168,76,0.12)',
    borderRadius: '18px',
    padding: '40px 36px 36px',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)',
  },
  logo: {
    fontFamily: "'Cinzel', serif",
    fontSize: '20px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #c9a84c, #f5d98b, #a07830)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center',
    marginBottom: '28px',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
  },
  dot: {
    width: '6px', height: '6px',
    borderRadius: '50%',
    background: '#c9a84c',
    display: 'inline-block',
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: '22px',
    fontWeight: 700,
    color: '#e8e0f0',
    textAlign: 'center',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#9a88b8',
    textAlign: 'center',
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#c9a84c',
    marginBottom: '7px',
    letterSpacing: '0.4px',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(201,168,76,0.15)',
    borderRadius: '10px',
    color: '#e8e0f0',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    padding: '11px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  fieldWrap: { marginBottom: '18px' },
  btn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #4a1a8a, #7b2ff7)',
    border: '1px solid rgba(201,168,76,0.35)',
    borderRadius: '10px',
    color: '#f5d98b',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 28px rgba(107,47,192,0.4)',
    transition: 'opacity 0.2s, transform 0.2s',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  linkRow: {
    textAlign: 'center',
    marginTop: '22px',
    fontSize: '13px',
    color: '#9a88b8',
  },
  link: { color: '#c9a84c', textDecoration: 'none', fontWeight: 500 },
  error: {
    marginTop: '14px',
    padding: '10px 14px',
    borderRadius: '9px',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.25)',
    color: '#f87171',
    fontSize: '13px',
    textAlign: 'center',
  },
  success: {
    marginTop: '14px',
    padding: '10px 14px',
    borderRadius: '9px',
    background: 'rgba(94,234,212,0.08)',
    border: '1px solid rgba(94,234,212,0.25)',
    color: '#5eead4',
    fontSize: '13px',
    textAlign: 'center',
  },
}

function Spinner() {
  return (
    <div style={{
      width: '16px', height: '16px',
      borderRadius: '50%',
      border: '2px solid rgba(245,217,139,0.3)',
      borderTopColor: '#f5d98b',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

export default function SignupPage() {
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, signUp } = useAuth()
  const navigate = useNavigate()

  // Set page title
  useEffect(() => {
    document.title = "Sign Up — ResumeAI"
  }, [])

  // Redirect if already logged in
  useEffect(() => { if (user) navigate('/') }, [user, navigate])

  const validate = () => {
    if (!email.includes('@')) { setError('Please enter a valid email address'); return false }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return false }
    if (password !== confirm) { setError('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!validate()) return

    setLoading(true)
    const { data: { user: newUser }, error: err } = await signUp(email, password)
    setLoading(false)

    if (err) { 
      setError(err.message)
      addToast(err.message, 'error')
      return 
    }

    if (newUser?.identities?.length === 0) {
      setError('An account with this email already exists.')
      addToast('An account with this email already exists.', 'error')
      return
    }

    setSuccess('Account created! Check your email to confirm, then sign in.')
    addToast('Account created successfully!', 'success')
    setTimeout(() => navigate('/login'), 3000)
  }

  const focusInput = e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'
  const blurInput  = e => e.target.style.borderColor = 'rgba(201,168,76,0.15)'

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } ::placeholder { color: #6a5880; }`}</style>
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.shimmer} />

          {/* Logo */}
          <div style={s.logo}>
            RESUME <span style={s.dot} /> AI
          </div>

          <h1 style={s.title}>Create Your Account</h1>
          <p style={s.subtitle}>Start analyzing your resume with AI</p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={s.fieldWrap}>
              <label style={s.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                placeholder="you@email.com"
                onChange={e => setEmail(e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                style={s.input}
              />
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                placeholder="••••••••"
                onChange={e => setPassword(e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                style={s.input}
              />
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label} htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                placeholder="••••••••"
                onChange={e => setConfirm(e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                style={s.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={s.btn}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading && <Spinner />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {error   && <div style={s.error}>{error}</div>}
          {success && <div style={s.success}>{success}</div>}

          <div style={s.linkRow}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign In</Link>
          </div>
        </div>
      </div>
    </>
  )
}
