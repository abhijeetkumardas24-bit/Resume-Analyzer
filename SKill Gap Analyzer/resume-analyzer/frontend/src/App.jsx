import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './context/ToastContext'

import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import SignupPage   from './pages/SignupPage'
import ResultsPage  from './pages/ResultsPage'
import HistoryPage  from './pages/HistoryPage'
import RoadmapPage  from './pages/RoadmapPage'
import CareerResultsPage from './pages/CareerResultsPage'

/* ── Background orbs ───────────────────────────────────────────── */
const orbBase = {
  position: 'fixed',
  borderRadius: '50%',
  filter: 'blur(90px)',
  pointerEvents: 'none',
  zIndex: 0,
}

function BackgroundOrbs() {
  return (
    <div aria-hidden="true" className="mobile-hide-orbs">
      <div style={{ ...orbBase, width: 600, height: 600, background: '#3b0f6e', top: -180, left: -150, opacity: 0.35 }} />
      <div style={{ ...orbBase, width: 450, height: 450, background: '#1a0840', bottom: -100, right: -100, opacity: 0.40 }} />
      <div style={{ ...orbBase, width: 350, height: 350, background: '#c9a84c', top: '30%', left: '40%', opacity: 0.06 }} />
      <div style={{ ...orbBase, width: 250, height: 250, background: '#7b2ff7', top: '60%', left: '10%', opacity: 0.12 }} />
    </div>
  )
}

/* ── App ────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <BackgroundOrbs />

        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', paddingTop: '64px' }}>
          <Navbar />

          <Routes>
            {/* Public */}
            <Route path="/"        element={<LandingPage />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/signup"  element={<SignupPage />} />

            {/* Protected */}
            <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/results/:analysisId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/history"  element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/roadmap"  element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
            <Route 
              path="/career-results" 
              element={<ProtectedRoute><CareerResultsPage /></ProtectedRoute>} 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
