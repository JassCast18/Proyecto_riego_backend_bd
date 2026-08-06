import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { ToastContext } from './toast-context'

const DEFAULT_DURATION = 5000
const STYLES = {
  success: { icon: CheckCircle2, label: 'Éxito', color: '#15803d', panel: 'border-emerald-200 bg-emerald-50' },
  error: { icon: AlertCircle, label: 'Error', color: '#dc2626', panel: 'border-red-200 bg-red-50' },
  warning: { icon: TriangleAlert, label: 'Atención', color: '#d97706', panel: 'border-amber-200 bg-amber-50' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const closeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success', duration = DEFAULT_DURATION) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current.slice(-3), { id, message, type, duration }])
    window.setTimeout(() => closeToast(id), duration)
    return id
  }, [closeToast])

  const value = useMemo(() => ({
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
  }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onClose={() => closeToast(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }) {
  const style = STYLES[toast.type] || STYLES.success
  const Icon = style.icon

  return (
    <div className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${style.panel}`}>
      <Icon size={20} style={{ color: style.color }} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{style.label}</p>
        <p className="mt-0.5 text-sm leading-5 text-slate-700">{toast.message}</p>
      </div>
      <div className="relative h-7 w-7 shrink-0">
        <svg viewBox="0 0 28 28" className="h-7 w-7 -rotate-90" aria-hidden="true">
          <circle cx="14" cy="14" r="11" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="14" cy="14" r="11" fill="none" stroke={style.color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="69.12" className="toast-timer" style={{ animationDuration: `${toast.duration}ms` }} />
        </svg>
        <button type="button" onClick={onClose} aria-label="Cerrar notificación" className="absolute inset-0 flex items-center justify-center text-slate-600 hover:text-slate-950">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
