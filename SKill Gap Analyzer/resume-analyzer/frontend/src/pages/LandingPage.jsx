import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

const ROLES = [
  'Software Engineer', 'Data Scientist', 'Data Engineer',
  'Product Manager', 'DevOps Engineer', 'ML Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'UI/UX Designer', 'Cybersecurity Analyst', 'Cloud Architect',
  'Business Analyst', 'Marketing Manager', 'Mobile Developer',
]

function Spinner({ size = 16, color = '#f5d98b' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}33`, borderTopColor: color,
      animation: 'lspin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

export default function LandingPage() {
  const { user, signOut } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [analyzing, setAnalyzing] = useState(false)
  const [mode, setMode] = useState('skill_gap') // DEPRECATED: use careerMode
  const [role, setRole] = useState('')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [jobDesc, setJobDesc] = useState('')
  const [careerMode, setCareerMode] = useState('skill')
  const [careerFile, setCareerFile] = useState(null)
  const [careerLoading, setCareerLoading] = useState(false)
  const [careerError, setCareerError] = useState('')
  const inputRef = useRef()
  const canvasRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    document.title = "ResumeAI — AI Resume Analyzer"
  }, [])

  // ── Sparkles Animation ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const particles = []
    const colors = ['#D4A843', '#E8C96A', '#F5E09A', '#B8902A', '#FFD700']
    
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 2.5,
        speed: 0.2 + Math.random() * 0.6,
        opacity: 0.2 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        sway: -0.75 + Math.random() * 1.5,
        swaySpeed: 0.003 + Math.random() * 0.011,
        angle: Math.random() * Math.PI * 2,
        type: Math.random() > 0.5 ? 'star' : 'dot',
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.06
      })
    }

    const drawStar = (ctx, x, y, size, opacity, color) => {
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.fillStyle = color
      ctx.shadowBlur = 4
      ctx.shadowColor = color
      ctx.beginPath()
      for(let i = 0; i < 4; i++) {
        const rad = (i * 90) * Math.PI / 180
        ctx.lineTo(Math.cos(rad) * size + x, Math.sin(rad) * size + y)
        const innerRad = (i * 90 + 45) * Math.PI / 180
        ctx.lineTo(Math.cos(innerRad) * (size/2.5) + x, Math.sin(innerRad) * (size/2.5) + y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.y += p.speed
        p.angle += p.swaySpeed
        p.x += Math.sin(p.angle) * p.sway * 0.3
        p.twinkle += p.twinkleSpeed
        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle))

        if (p.type === 'star') {
          drawStar(ctx, p.x, p.y, p.size * 2, currentOpacity, p.color)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.globalAlpha = currentOpacity
          ctx.shadowBlur = 6
          ctx.shadowColor = p.color
          ctx.fill()
        }

        if (p.y > canvas.height + 10) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
      })
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // ── File Handlers ──────────────────────────────────────────────
  const validateFile = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') { setFileError('Only PDF files are accepted.'); addToast('Only PDF files are accepted.', 'error'); return }
    if (f.size > 5 * 1024 * 1024)    { setFileError('File must be under 5 MB.'); addToast('File must be under 5 MB.', 'error'); return }
    setFileError('')
    setFile(f)
    addToast('Resume uploaded!', 'info')
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    validateFile(e.dataTransfer.files[0])
  }, [])

  const handleAnalyze = async () => {
    if (!role) { addToast('Please select a target role', 'error'); return }
    if (!file) { addToast('Please upload your resume', 'error'); return }
    
    setAnalyzing(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1]
        const res = await api.post('/api/analyze', {
          pdf_base64: base64,
          target_role: role,
          job_description: jobDesc,
          user_id: user?.id,
          file_name: file.name
        })
        addToast('Analysis complete!', 'success')
        navigate(`/results/${res.data.analysis_id}`)
      } catch (err) {
        console.error('Analysis Error Detail:', err.response?.data)
        const msg = err?.response?.data?.detail 
          ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
          : 'Analysis failed. Please try again.'
        addToast(msg, 'error')
      } finally {
        setAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCareerDetect = async () => {
    if (!careerFile) {
      setCareerError('Please upload a PDF file first.')
      return
    }
    setCareerError('')
    setCareerLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/career-detect`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pdf_base64: base64,
                file_name: careerFile.name
              })
            }
          )
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.detail || 'Analysis failed')
          }
          const data = await res.json()
          navigate('/career-results', {
            state: {
              results: data,
              fileName: careerFile.name
            }
          })
        } catch (err) {
          console.error('Career detect error:', err)
          setCareerError(
            err.message || 'Analysis failed. Please try again.'
          )
        } finally {
          setCareerLoading(false)
        }
      }
      reader.readAsDataURL(careerFile)
    } catch {
      setCareerError('Failed to read file.')
      setCareerLoading(false)
    }
  }

  const handleMouseMove = (e) => {
    if (!glowRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glowRef.current.style.left = `${x}px`
    glowRef.current.style.top = `${y}px`
    glowRef.current.style.opacity = '1'
  }

  return (
    <div style={{ backgroundColor: '#0a0818', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes lspin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        .mode-pill {
          flex: 1; padding: 10px; border: none; border-radius: 999px;
          font-size: 11px; cursor: pointer; transition: all 0.3s;
          font-weight: 500; font-family: Inter, sans-serif;
          letter-spacing: 0.05em;
        }
        .glass-card:hover { border-color: rgba(212,168,67,0.35) !important; box-shadow: 0 0 60px rgba(124,111,224,0.14), inset 0 1px 0 rgba(255,255,255,0.08) !important; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* 1. Overall Page Background & Canvas */}
      <canvas id="sparkles-canvas" ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 3. Hero Section */}
        <div style={{ width: '100%', textAlign: 'center', padding: '72px 40px 48px', position: 'relative', zIndex: 1 }}>
          {/* 3a. Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(212,168,67,0.3)', borderRadius: 999,
            padding: '6px 16px', fontSize: 11, color: 'rgba(212,168,67,0.8)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'rgba(212,168,67,0.06)', marginBottom: 32
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4A843', boxShadow: '0 0 6px #D4A843' }} />
            AI-Powered Resume Analysis
          </div>

          <h1 style={{
            fontFamily: 'Cinzel', fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
            fontWeight: 700, lineHeight: 1.18, color: '#fff',
            maxWidth: 680, margin: '0 auto 20px'
          }}>
            Know Exactly What's Holding Your <span style={{ color: '#D4A843' }}>Resume</span> Back
          </h1>

          <p style={{
            fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)',
            maxWidth: 460, margin: '0 auto', lineHeight: 1.75
          }}>
            AI-powered resume analyzer that scores your ATS compatibility and detects skill gaps.
          </p>
        </div>

        {/* 4. Glass Analyze Card */}
        <div 
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { if (glowRef.current) glowRef.current.style.opacity = '0' }}
          className="glass-card"
          style={{
            maxWidth: 540, margin: '0 auto 80px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,168,67,0.18)',
            borderRadius: 20, padding: '16px 32px 30px 32px',
            display: 'flex', flexDirection: 'column', gap: 20,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 40px rgba(124,111,224,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
            transition: 'border-color 0.3s, box-shadow 0.3s'
          }}
        >
          <div 
            ref={glowRef}
            className="cursor-glow" 
            style={{
              position: 'absolute', width: 160, height: 160,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)',
              pointerEvents: 'none', transform: 'translate(-50%, -50%)',
              opacity: 0, transition: 'opacity 0.15s', zIndex: 0
            }} 
          />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 4a. Mode Toggle */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                CHOOSE ANALYSIS MODE
              </div>
                  <button 
                  onClick={() => { setCareerMode('skill'); setCareerError('') }}
                  className="mode-pill"
                  style={{
                    background: careerMode === 'skill' ? 'linear-gradient(135deg, #6b5fd4, #9b6fd4)' : 'transparent',
                    color: careerMode === 'skill' ? '#fff' : 'rgba(255,255,255,0.45)',
                    boxShadow: careerMode === 'skill' ? '0 2px 12px rgba(107,95,212,0.4)' : 'none'
                  }}
                >
                  Skill Gap Analysis
                </button>
                <button 
                  onClick={() => { setCareerMode('career'); setCareerError('') }}
                  className="mode-pill"
                  style={{
                    background: careerMode === 'career' ? 'linear-gradient(135deg, #6b5fd4, #9b6fd4)' : 'transparent',
                    color: careerMode === 'career' ? '#fff' : 'rgba(255,255,255,0.45)',
                    boxShadow: careerMode === 'career' ? '0 2px 12px rgba(107,95,212,0.4)' : 'none'
                  }}
                >
                  Career Detection
                </button>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontStyle: 'italic', marginTop: 10 }}>
              {careerMode === 'skill' 
                ? "Select your target role and upload your resume to identify skill gaps."
                : "Upload your resume and let AI predict the top 4 most suitable career roles for you."}
            </div>

            {/* 4b. Gold divider line */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.2), transparent)' }} />

            {careerMode === 'skill' ? (
              <>
                {/* 4c. Target Role section */}
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                    SELECT TARGET ROLE
                  </div>
                  <select 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '11px 14px', color: role ? '#fff' : 'rgba(255,255,255,0.5)',
                      outline: 'none', transition: 'border-color 0.2s', appearance: 'none', fontSize: 13
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(212,168,67,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <option value="" disabled style={{ background: '#0a0818' }}>Choose a role…</option>
                    {ROLES.map(r => (
                      <option key={r} value={r} style={{ background: '#0a0818' }}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* 4d. Upload Resume section */}
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                    UPLOAD RESUME (PDF ONLY)
                  </div>
                  <div 
                    onClick={() => inputRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    style={{
                      border: dragging ? '1.5px dashed rgba(212,168,67,0.4)' : '1.5px dashed rgba(255,255,255,0.1)',
                      borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                      background: dragging ? 'rgba(212,168,67,0.03)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.35)'; e.currentTarget.style.background = 'rgba(212,168,67,0.03)' }}
                    onMouseLeave={e => { if(!dragging) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
                  >
                    <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => validateFile(e.target.files[0])} />
                    <div style={{ 
                      width: 42, height: 42, borderRadius: '50%', background: 'rgba(107,95,212,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b5fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    {file ? (
                      <div style={{ color: '#D4A843', fontSize: 13 }}>
                        <div>✦ {file.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Drag & Drop your PDF here</div>
                        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 4 }}>or click to browse · PDF only</div>
                      </>
                    )}
                  </div>
                  {fileError && <div style={{ color: '#ff4d4d', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{fileError}</div>}
                </div>

                {/* 4e. Job Description section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>JOB DESCRIPTION</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      rows={3}
                      maxLength={3000}
                      value={jobDesc}
                      onChange={e => setJobDesc(e.target.value)}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '10px 14px', color: 'rgba(255,255,255,0.6)',
                        minHeight: 76, lineHeight: 1.6, resize: 'none', outline: 'none', transition: 'border-color 0.2s',
                        fontSize: 13
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(212,168,67,0.35)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                    <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                      {jobDesc.length} / 3000
                    </div>
                  </div>
                </div>

                {/* 4f. Analyze button */}
                <button
                  disabled={analyzing}
                  onClick={handleAnalyze}
                  style={{
                    width: '100%', padding: 14,
                    background: 'linear-gradient(135deg, #6b5fd4 0%, #9b6fd4 50%, #c4943a 100%)',
                    border: 'none', borderRadius: 12, color: '#fff',
                    fontSize: 13, fontWeight: 600, fontFamily: 'Cinzel',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    boxShadow: '0 4px 20px rgba(107,95,212,0.3)',
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                  onMouseEnter={e => { if(!analyzing) { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(107,95,212,0.45)' } }}
                  onMouseLeave={e => { if(!analyzing) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(107,95,212,0.3)' } }}
                >
                  {analyzing ? <Spinner /> : '✦ Analyze Resume'}
                </button>
              </>
            ) : (
              <>
                {/* Career Detection Mode */}
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                    UPLOAD RESUME FOR CAREER PREDICTION
                  </div>
                  <div 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf';
                      input.onchange = (e) => setCareerFile(e.target.files[0]);
                      input.click();
                    }}
                    style={{
                      border: '1.5px dashed rgba(255,255,255,0.1)',
                      borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(155,111,212,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <div style={{ 
                      width: 42, height: 42, borderRadius: '50%', background: 'rgba(107,95,212,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b5fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    {careerFile ? (
                      <div style={{ color: '#c9a84c', fontSize: 14 }}>
                        <div>✦ {careerFile.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 4 }}>Click to change file</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Drag & Drop your PDF here</div>
                        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, marginTop: 4 }}>or click to browse · PDF only</div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  disabled={careerLoading}
                  onClick={handleCareerDetect}
                  style={{
                    width: '100%', padding: 14,
                    background: 'linear-gradient(135deg, #6b5fd4 0%, #9b6fd4 50%, #c4943a 100%)',
                    border: 'none', borderRadius: 12, color: '#fff',
                    fontSize: 13, fontWeight: 600, fontFamily: 'Cinzel',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    boxShadow: '0 4px 20px rgba(107,95,212,0.3)',
                    cursor: careerLoading ? 'not-allowed' : 'pointer',
                    opacity: careerLoading ? 0.5 : 1,
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                >
                  {careerLoading ? <Spinner /> : '🔍 Detect Career'}
                </button>
                {careerError && <div style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{careerError}</div>}
              </>
            )}
          </div>
        </div>

        {/* 5. Career Detection Results */}
        {careerLoading && (
          <div style={{ textAlign:'center', padding:'32px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(201,168,76,0.2)',
              borderTopColor: '#c9a84c',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <div style={{ color: '#c9a84c', fontSize: 13, letterSpacing: '0.08em' }}>ANALYZING YOUR RESUME...</div>
          </div>
        )}

      </div>
    </div>
  )
}
