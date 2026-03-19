import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    addToast('Signed out successfully.', 'info')
    navigate('/login')
  }

  const navLinkStyle = {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    transition: 'color 0.2s',
  }

  const activeNavLinkStyle = {
    ...navLinkStyle,
    color: '#D4A843',
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '64px',
      background: 'rgba(10,8,24,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(212,168,67,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      <style>{`
        .nav-item:hover { color: #D4A843 !important; }
      `}</style>

      <NavLink to="/" style={{ 
        fontFamily: 'Cinzel', 
        fontSize: '18px', 
        fontWeight: 700, 
        color: '#D4A843', 
        letterSpacing: '0.08em',
        textDecoration: 'none'
      }}>
        RESUME • AI
      </NavLink>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {user ? (
          <>
            <NavLink 
              to="/results" 
              className="nav-item" 
              style={({ isActive }) => isActive ? activeNavLinkStyle : navLinkStyle}
            >
              Results
            </NavLink>
            <NavLink 
              to="/history" 
              className="nav-item" 
              style={({ isActive }) => isActive ? activeNavLinkStyle : navLinkStyle}
            >
              History
            </NavLink>
            <button
              onClick={handleSignOut}
              style={{
                background: 'transparent',
                border: '1px solid #D4A843',
                color: '#D4A843',
                borderRadius: '8px',
                padding: '7px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '13px',
                marginLeft: '16px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,168,67,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={navLinkStyle} className="nav-item">Login</NavLink>
            <NavLink to="/signup" style={navLinkStyle} className="nav-item">Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}
