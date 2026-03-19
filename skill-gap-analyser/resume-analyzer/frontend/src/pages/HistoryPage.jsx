import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import CrownDivider from '../components/CrownDivider'
import api from '../lib/api'

/* ── Inline Helpers ──────────────────────────────────────────────── */
const scoreStyles = (s) => {
    if (s >= 75) return { color: '#5eead4', bg: 'rgba(94,234,212,0.12)' }
    if (s >= 50) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
    return { color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
}

const fmtFullDate = (iso) => {
    return new Date(iso).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    })
}

function Spinner({ size = 40, color = '#c9a84c' }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `3px solid ${color}33`, borderTopColor: color,
            animation: 'hspin 1.2s linear infinite'
        }} />
    )
}

/* ════════════════════════════════════════════════════════════════ */
/*  HISTORY PAGE                                                    */
/* ════════════════════════════════════════════════════════════════ */

export default function HistoryPage() {
    const { user } = useAuth()
    const { addToast } = useToast()
    const navigate = useNavigate()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        document.title = "Your History — ResumeAI"
        if (user?.id) {
            fetchHistory()
        }
    }, [user])

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/api/analyses/${user.id}`)
            setHistory(res.data || []) // API returns array directly based on recent work
        } catch (err) {
            console.error('Failed to fetch history', err)
            addToast('Failed to load history.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = (analysisId, shouldOpenChat = false) => {
        addToast('Loading analysis...', 'info')
        navigate(`/results/${analysisId}`, shouldOpenChat ? { state: { openChat: true } } : {})
    }

    const goldText = { background: 'linear-gradient(135deg, #c9a84c, #f5d98b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }

    return (
        <div style={{ padding: '60px 20px', minHeight: 'calc(100vh - 66px)', position: 'relative' }}>
            <style>{`
                @keyframes hspin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .history-header { text-align: center; }
                    .history-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
            
            {/* Header */}
            <div className="history-header" style={{ maxWidth: 1200, margin: '0 auto 40px' }}>
                <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, fontWeight: 700, ...goldText, marginBottom: 8 }}>
                    Your Resume History
                </h1>
                <p style={{ color: '#9a88b8', fontSize: 15 }}>
                    Select any analysis to continue your coaching session
                </p>
                <div style={{ marginTop: 24 }}>
                    <CrownDivider />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                    <Spinner />
                    <span style={{ marginTop: 20, color: '#c9a84c', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>LOADING HISTORY...</span>
                </div>
            ) : history.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
                    <div style={{ fontSize: 32, marginBottom: 20, opacity: 0.6 }}>✦</div>
                    <div style={{ fontFamily: 'Cinzel, serif', color: '#c9a84c', fontSize: 20, marginBottom: 8 }}>No analyses yet</div>
                    <div style={{ color: '#6a5880', fontSize: 14, marginBottom: 32 }}>Upload your resume to get started</div>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #4a1a8a, #7b2ff7)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, color: '#f5d98b', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        ✦ New Analysis
                    </button>
                </div>
            ) : (
                <div className="history-grid" style={{ 
                    maxWidth: 1200, margin: '0 auto', 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 
                }}>
                    {history.map(item => {
                        const ss = scoreStyles(item.ats_score || 0)
                        return (
                            <div key={item.id} className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 700, ...goldText, maxWidth: '70%', lineHeight: 1.3 }}>
                                        {item.target_role}
                                    </div>
                                    <div style={{ 
                                        padding: '5px 12px', borderRadius: 20,
                                        background: ss.bg, border: `1px solid ${ss.color}44`,
                                        color: ss.color, fontSize: 12, fontWeight: 800
                                    }}>
                                        {item.ats_score}%
                                    </div>
                                </div>

                                <CrownDivider />

                                <div style={{ color: '#6a5880', fontSize: 12, marginBottom: 32, fontWeight: 500 }}>
                                    Analyzed on {fmtFullDate(item.created_at)}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 'auto' }}>
                                    <button 
                                        onClick={() => handleAction(item.id)}
                                        style={{ padding: '12px', background: 'linear-gradient(135deg, #4a1a8a, #7b2ff7)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, color: '#f5d98b', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        Results
                                    </button>
                                    <button 
                                        onClick={() => handleAction(item.id, true)}
                                        style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, color: '#c9a84c', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    >
                                        Open Coach
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
