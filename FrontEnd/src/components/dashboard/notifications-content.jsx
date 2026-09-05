import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle2, Clock3, Eye, MailCheck, MailWarning, RefreshCcw, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import {
  acknowledgeNotificationRequest,
  dismissNotificationRequest,
  listNotificationsRequest,
  reviewNotificationRequest,
} from '../../auth/notifications.service'
import { useToast } from '@/context/useToast.js'
import { useNavigate } from 'react-router-dom'

const FILTERS = [
  { value: 'active', label: 'Activas' },
  { value: 'acknowledged', label: 'Reconocidas' },
  { value: 'resolved', label: 'Resueltas' },
  { value: 'all', label: 'Todas' },
]

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

function severityStyle(severity) {
  if (severity === 'CRITICAL') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (severity === 'WARNING') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function severityLabel(severity) {
  if (severity === 'CRITICAL') return 'Crítica'
  if (severity === 'WARNING') return 'Advertencia'
  return 'Informativa'
}

function stateStyle(state) {
  if (state === 'RESUELTA') return 'bg-emerald-100 text-emerald-700'
  if (state === 'RECONOCIDA') return 'bg-violet-100 text-violet-700'
  return 'bg-rose-100 text-rose-700'
}

function stateLabel(state) {
  if (state === 'RESUELTA') return 'Resuelta'
  if (state === 'RECONOCIDA') return 'Reconocida'
  return 'Activa'
}

export function NotificationsContent() {
  const toast = useToast()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('active')
  const [reviewer, setReviewer] = useState('all')
  const [reviewers, setReviewers] = useState([])
  const [summary, setSummary] = useState({ active: 0, acknowledged: 0, critical: 0, resolved: 0 })
  const [pagination, setPagination] = useState({ pagina: 1, tamanoPagina: 10, total: 0, totalPaginas: 0 })
  const [page, setPage] = useState(1)
  const [isAdministrator, setIsAdministrator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (error) {
      toast.error(error)
      setError('')
    }
  }, [error, toast])

  const loadNotifications = useCallback(async ({ background = false } = {}) => {
    if (!background) setLoading(true)
    setError('')
    try {
      const result = await listNotificationsRequest({ status: filter, reviewer, page, pageSize: 10 })
      setNotifications(result.notificaciones || [])
      setReviewers(result.revisores || [])
      setSummary(result.resumen || { active: 0, acknowledged: 0, critical: 0, resolved: 0 })
      setPagination(result.paginacion || { pagina: page, tamanoPagina: 10, total: 0, totalPaginas: 0 })
      setIsAdministrator(Boolean(result.esAdministrador))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      if (!background) setLoading(false)
    }
  }, [filter, page, reviewer])

  useEffect(() => {
    loadNotifications()
    const intervalId = window.setInterval(() => loadNotifications({ background: true }), 15_000)
    return () => window.clearInterval(intervalId)
  }, [loadNotifications])

  const displayedNotifications = useMemo(() => notifications, [notifications])

  const acknowledge = async (notification) => {
    setBusyId(notification.id)
    try {
      await acknowledgeNotificationRequest(notification.id)
      await loadNotifications({ background: true })
      toast.success('Incidente reconocido. Ahora solo lo verán el responsable y los administradores.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const dismiss = async (notification) => {
    setBusyId(notification.id)
    try {
      await dismissNotificationRequest(notification.id)
      await loadNotifications({ background: true })
      toast.success('Aviso eliminado de tu lista.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const review = async (notification) => {
    setBusyId(notification.id)
    try {
      await reviewNotificationRequest(notification.id)
      await loadNotifications({ background: true })
      toast.success('Notificación marcada como revisada.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const openManualTest = async (notification) => {
    const match = String(notification.tipo || '').match(/^PRUEBA_CONTROL_MANUAL_(SENSOR|ACTUADOR)_(\d+)$/)
    if (!match) return
    if (!notification.revisada) await reviewNotificationRequest(notification.id)
    navigate(`/dashboard/control-manual/${match[1] === 'ACTUADOR' ? 'valvulas' : 'pruebas'}?prueba=${match[2]}&calificar=1`)
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Supervisión inteligente</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Gestión de alertas</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Los incidentes se priorizan, evitan eventos transitorios y se resuelven automáticamente cuando el cultivo o hardware se recupera.
          </p>
        </div>
        <button type="button" onClick={() => loadNotifications()} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Incidentes activos" value={summary.active} icon={TriangleAlert} tone="text-rose-700 bg-rose-50" />
        <Metric label="Críticos" value={summary.critical} icon={Bell} tone="text-rose-700 bg-rose-50" />
        <Metric label="Reconocidos" value={summary.acknowledged} icon={ShieldCheck} tone="text-violet-700 bg-violet-50" />
        <Metric label="Resueltos" value={summary.resolved} icon={CheckCircle2} tone="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button key={item.value} type="button" onClick={() => { setFilter(item.value); setPage(1); if (item.value !== 'all') setReviewer('all') }} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === item.value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {item.label}
          </button>
        ))}
        {isAdministrator && filter === 'all' ? (
          <select value={reviewer} onChange={(event) => { setReviewer(event.target.value); setPage(1) }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 outline-none focus:border-violet-500">
            <option value="all">Cualquier revisor</option>
            <option value="unreviewed">Sin revisar</option>
            {reviewers.map((item) => <option key={item.id} value={item.id}>Revisadas por {item.nombre}</option>)}
          </select>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">Evaluando sensores e incidentes...</div>
        ) : displayedNotifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
            <p className="mt-3 font-semibold text-slate-800">No hay incidentes en esta sección.</p>
          </div>
        ) : displayedNotifications.map((notification) => (
          <article key={notification.id} className={`rounded-xl border bg-white p-5 shadow-sm ${notification.estado === 'ACTIVA' ? 'border-rose-200' : 'border-slate-200'}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${severityStyle(notification.severidad)}`}>
                {notification.severidad === 'INFO' ? <Bell size={20} /> : <TriangleAlert size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-950">{notification.titulo}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${stateStyle(notification.estado)}`}>{stateLabel(notification.estado)}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${severityStyle(notification.severidad)}`}>{severityLabel(notification.severidad)}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{notification.categoria}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{notification.mensaje}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} /> Desde {formatDate(notification.fechaPrimeraDeteccion)}</span>
                  {['HARDWARE','CULTIVO'].includes(notification.categoria) ? <span>{notification.ocurrencias} detecciones del monitor</span> : null}
                  {notification.correoEnviado ? <span className="inline-flex items-center gap-1 text-emerald-700"><MailCheck size={13} /> Correo enviado</span> : null}
                  {notification.estadoCorreo === 'FALLIDO' ? <span className="inline-flex items-center gap-1 text-rose-700"><MailWarning size={13} /> Correo pendiente por error SMTP</span> : null}
                  {notification.estadoCorreo === 'PENDIENTE' ? <span className="inline-flex items-center gap-1 text-amber-700"><MailWarning size={13} /> Correo en cola</span> : null}
                </div>
                {notification.estado === 'RECONOCIDA' ? (
                  <p className="mt-2 text-xs font-semibold text-violet-700">Reconocida por {notification.reconocidoPorNombre || 'un responsable'} · {formatDate(notification.fechaReconocimiento)}</p>
                ) : null}
                {notification.estado !== 'RECONOCIDA' && notification.revisadaPorNombre ? <p className="mt-2 text-xs font-semibold text-sky-700">Revisada por {notification.revisadaPorNombre} · {formatDate(notification.fechaRevision)}</p> : null}
                {notification.estado === 'RESUELTA' ? <p className="mt-2 text-xs font-semibold text-emerald-700">Resuelta automáticamente · {formatDate(notification.fechaResolucion)}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {String(notification.tipo||'').startsWith('PRUEBA_CONTROL_MANUAL_')?<button type="button" disabled={busyId===notification.id} onClick={()=>openManualTest(notification)} className="inline-flex items-center gap-2 rounded-full bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"><Eye size={14}/>Calificar prueba</button>:null}
                {notification.estado === 'ACTIVA' ? (
                  notification.severidad === 'INFO' ? (
                    !notification.revisada ? <button type="button" disabled={busyId === notification.id} onClick={() => review(notification)} className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"><Eye size={14} /> Marcar revisada</button> : null
                  ) : <button type="button" disabled={busyId === notification.id} onClick={() => acknowledge(notification)} className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><ShieldCheck size={14} /> Reconocer</button>
                ) : null}
                {notification.descartable ? (
                  <button type="button" disabled={busyId === notification.id} onClick={() => dismiss(notification)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                    <Trash2 size={14} /> Ocultar
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {pagination.totalPaginas > 1 ? (
        <nav aria-label="Paginación de notificaciones" className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPaginas }, (_, index) => index + 1).map((number) => (
            <button key={number} type="button" onClick={() => setPage(number)} aria-current={page === number ? 'page' : undefined} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold ${page === number ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{number}</button>
          ))}
        </nav>
      ) : null}
      <p className="mt-3 text-center text-xs text-slate-500">{pagination.total} notificación{pagination.total === 1 ? '' : 'es'} · 10 por página</p>
    </section>
  )
}

function Metric({ label, value, icon: Icon, tone }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">{label}</p><span className={`rounded-xl p-2 ${tone}`}><Icon size={18} /></span></div><p className="mt-3 text-3xl font-black text-slate-950">{value}</p></div>
}
