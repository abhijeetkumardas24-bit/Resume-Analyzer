import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
            <h1 style={{ fontFamily: 'Cinzel, serif', color: '#c9a84c', fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
            <p style={{ color: '#9a88b8', marginBottom: 30 }}>An unexpected error occurred. Please try returning home.</p>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg, #4a1a8a, #7b2ff7)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 10, color: '#f5d98b', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Return Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
