import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, CheckCircle2, RefreshCcw, Trash2, TriangleAlert } from 'lucide-react'
import {
  dismissNotificationRequest,
  listNotificationsRequest,
  reviewNotificationRequest,
} from '../../auth/notifications.service'
import { useToast } from '@/context/useToast.js'

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'reviewed', label: 'Revisadas' },
  { value: 'resolved', label: 'Resueltas' },
]

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

function severityStyle(severity) {
  if (severity === 'ERROR') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (severity === 'WARNING') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

export function NotificationsContent() {
  const toast = useToast()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (error) {
      toast.error(error)
      setError('')
    }
  }, [error, toast])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNotifications(await listNotificationsRequest({ status: filter, limit: 100 }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const markReviewed = async (notification) => {
    setBusyId(notification.id)
    setError('')
    try {
      await reviewNotificationRequest(notification.id)
      await loadNotifications()
      toast.success('Notificación marcada como revisada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const dismiss = async (notification) => {
    setBusyId(notification.id)
    setError('')
    try {
      await dismissNotificationRequest(notification.id)
      await loadNotifications()
      toast.success('Notificación eliminada de tu lista.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Alertas e historial</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Las incidencias activas permanecen aquí hasta que el hardware se recupere. Los avisos informativos pueden eliminarse de tu lista.
          </p>
        </div>
        <button type="button" onClick={loadNotifications} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === item.value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">Consultando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
            <p className="mt-3 font-semibold text-slate-800">No hay notificaciones en esta sección.</p>
          </div>
        ) : notifications.map((notification) => (
          <article key={notification.id} className={`rounded-3xl border bg-white p-5 shadow-sm ${notification.revisada ? 'border-slate-200 opacity-80' : 'border-sky-200'}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${severityStyle(notification.severidad)}`}>
                {notification.severidad === 'INFO' ? <Bell size={20} /> : <TriangleAlert size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-950">{notification.titulo}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${notification.estado === 'RESUELTA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {notification.estado === 'RESUELTA' ? 'Resuelta' : 'Activa'}
                  </span>
                  {notification.revisada ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">Revisada</span> : null}
                </div>
                <p className="mt-2 text-sm text-slate-600">{notification.mensaje}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(notification.fechaActualizacion || notification.fechaCreacion)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!notification.revisada ? (
                  <button type="button" disabled={busyId === notification.id} onClick={() => markReviewed(notification)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    <Check size={14} /> Marcar revisada
                  </button>
                ) : null}
                {notification.descartable ? (
                  <button type="button" disabled={busyId === notification.id} onClick={() => dismiss(notification)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                    <Trash2 size={14} /> Eliminar
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
