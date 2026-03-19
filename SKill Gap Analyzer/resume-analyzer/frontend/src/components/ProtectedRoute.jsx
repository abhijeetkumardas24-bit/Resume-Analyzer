import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px',
      }}>
        {/* Spinner */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid rgba(123,47,247,0.2)',
          borderTopColor: '#7b2ff7',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: '#9a88b8', fontSize: '14px', letterSpacing: '0.5px' }}>
          Loading...
        </span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
