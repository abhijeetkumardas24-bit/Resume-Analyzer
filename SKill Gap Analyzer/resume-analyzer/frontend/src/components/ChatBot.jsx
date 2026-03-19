import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

function Spinner({ size = 24, color = '#c9a84c' }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `2px solid ${color}33`, borderTopColor: color,
            animation: 'cspin 1s linear infinite'
        }} />
    )
}

export default function ChatBot({ 
    isOpen,
    analysisId, 
    userId, 
    resumeContext, 
    targetRole, 
    atsScore, 
    onClose 
}) {
    const { addToast } = useToast()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const scrollRef = useRef()

    useEffect(() => {
        if (isOpen && analysisId && userId) {
            fetchHistory()
        }
    }, [isOpen, analysisId, userId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    if (!isOpen) return null

    const fetchHistory = async () => {
        setFetching(true)
        try {
            const res = await api.get(`/api/chat/history/${analysisId}/${userId}`)
            setMessages(res.data.messages || [])
        } catch (err) {
            console.error('Failed to fetch chat history', err)
            addToast('Failed to load chat history.', 'error')
        } finally {
            setFetching(false)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg = { role: 'user', content: input, created_at: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await api.post('/api/chat', {
                message: input,
                analysis_id: analysisId,
                user_id: userId,
                resume_context: resumeContext
            })
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, created_at: new Date().toISOString() }])
        } catch (err) {
            console.error('Chat error', err)
            addToast('Connection error. Please try again.', 'error')
            setMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered an error. Please try again.', created_at: new Date().toISOString() }])
        } finally {
            setLoading(false)
        }
    }

    const clearHistory = async () => {
        try {
            await api.delete(`/api/chat/history/${analysisId}/${userId}`)
            setMessages([])
            setShowConfirm(false)
            addToast('History cleared successfully.', 'success')
        } catch (err) {
            addToast('Failed to clear history.', 'error')
        }
    }

    const welcomeMessage = `Greetings ✦ I have reviewed your resume for ${targetRole}. Your ATS score is ${atsScore}/100. Your top priority is: ${resumeContext?.top_3_priorities?.[0] || 'Optimizing your content'}. What would you like to work on?`

    return (
        <div
            className="chat-bot-container"
            style={{
                width: '100%', maxWidth: '100%', height: '100%',
                background: 'rgba(10,4,22,0.55)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(201,168,76,0.12)',
                display: 'flex', flexDirection: 'column',
                animation: 'cslideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                overflow: 'hidden'
            }}
        >
            <style>{`
                @keyframes cslideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes cbounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                @keyframes cspin { to { transform: rotate(360deg); } }
                .cdot { width: 6px; height: 6px; border-radius: 50%; background: #c9a84c; animation: cbounce 0.6s ease-in-out infinite; }
                .chat-scroll::-webkit-scrollbar { width: 4px; }
                .chat-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 4px; }
                @media (max-width: 768px) {
                    .chat-bot-container { top: 0 !important; height: 100vh !important; }
                }
            `}</style>

            {/* Top Shimmer */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', opacity: 0.6 }} />

            {/* Header */}
            <div style={{ height: 64, padding: '0 20px', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: 17, fontWeight: 700, background: 'linear-gradient(135deg, #c9a84c, #f5d98b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        AI Career Coach
                    </div>
                    <div style={{ fontSize: 10, background: 'rgba(123,47,247,0.15)', color: '#c8b8e8', padding: '2px 10px', borderRadius: 4, marginTop: 4, display: 'inline-block', fontWeight: 600 }}>
                        {targetRole}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button 
                        onClick={() => setShowConfirm(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a5880', fontSize: 18, transition: '0.2s', padding: 8 }}
                        title="Clear History"
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6a5880'}
                    >🗑</button>
                    <button 
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#9a88b8', fontSize: 14, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9a88b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >✕</button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {fetching ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 16 }}>
                        <Spinner />
                        <span style={{ fontSize: 10, color: '#c9a84c', letterSpacing: 2, fontWeight: 600 }}>RESTORING SESSION...</span>
                    </div>
                ) : (
                    <>
                        {messages.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                                <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.1)' }} />
                                <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.2)', letterSpacing: 2, fontWeight: 600 }}>PAST CONVERSATION</span>
                                <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.1)' }} />
                            </div>
                        )}

                        {/* Welcome Message */}
                        {messages.length === 0 && (
                            <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '14px 14px 14px 4px', color: '#c8b8e8', fontSize: 14, padding: '14px 18px', lineHeight: 1.5 }}>
                                    <ReactMarkdown>{welcomeMessage}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                                <div style={{ 
                                    background: m.role === 'user' ? 'linear-gradient(135deg, #4a1a8a, #7b2ff7)' : 'rgba(255,255,255,0.04)',
                                    border: m.role === 'user' ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(201,168,76,0.1)',
                                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    color: m.role === 'user' ? '#f5f0ff' : '#c8b8e8',
                                    fontSize: 14, padding: '12px 18px', lineHeight: 1.5,
                                    boxShadow: m.role === 'user' ? '0 10px 25px -10px rgba(123,47,247,0.3)' : 'none'
                                }}>
                                    {m.role === 'user' ? m.content : (
                                        <ReactMarkdown
                                            components={{
                                                p: ({children}) => (
                                                    <p style={{ margin:'6px 0', lineHeight:1.7 }}>{children}</p>
                                                ),
                                                ul: ({children}) => (
                                                    <ul style={{ paddingLeft:18, margin:'8px 0' }}>{children}</ul>
                                                ),
                                                ol: ({children}) => (
                                                    <ol style={{ paddingLeft:18, margin:'8px 0' }}>{children}</ol>
                                                ),
                                                li: ({children}) => (
                                                    <li style={{ marginBottom:4, lineHeight:1.6 }}>{children}</li>
                                                ),
                                                strong: ({children}) => (
                                                    <strong style={{ color:'#e8e0f0', fontWeight:600 }}>{children}</strong>
                                                ),
                                                h1: ({children}) => (
                                                    <h1 style={{ fontSize:16, fontWeight:700, color:'#c9a84c', margin:'12px 0 6px', fontFamily:"'Cinzel',serif" }}>{children}</h1>
                                                ),
                                                h2: ({children}) => (
                                                    <h2 style={{ fontSize:14, fontWeight:700, color:'#c9a84c', margin:'12px 0 6px', fontFamily:"'Cinzel',serif" }}>{children}</h2>
                                                ),
                                                h3: ({children}) => (
                                                    <h3 style={{ fontSize:13, fontWeight:600, color:'#d4b87a', margin:'10px 0 4px' }}>{children}</h3>
                                                ),
                                                a: ({href, children}) => (
                                                    <a href={href} target="_blank" rel="noopener noreferrer"
                                                        style={{ color:'#7ab8e8', textDecoration:'underline', textUnderlineOffset:3 }}>
                                                        {children}
                                                    </a>
                                                ),
                                                code: ({children}) => (
                                                    <code style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'2px 6px', fontSize:12, color:'#5eead4', fontFamily:'monospace' }}>
                                                        {children}
                                                    </code>
                                                ),
                                                blockquote: ({children}) => (
                                                    <blockquote style={{ borderLeft:'3px solid rgba(201,168,76,0.4)', paddingLeft:12, margin:'8px 0', color:'#9a88b8', fontStyle:'italic' }}>
                                                        {children}
                                                    </blockquote>
                                                ),
                                                hr: () => (
                                                    <hr style={{ border:'none', borderTop:'1px solid rgba(201,168,76,0.15)', margin:'12px 0' }}/>
                                                ),
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                                <div style={{ fontSize: 10, color: '#6a5880', letterSpacing: '1px', marginTop: 6, textAlign: m.role === 'user' ? 'right' : 'left', fontWeight: 500 }}>
                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div style={{ alignSelf: 'flex-start', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 8 }}>
                                <div className="cdot" style={{ animationDelay: '0s' }} />
                                <div className="cdot" style={{ animationDelay: '0.15s' }} />
                                <div className="cdot" style={{ animationDelay: '0.3s' }} />
                            </div>
                        )}
                        <div ref={scrollRef} style={{ height: 20 }} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(201,168,76,0.1)', padding: '20px', display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
                <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Message your Career Coach..."
                    disabled={loading}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, color: '#f5f0ff', padding: '12px 16px', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
                />
                <button 
                    disabled={!input.trim() || loading}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4a1a8a,#7b2ff7)', border: '1px solid rgba(201,168,76,0.3)', color: '#f5d98b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', opacity: (!input.trim() || loading) ? 0.4 : 1, transform: (!input.trim() || loading) ? 'none' : 'scale(1)', boxShadow: (!input.trim() || loading) ? 'none' : '0 10px 20px -5px rgba(123,47,247,0.4)' }}
                    onMouseEnter={e => { if(!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(1.05)' }}
                    onMouseLeave={e => { if(!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(1)' }}
                >
                    <span style={{ fontSize: 20 }}>✦</span>
                </button>
            </form>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 40 }}>
                    <div className="glass-card" style={{ padding: 32, textAlign: 'center', borderColor: 'rgba(201,168,76,0.3)', maxWidth: 320 }}>
                        <div style={{ fontSize: 24, marginBottom: 16 }}>⚠️</div>
                        <div style={{ color: '#f5f0ff', fontSize: 16, marginBottom: 12, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Clear History?</div>
                        <div style={{ color: '#9a88b8', fontSize: 13, marginBottom: 32, lineHeight: 1.5 }}>This action cannot be undone. All messages for this session will be lost.</div>
                        <div style={{ display: 'flex', gap: 14 }}>
                            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9a88b8', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button onClick={clearHistory} style={{ flex: 1, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
