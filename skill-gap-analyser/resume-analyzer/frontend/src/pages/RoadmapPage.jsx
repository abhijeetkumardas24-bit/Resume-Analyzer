import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import CrownDivider from '../components/CrownDivider'
import api from '../lib/api'

/* ── Styled Helpers ─────────────────────────────────────────────── */
const typeBadge = (type) => {
    const s = { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }
    switch (type.toLowerCase()) {
        case 'video': return { ...s, background: 'rgba(123,47,247,0.15)', color: '#c8b8e8' }
        case 'course': return { ...s, background: 'rgba(201,168,76,0.15)', color: '#f5d98b' }
        case 'article': return { ...s, background: 'rgba(94,234,212,0.15)', color: '#5eead4' }
        default: return { ...s, background: 'rgba(255,255,255,0.1)', color: '#9a88b8' }
    }
}

function Spinner({ size = 44, color = '#c9a84c' }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `3px solid ${color}33`, borderTopColor: color,
            animation: 'rspin 1s linear infinite'
        }} />
    )
}

/* ════════════════════════════════════════════════════════════════ */
/*  ROADMAP PAGE                                                    */
/* ════════════════════════════════════════════════════════════════ */

export default function RoadmapPage() {
    const { user } = useAuth()
    const { addToast } = useToast()
    const navigate = useNavigate()
    const [roadmap, setRoadmap] = useState(null)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState({}) // { blockIndex: boolean }
    const [targetRole, setTargetRole] = useState('')

    useEffect(() => {
        document.title = "Learning Roadmap — ResumeAI"
        const saved = localStorage.getItem('analysisResult')
        if (!saved) {
            navigate('/', { state: { msg: "Please analyze your resume first." } })
            return
        }

        try {
            const data = JSON.parse(saved)
            if (!data.missing_skills || !data.target_role) {
                navigate('/')
                return
            }

            setTargetRole(data.target_role)
            fetchRoadmap(data.missing_skills, data.target_role)

            const savedProgress = localStorage.getItem('roadmapProgress')
            if (savedProgress) setProgress(JSON.parse(savedProgress))
        } catch (e) {
            navigate('/')
        }
    }, [navigate])

    const fetchRoadmap = async (skills, role) => {
        setLoading(true)
        try {
            const res = await api.post('/api/roadmap', {
                missing_skills: skills,
                target_role: role,
                user_id: user?.id || 'guest'
            })
            setRoadmap(res.data)
            addToast('Roadmap generated!', 'success')
        } catch (err) {
            console.error('Failed to fetch roadmap', err)
            addToast('Failed to generate roadmap.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const toggleComplete = (idx) => {
        const newProgress = { ...progress, [idx]: !progress[idx] }
        setProgress(newProgress)
        localStorage.setItem('roadmapProgress', JSON.stringify(newProgress))
        if (!progress[idx]) addToast('Milestone completed!', 'success')
    }

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 66px)' }}>
            <style>{`@keyframes rspin { to { transform: rotate(360deg); } }`}</style>
            <Spinner />
            <p style={{ marginTop: 24, color: '#c9a84c', letterSpacing: 2, fontSize: 13, fontWeight: 600 }}>CRAFTING YOUR 90-DAY ROADMAP...</p>
        </div>
    )

    if (!roadmap) return null

    const completedCount = Object.values(progress).filter(Boolean).length
    const totalBlocks = roadmap.roadmap.length
    const completionPercent = (completedCount / totalBlocks) * 100
    const goldText = { background: 'linear-gradient(135deg, #c9a84c, #f5d98b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }

    return (
        <div style={{ padding: '40px 20px', maxWidth: 940, margin: '0 auto', position: 'relative' }}>
            <style>{`
                @media (max-width: 768px) {
                    .roadmap-header { flex-direction: column; text-align: center; gap: 16px; }
                    .roadmap-progress { width: 100% !important; text-align: center !important; }
                    .timeline-container { padding-left: 20px !important; }
                    .timeline-line { left: 26px !important; }
                    .timeline-dot { left: 20px !important; }
                    .timeline-week { position: static !important; width: 100% !important; text-align: left !important; margin-bottom: 12px; }
                    .roadmap-card { margin-left: 20px !important; padding: 20px !important; }
                    .resource-row { flex-direction: column; align-items: flex-start !important; gap: 8px !important; }
                }
            `}</style>

            {/* Header Card */}
            <div className="glass-card" style={{ padding: '32px', marginBottom: 48, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />

                <div className="roadmap-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, fontWeight: 700, ...goldText, marginBottom: 12 }}>
                            The 90-Day Blueprint
                        </h1>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, padding: '4px 12px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 20, color: '#c9a84c', fontWeight: 600 }}>
                                {targetRole}
                            </span>
                            <span style={{ fontSize: 10, padding: '4px 12px', background: 'rgba(123,47,247,0.12)', border: '1px solid rgba(123,47,247,0.2)', borderRadius: 20, color: '#c8b8e8', fontWeight: 600, textTransform: 'uppercase' }}>
                                ~{roadmap.total_estimated_hours} Hours Content
                            </span>
                        </div>
                    </div>

                    <div className="roadmap-progress" style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6a5880', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>
                            {completedCount} of {totalBlocks} Completed
                        </div>
                        <div style={{ width: 160, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', marginLeft: 'auto' }}>
                            <div style={{ height: '100%', width: `${completionPercent}%`, background: 'linear-gradient(90deg, #7b2ff7, #f5d98b)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                    </div>
                </div>
            </div>

            <CrownDivider />

            {/* Vertical Timeline */}
            <div className="timeline-container" style={{ position: 'relative', paddingLeft: 100, marginTop: 48 }}>
                <div className="timeline-line" style={{ position: 'absolute', left: 106, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, rgba(201,168,76,0.3), rgba(201,168,76,0.05))' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                    {roadmap.roadmap.map((block, idx) => {
                        const isDone = progress[idx]
                        return (
                            <div key={idx} style={{ position: 'relative' }}>
                                <div className="timeline-week" style={{ position: 'absolute', left: -95, top: 12, width: 80, textAlign: 'right', fontFamily: 'Cinzel, serif', fontSize: 11, color: '#c9a84c', letterSpacing: 1.5, fontWeight: 700 }}>
                                    {block.week_range}
                                </div>

                                <div className="timeline-dot" style={{
                                    position: 'absolute', left: 0, top: 14, width: 12, height: 12,
                                    borderRadius: '50%', background: isDone ? '#c9a84c' : '#0a0612',
                                    border: '2px solid #c9a84c', zIndex: 5,
                                    boxShadow: isDone ? '0 0 15px rgba(201,168,76,0.5)' : 'none',
                                    transition: 'all 0.4s ease'
                                }} />

                                <div className="glass-card roadmap-card" style={{
                                    marginLeft: 32, padding: 32, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderLeft: isDone ? '4px solid #c9a84c' : '1px solid rgba(201,168,76,0.1)',
                                    opacity: isDone ? 0.7 : 1,
                                    transform: isDone ? 'scale(0.99)' : 'scale(1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                        <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, ...goldText, fontWeight: 700, lineHeight: 1.4 }}>
                                            {block.focus}
                                        </h3>
                                        <div
                                            onClick={() => toggleComplete(idx)}
                                            style={{
                                                width: 24, height: 24, border: '1.5px solid rgba(201,168,76,0.5)',
                                                borderRadius: 8, cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', fontSize: 16,
                                                color: '#c9a84c', background: isDone ? 'rgba(201,168,76,0.15)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'}
                                        >
                                            {isDone && '✓'}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                        {block.skills.map(s => (
                                            <span key={s} style={{ fontSize: 10, padding: '4px 12px', background: 'rgba(123,47,247,0.08)', border: '1px solid rgba(123,47,247,0.15)', borderRadius: 6, color: '#c8b0ff', fontWeight: 500 }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                                        {block.resources.map((r, ri) => (
                                            <div key={ri} className="resource-row" style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.05)' }}>
                                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                                    <span style={typeBadge(r.type)}>{r.type}</span>
                                                    <span style={{
                                                        fontSize: 9, padding: '2px 8px', borderRadius: 4,
                                                        background: r.free ? 'rgba(94,234,212,0.1)' : 'rgba(251,191,36,0.1)',
                                                        color: r.free ? '#5eead4' : '#fbbf24', fontWeight: 800
                                                    }}>{r.free ? 'FREE' : 'PAID'}</span>
                                                </div>
                                                <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#c8b8e8', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#c8b8e8'}>
                                                    {r.title}
                                                </a>
                                                <span style={{ fontSize: 12, color: '#6a5880', fontWeight: 500, flexShrink: 0 }}>{r.estimated_hours}h</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.1)',
                                        borderRadius: 12, padding: '18px', borderLeft: '4px solid #c9a84c'
                                    }}>
                                        <div style={{ fontSize: 10, color: '#c9a84c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, letterSpacing: 1.5 }}>
                                            ✦ MILESTONE
                                        </div>
                                        <div style={{ fontSize: 13, color: '#d4c0f0', lineHeight: 1.6 }}>
                                            {block.milestone}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={{ height: 120 }} />
        </div>
    )
}
