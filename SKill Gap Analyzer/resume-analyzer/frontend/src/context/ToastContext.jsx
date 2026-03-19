import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const getStyle = (type) => {
    const base = {
      padding: '12px 20px', borderRadius: 12, backdropFilter: 'blur(16px)',
      border: '1px solid', minWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'toastSlideIn 0.3s ease-out forwards', marginBottom: 12,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 14, fontWeight: 500
    }
    switch(type) {
      case 'success': return { ...base, background: 'rgba(94,234,212,0.1)', borderColor: 'rgba(94,234,212,0.25)', color: '#5eead4' }
      case 'error':   return { ...base, background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)', color: '#f87171' }
      default:        return { ...base, background: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.2)', color: '#c9a84c' }
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
        {toasts.map(t => (
          <div key={t.id} style={getStyle(t.type)}>
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 16, cursor: 'pointer', opacity: 0.6 }}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
