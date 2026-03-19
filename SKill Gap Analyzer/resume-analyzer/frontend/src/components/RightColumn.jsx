import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{
        fontSize: 10, letterSpacing: '2.5px', color: '#7a6090',
        textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap',
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,0.25), transparent)' }} />
    </div>
  )
}

export default function RightColumn({ mobile, onClose }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setHistLoading(true)
    api.get(`/api/analyses/${user.id}`)
      .then(r => setHistory(r.data?.slice(0, 10) ?? [])) // Show more in the new history panel
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [user])

  const handleHistItem = (item) => {
    addToast('Loading previous analysis...', 'info')
    if (onClose) onClose()
    navigate(`/results/${item.id}`)
  }

  const columnStyle = {
    background: mobile ? 'transparent' : 'rgba(10,4,22,0.55)',
    backdropFilter: mobile ? 'none' : 'blur(20px)',
    WebkitBackdropFilter: mobile ? 'none' : 'blur(20px)',
    borderLeft: mobile ? 'none' : '1px solid rgba(201,168,76,0.08)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    height: '100%',
    boxSizing: 'border-box'
  }

  const itemStyle = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(201,168,76,0.07)',
    borderRadius: '10px',
    padding: '12px 14px',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }

  return (
    <div style={columnStyle}>
      {mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Cinzel', color: '#c9a84c' }}>ANALYSIS HISTORY</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a88b8', fontSize: 20 }}>✕</button>
        </div>
      )}

      {!mobile && <SectionTitle>ANALYSIS HISTORY</SectionTitle>}

      {!user ? (
        <p style={{ color: '#6a5880', fontSize: 12, textAlign: 'center' }}>Sign in to see history</p>
      ) : histLoading ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}><span style={{ color: '#c9a84c' }}>Loading...</span></div>
      ) : history.length === 0 ? (
        <p style={{ color: '#6a5880', fontSize: 12, textAlign: 'center' }}>No history yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {history.map((item, i) => (
            <div
              key={item.id || i}
              style={itemStyle}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.07)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
              }}
              onClick={() => handleHistItem(item)}
            >
              <div style={{ color: '#c8b8e8', fontSize: 13, fontWeight: 500 }}>{item.target_role}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6a5880', fontSize: 10 }}>{fmtDate(item.created_at)}</span>
                <span style={{ 
                  color: item.ats_score > 74 ? '#5eead4' : item.ats_score > 49 ? '#fbbf24' : '#f87171', 
                  fontSize: 11, 
                  fontWeight: 600 
                }}>
                  {item.ats_score}
                </span>
              </div>
            </div>
          ))}
          <Link to="/history" onClick={onClose} style={{ display: 'block', textAlign: 'right', marginTop: 12, color: '#c9a84c', fontSize: 11, textDecoration: 'none' }}>View All →</Link>
        </div>
      )}
    </div>
  )
}
