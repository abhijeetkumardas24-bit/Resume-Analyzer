import { useLocation, useNavigate } from 'react-router-dom'

const roman = ['I', 'II', 'III', 'IV']
const accentColors = ['#5eead4', '#9b6fd4', '#c9a84c', '#f87171']
const numBgColors = ['#5eead4', '#9b6fd4', '#c9a84c', '#f87171']

function SectionTitle({ children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
      <span style={{ fontSize:10, letterSpacing:'2.5px', color:'#7a6090', textTransform:'uppercase', fontWeight:600, whiteSpace:'nowrap' }}>
        {children}
      </span>
      <div style={{ flex:1, height:1, background:'linear-gradient(90deg, rgba(201,168,76,0.25), transparent)' }} />
    </div>
  )
}

function CircleScore({ percent, color }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * percent / 100)
  return (
    <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:14, fontWeight:700, color }}>{percent}%</div>
        <div style={{ fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Career Fit</div>
      </div>
    </div>
  )
}

export default function CareerResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const results = location.state?.results
  const fileName = location.state?.fileName || 'Resume'

  if (!results) {
    navigate('/', { replace: true })
    return null
  }

  const careers = results.careers || []
  const extractedSkills = results.extracted_skills || []

  return (
    <div style={{ minHeight:'calc(100vh - 66px)', background:'transparent', padding:'32px 24px 80px', maxWidth:720, margin:'0 auto' }}>
      <style>{`
        .career-card { transition: border-color 0.2s; }
        .career-card:hover { border-color: rgba(201,168,76,0.25) !important; }
        .suggest-item { transition: border-color 0.2s, background 0.2s; }
        .suggest-item:hover { border-color: rgba(201,168,76,0.2) !important; background: rgba(255,255,255,0.04) !important; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.1); border-radius:10px; }
      `}</style>

      {/* Top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:22, fontWeight:700, background:'linear-gradient(135deg,#c9a84c,#f5d98b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 }}>
            Career Detection Results
          </div>
          <div style={{ fontSize:12, color:'#6a5880' }}>
            Based on: <span style={{ color:'#c9a84c' }}>{fileName}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ padding:'8px 20px', background:'transparent', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, color:'#c9a84c', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}
        >
          ← New Analysis
        </button>
      </div>

      {/* Extracted Skills */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(107,175,212,0.2)', borderRadius:16, padding:22, marginBottom:20, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(107,175,212,0.3),transparent)', borderRadius:'16px 16px 0 0' }} />
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:20 }}>🧠</span>
          <span style={{ fontSize:15, fontWeight:600, color:'#e8e0f0' }}>Skills Extracted from Your Resume</span>
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:14 }} />
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {extractedSkills.map((skill, i) => (
            <span key={i} style={{ background:'rgba(107,155,212,0.12)', border:'1px solid rgba(107,155,212,0.25)', color:'#7ab8e8', fontSize:12, borderRadius:20, padding:'5px 14px', fontWeight:500 }}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Career Cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {careers.map((career, i) => {
          const color = career.accent_color || accentColors[i] || '#c9a84c'
          const numColor = i === 2 ? '#0a0818' : '#fff'
          return (
            <div
              key={i}
              className="career-card"
              style={{ background:'rgba(255,255,255,0.03)', borderLeft:`3px solid ${color}`, borderTop:'1px solid rgba(201,168,76,0.1)', borderRight:'1px solid rgba(201,168,76,0.1)', borderBottom:'1px solid rgba(201,168,76,0.1)', borderRadius:16, padding:24, position:'relative' }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${color}33,transparent)`, borderRadius:'16px 16px 0 0' }} />

              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:numColor, flexShrink:0 }}>
                    {career.rank || i + 1}
                  </div>
                  <div style={{ fontSize:20, fontWeight:700, color:'#e8e0f0' }}>{career.role}</div>
                </div>
                <CircleScore percent={career.match_percentage || 0} color={color} />
              </div>

              {/* Explanation */}
              <div style={{ fontSize:13, color:'#9a88b8', lineHeight:1.7, marginBottom:16 }}>
                {career.explanation}
              </div>

              {/* Missing Skills */}
              {career.missing_skills?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, fontSize:12, fontWeight:600, color:'#fbbf24' }}>
                    ⚠ Missing Skills
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {career.missing_skills.map((sk, j) => (
                      <span key={j} style={{ background:'rgba(180,60,60,0.15)', border:'1px solid rgba(180,60,60,0.3)', color:'#f87171', fontSize:11, borderRadius:6, padding:'4px 10px' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'14px 0' }} />

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:6 }}>
                  🕐 Est. time to readiness:&nbsp;
                  <span style={{ color:'#c9a84c', fontWeight:600 }}>{career.weeks_to_readiness} weeks</span>
                </div>
                <div style={{ fontSize:11, color:color, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  {career.match_percentage >= 70 ? '✦ Strong Match' : career.match_percentage >= 45 ? '◈ Good Potential' : '◇ Needs Work'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ marginTop:32, textAlign:'center' }}>
        <div style={{ fontSize:13, color:'#6a5880', marginBottom:16 }}>
          Want a detailed skill gap analysis for your top match?
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ padding:'12px 32px', background:'linear-gradient(135deg,#6b5fd4,#9b6fd4)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.06em' }}
        >
          ✦ Run Skill Gap Analysis
        </button>
      </div>
    </div>
  )
}
