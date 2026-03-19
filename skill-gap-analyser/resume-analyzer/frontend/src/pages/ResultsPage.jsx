import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ChatBot from '../components/ChatBot'
import CrownDivider from '../components/CrownDivider'
import api from '../lib/api'

/* ── Inline Helpers ──────────────────────────────────────────────── */
const roman = ["I", "II", "III"]
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'

/* ── Styled Sub-Components ───────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span className="section-label" style={{
        fontSize: 10, letterSpacing: '2.5px', color: '#7a6090',
        textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap'
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,0.25), transparent)' }} />
    </div>
  )
}

function StatCard({ num, label, subtitle, gradient, score, max = 100 }) {
  const percent = Math.min((score / max) * 100, 100)
  return (
    <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 32, fontWeight: 700,
        background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', marginBottom: 4
      }}>{num}</div>
      <div style={{ fontSize: 10, color: '#6a5880', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
      {subtitle && <div style={{ fontSize: 11, color: '#6a5880', marginTop: 4 }}>{subtitle}</div>}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: gradient }} />
      </div>
    </div>
  )
}

function BadgePill({ children }) {
  return (
    <div style={{
      display: 'inline-block', padding: '4px 14px',
      background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.22)',
      borderRadius: 999, color: '#c9a84c', fontSize: 10, letterSpacing: '0.12em',
      textTransform: 'uppercase', marginBottom: 14
    }}>
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */
/*  RESULTS PAGE                                                    */
/* ════════════════════════════════════════════════════════════════ */

export default function ResultsPage() {
  const { analysisId } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(Boolean(location.state?.openChat))
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  useEffect(() => {
    document.title = "Your Results — ResumeAI"
    if (!analysisId) {
      navigate('/', { replace: true })
      return
    }
    setLoading(true)
    api.get(`/api/analyses/detail/${analysisId}`)
      .then((r) => {
        const row = Array.isArray(r.data) ? r.data[0] : r.data
        if (!row) {
          addToast('Analysis not found.', 'error')
          navigate('/', { replace: true })
          return
        }
        const result = row.result || {}
        const merged = {
          ...result,
          analysis_id: row.id,
          file_name: row.file_name,
          created_at: row.created_at,
          target_role: row.target_role ?? result.target_role,
          ats_score: row.ats_score ?? result.ats_score,
        }
        setData(merged)
        localStorage.setItem('analysisResult', JSON.stringify(merged))
        localStorage.setItem('lastAnalysisId', row.id)
      })
      .catch(() => {
        addToast('Failed to load analysis.', 'error')
        navigate('/', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [analysisId, navigate, addToast])

  useEffect(() => {
    const handleOpen = () => setIsChatOpen(true)
    window.addEventListener('open-coach', handleOpen)
    return () => window.removeEventListener('open-coach', handleOpen)
  }, [])

  if (!analysisId || loading) return null
  if (!data) return null

  const score = data.ats_score || 0
  const badge = score >= 85 ? { text: '✦ Excellent', color: '#5eead4' } : score >= 65 ? { text: '✓ Good', color: '#fbbf24' } : { text: '⚠ Needs Work', color: '#f87171' }

  const drawerStyle = (isOpen, side) => ({
    position: 'fixed', top: 0, [side]: 0, bottom: 0, width: '85%', maxWidth: 360,
    background: 'rgba(10,4,22,0.98)', backdropFilter: 'blur(16px)',
    zIndex: 1000, transform: isOpen ? 'translateX(0)' : `translateX(${side === 'left' ? '-100%' : '100%'})`,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex', flexDirection: 'column',
    borderRight: side === 'left' ? '1px solid rgba(201,168,76,0.1)' : 'none',
    borderLeft: side === 'right' ? '1px solid rgba(201,168,76,0.1)' : 'none',
  })

  return (
    <div style={{ minHeight: 'calc(100vh - 66px)', overflowY: 'auto', padding: '28px 36px', background: 'transparent' }}>
      <style>{`
        .dot-pulse-gold { width: 8px; height: 8px; border-radius: 50%; background: #D4A843; box-shadow: 0 0 10px #D4A843; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.3; transform: scale(0.9); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .feedback-text { color: #9a88b8; font-size: 14px; line-height: 1.6; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e0f0', wordBreak: 'break-all' }}>{data.file_name || 'Resume.pdf'}</div>
          <div style={{
            display: 'inline-block', alignSelf: 'flex-start', padding: '3px 12px',
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 20, color: '#c9a84c', fontSize: 11, fontWeight: 600
          }}>
            {data.target_role}
          </div>
          <div style={{ color: '#6a5880', fontSize: 11 }}>Analyzed on {fmtDate(data.created_at)}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent', border: '1px solid #D4A843', color: '#c9a84c',
              padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13
            }}
          >
            New Analysis
          </button>
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #4a1a8a, #7b2ff7)', border: '1px solid rgba(212,168,67,0.3)',
                color: '#D4A843', padding: '8px 18px', borderRadius: 8, fontWeight: 600,
                display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13
              }}
            >
              <div className="dot-pulse-gold"></div>
              AI Coach
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isChatOpen ? '280px 1fr 380px' : '280px 1fr',
        gap: 20,
        alignItems: 'start',
        transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        {/* ── LEFT COLUMN ── sticky side */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Card 1: ATS Score */}
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <BadgePill>ATS SCORE</BadgePill>
            <div style={{
              width: 140, height: 140, borderRadius: '50%', margin: '0 auto 16px', position: 'relative',
              background: `conic-gradient(#c9a84c 0% ${score}%, rgba(255,255,255,0.05) ${score}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 124, height: 124, borderRadius: '50%', background: '#0a0612', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 32, color: '#c9a84c', background: 'linear-gradient(135deg, #c9a84c, #f5d98b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{score}</div>
                <div style={{ fontSize: 10, color: 'rgba(201,168,76,0.6)', letterSpacing: 1, textTransform: 'uppercase' }}>Score</div>
              </div>
            </div>
            <div style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${badge.color}`, color: badge.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', display: 'inline-block', marginBottom: 8 }}>{badge.text}</div>
            <div style={{ fontSize: 12, color: '#9a88b8', fontWeight: 500 }}>ATS Score</div>
            <div style={{ fontSize: 10, color: '#6a5880', marginTop: 2 }}>Keyword match rate</div>
          </div>

          {/* Card 2: Breakdown */}
          {data.score_by_category && (
            <div className="glass-card" style={{ padding: 22 }}>
              <BadgePill>BREAKDOWN</BadgePill>
              <SectionTitle>Score by Category</SectionTitle>
              {Object.entries(data.score_by_category).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#9a88b8', width: 90, textAlign: 'right', flexShrink: 0, textTransform: 'capitalize' }}>{key}</div>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${val}%`,
                      background: val < 40 ? '#f87171' : val < 70 ? '#fbbf24' : '#5eead4'
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#c9a84c', width: 28, textAlign: 'right' }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Card 3: Priorities */}
          <div className="glass-card" style={{ padding: 22 }}>
            <BadgePill>PRIORITIES</BadgePill>
            <SectionTitle>Fix These First</SectionTitle>
            {data.top_3_priorities?.map((p, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)', color: '#c9a84c', fontFamily: "'Cinzel', serif", fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {roman[i]}
                </div>
                <div style={{ color: '#9a88b8', fontSize: 11, lineHeight: 1.4 }}>{p}</div>
              </div>
            ))}
          </div>

          {/* Card 4: Keywords */}
          <div className="glass-card" style={{ padding: 22 }}>
            <BadgePill>KEYWORDS</BadgePill>
            <SectionTitle>Add These Keywords</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.keyword_suggestions?.map(kw => (
                <span key={kw} style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c', fontSize: 10, borderRadius: 6, padding: '4px 9px' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── flex columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Section 1: Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <StatCard num={score} label="ATS Score" subtitle="Keyword match rate" gradient="linear-gradient(135deg, #c9a84c, #f5d98b)" score={score} />
            <StatCard num={data.matched_skills?.length || 0} label="Matched Skills" subtitle="out of JD skills" gradient="linear-gradient(135deg, #0d7a5c, #5eead4)" score={data.matched_skills?.length || 0} max={20} />
            <StatCard num={data.missing_skills?.length || 0} label="Missing Skills" subtitle="required by JD" gradient="linear-gradient(135deg, #7f1d1d, #f87171)" score={data.missing_skills?.length || 0} max={20} />
          </div>

          {/* Section 2: Radar + Keyword Freq */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="glass-card" style={{ padding: 22 }}>
              <BadgePill>COVERAGE</BadgePill>
              <SectionTitle>Skill Category Coverage</SectionTitle>

              {(() => {
                const radarData = [
                  { subject: 'Programming', value: data.radar_data?.programming || 0 },
                  { subject: 'Cloud', value: data.radar_data?.cloud || 0 },
                  { subject: 'Databases', value: data.radar_data?.databases || 0 },
                  { subject: 'ML/AI', value: data.radar_data?.ml_ai || 0 },
                  { subject: 'Pipelines', value: data.radar_data?.pipelines || 0 },
                  { subject: 'Viz', value: data.radar_data?.visualization || 0 },
                ]

                return (
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(201,168,76,0.1)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#9a88b8', fontSize: 11 }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="rgba(107,95,212,0.8)"
                        fill="rgba(107,95,212,0.15)"
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )
              })()}
            </div>

            <div className="glass-card" style={{ padding: 22 }}>
              <BadgePill>KEYWORDS</BadgePill>
              <SectionTitle>Keyword Frequency vs JD</SectionTitle>

              {(() => {
                const kwData = (data.keyword_frequency || []).slice(0, 8).map(item => ({
                  name: item.keyword,
                  Resume: item.in_resume,
                  JD: item.in_jd,
                }))

                return (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={kwData} barGap={2} barCategoryGap="30%">
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#9a88b8', fontSize: 10 }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#9a88b8', fontSize: 10 }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          background: '#1a1030', 
                          border: '1px solid rgba(201,168,76,0.2)',
                          borderRadius: 8,
                          color: '#e8e0f0'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: 11, color: '#9a88b8' }} 
                      />
                      <Bar dataKey="Resume" fill="#3b5bdb" radius={[3,3,0,0]} />
                      <Bar dataKey="JD" fill="#c9366a" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              })()}
            </div>
          </div>

          {/* Section 3: Skills Card */}
          <div className="glass-card" style={{ padding: 22 }}>
            <BadgePill>SKILLS</BadgePill>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <SectionTitle>✦ Matched Skills ({data.matched_skills?.length || 0})</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.matched_skills?.map(sk => (
                    <span key={sk} style={{ background: 'rgba(94,234,212,0.08)', border: '1px solid rgba(94,234,212,0.2)', color: '#5eead4', fontSize: 11, borderRadius: 6, padding: '5px 11px', fontWeight: 500 }}>
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <SectionTitle>✕ Missing Skills ({data.missing_skills?.length || 0})</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.missing_skills?.map(sk => (
                    <span key={sk} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 11, borderRadius: 6, padding: '5px 11px', fontWeight: 500 }}>
                      ✕ {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Strengths & Weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {data.strengths && (
              <div className="glass-card" style={{ padding: 22 }}>
                <BadgePill>ANALYSIS</BadgePill>
                <SectionTitle>Strengths</SectionTitle>
                {data.strengths.map((str, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5eead4', marginTop: 5, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: '#9a88b8', lineHeight: 1.5 }}>{str}</div>
                  </div>
                ))}
              </div>
            )}
            {data.weaknesses && (
              <div className="glass-card" style={{ padding: 22 }}>
                <BadgePill>ANALYSIS</BadgePill>
                <SectionTitle>Weaknesses</SectionTitle>
                {data.weaknesses.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', marginTop: 5, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: '#9a88b8', lineHeight: 1.5 }}>{w}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Recruiter Suggestion */}
          {data.recruiter_suggestion && (
            <div style={{ border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, color: '#c9a84c', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>✦ Recruiter-facing Suggestion</div>
              <div style={{ fontSize: 13, color: '#a09060', lineHeight: 1.7 }}>{data.recruiter_suggestion}</div>
            </div>
          )}

          {/* Section 6: Certs / Internships / Projects */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {data.recommended_certifications?.length > 0 && (
              <div className="glass-card" style={{ padding: 20 }}>
                <BadgePill>CERTIFICATIONS</BadgePill>
                <SectionTitle>Recommended</SectionTitle>
                {data.recommended_certifications.map((item, i) => (
                  <div key={i} className="rec-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.07)', borderRadius: 10, marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.07)'}>
                    <div style={{ fontSize: 13, color: '#c8b8e8' }}>{item}</div>
                    <div style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: 14 }}>›</div>
                  </div>
                ))}
              </div>
            )}
            {data.recommended_internships?.length > 0 && (
              <div className="glass-card" style={{ padding: 20 }}>
                <BadgePill>INTERNSHIPS</BadgePill>
                <SectionTitle>Opportunities</SectionTitle>
                {data.recommended_internships.map((item, i) => (
                  <div key={i} className="rec-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.07)', borderRadius: 10, marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.07)'}>
                    <div style={{ fontSize: 13, color: '#c8b8e8' }}>{item}</div>
                    <div style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: 14 }}>›</div>
                  </div>
                ))}
              </div>
            )}
            {data.recommended_projects?.length > 0 && (
              <div className="glass-card" style={{ padding: 20 }}>
                <BadgePill>PROJECTS</BadgePill>
                <SectionTitle>Build These</SectionTitle>
                {data.recommended_projects.map((item, i) => (
                  <div key={i} className="rec-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.07)', borderRadius: 10, marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.07)'}>
                    <div style={{ fontSize: 13, color: '#c8b8e8' }}>{item}</div>
                    <div style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: 14 }}>›</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Action Items */}
          {data.action_items && (
            <div className="glass-card" style={{ padding: 22 }}>
              <BadgePill>ACTION PLAN</BadgePill>
              <SectionTitle>Priority Action Items</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {data.action_items.map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e0f0', marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#6a5880', lineHeight: 1.5 }}>{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 8: Improved Bullets */}
          <div className="glass-card" style={{ padding: 22 }}>
            <BadgePill>AI REWRITE</BadgePill>
            <SectionTitle>AI-IMPROVED BULLET POINTS (STAR METHOD)</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {data.rewritten_bullets?.map((bull, i) => (
                <div key={i}>
                  <div className="bullet-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: 'rgba(248,113,113,0.03)', border: '1px solid rgba(248,113,113,0.1)', borderRadius: 12, padding: 18, position: 'relative' }}>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: '#7a3a4a', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>BEFORE</div>
                      <div style={{ color: '#886070', fontSize: 13, lineHeight: 1.6, textDecoration: 'line-through' }}>{bull.original}</div>
                    </div>
                    <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: 18, position: 'relative' }}>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: '#9a7830', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>AFTER (STAR METHOD)</div>
                      <div style={{ color: '#c8b080', fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>{bull.improved}</div>
                    </div>
                  </div>
                  {i < data.rewritten_bullets.length - 1 && <CrownDivider style={{ margin: '24px 0' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: Feedback */}
          <div className="glass-card" style={{ padding: 22 }}>
            <BadgePill>FEEDBACK</BadgePill>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ minHeight: 180 }}>
                <SectionTitle>Experience Feedback</SectionTitle>
                <div className="feedback-text">{data.experience_feedback}</div>
              </div>
              <div style={{ minHeight: 180 }}>
                <SectionTitle>Education Feedback</SectionTitle>
                <div className="feedback-text">{data.education_feedback}</div>
              </div>
            </div>
          </div>

          {/* Section 10: Formatting Issues */}
          <div className="glass-card" style={{ padding: 22 }}>
            <BadgePill>FORMATTING</BadgePill>
            <SectionTitle>FORMATTING ISSUES</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.formatting_issues?.map((iss, i) => (
                <div key={i} style={{ padding: '10px 16px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.1)', borderRadius: 10, color: '#a09060', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>⚠</span> {iss}
                </div>
              ))}
              {(!data.formatting_issues || data.formatting_issues.length === 0) && (
                <div style={{ color: '#5eead4', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(94,234,212,0.05)', border: '1px solid rgba(94,234,212,0.1)', borderRadius: 10 }}>
                  <span>✦</span> High quality formatting detected.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── CHAT PANEL ── sticky side */}
        {isChatOpen && (
          <div style={{ position: 'sticky', top: 24, height: 'calc(100vh - 130px)', borderRadius: 20, overflow: 'hidden' }}>
            <ChatBot
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              analysisId={data.analysis_id}
              userId={user?.id}
              resumeContext={data}
              targetRole={data.target_role}
              atsScore={data.ats_score}
            />
          </div>
        )}

      </div>

      {/* ── Drawers for Mobile ── */}
      {(leftOpen || rightOpen) && (
        <div onClick={() => { setLeftOpen(false); setRightOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(4px)' }} />
      )}
      <div style={drawerStyle(leftOpen, 'left')}>
        {/* ... Mobile Left Content ... */}
      </div>
      <div style={drawerStyle(rightOpen, 'right')}>
        {/* ... Mobile Right Content ... */}
      </div>

    </div>
  )
}
