import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Cpu, Droplets, RefreshCcw, Sprout, Thermometer, X } from 'lucide-react'
import { getActiveProject, getCropParametersRequest } from '@/auth/projects.service.js'
import { listHardwareStateRequest, listTelemetryHardwareRequest } from '@/auth/hardware.service.js'
import { listNotificationsRequest } from '@/auth/notifications.service.js'

const isHumidity = (item) => /higrom|humedad/i.test(item.tipoComponente || '')
const isTemperature = (item) => /termometr|temperatura/i.test(item.tipoComponente || '')
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null
const average = (values) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null

function formatDate(value) {
  if (!value) return 'Sin datos'
  return new Date(value).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function relativeTime(value) {
  if (!value) return 'Sin lecturas'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Ahora mismo'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return `Hace ${Math.floor(hours / 24)} días`
}

function latestPerSensor(rows, predicate) {
  const found = new Map()
  rows.filter(predicate).forEach((row) => { if (!found.has(row.tbSensorId)) found.set(row.tbSensorId, number(row.valorLectura)) })
  return [...found.values()].filter((value) => value !== null)
}

export function SummaryContent() {
  const project = getActiveProject()
  const [nodes, setNodes] = useState([])
  const [telemetry, setTelemetry] = useState([])
  const [notifications, setNotifications] = useState([])
  const [crop, setCrop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [plantOpen, setPlantOpen] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!project?.id) return
    setLoading(true); setError('')
    try {
      const [hardware, telemetryResult, activeNotifications, parameters] = await Promise.all([
        listHardwareStateRequest(),
        listTelemetryHardwareRequest({ page: 1, limit: 500 }),
        listNotificationsRequest({ status: 'active', limit: 3 }),
        getCropParametersRequest(project.id),
      ])
      setNodes(hardware); setTelemetry(telemetryResult.telemetrias); setNotifications(activeNotifications); setCrop(parameters?.ciclo_id?parameters:{...parameters,cultivo:null})
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [project?.id])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const dashboard = useMemo(() => {
    const ordered = [...telemetry].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const recent = ordered.filter((item) => new Date(item.fechaHora).getTime() >= cutoff)
    const humiditySeries = recent.filter(isHumidity).map((item) => ({ value: number(item.valorLectura), date: item.fechaHora })).filter((item) => item.value !== null)
    const temperatureSeries = recent.filter(isTemperature).map((item) => ({ value: number(item.valorLectura), date: item.fechaHora })).filter((item) => item.value !== null && item.value > -100)
    const humidityNow = average(latestPerSensor(telemetry, isHumidity))
    const temperatureNow = average(latestPerSensor(telemetry, isTemperature).filter((value) => value > -100))
    const lastReading = ordered.at(-1)?.fechaHora || null
    const firstReference = crop?.fecha_siembra || crop?.fecha_carga || ordered[0]?.fechaHora || null
    const ageDays = firstReference ? Math.max(0, Math.floor((Date.now() - new Date(firstReference).getTime()) / 86400000)) : null
    const configuredCycle = number(crop?.tiempo_cosecha_dias)
    const progress = ageDays === null || !configuredCycle ? null : Math.min(100, Math.round((ageDays / configuredCycle) * 100))
    const recentReading = lastReading && Date.now() - new Date(lastReading).getTime() <= 15 * 60 * 1000
    const hardwareProblem = nodes.some((node) => ['ERROR', 'OFFLINE'].includes(String(node.estadoGeneral).toUpperCase()))
    const plantState = !lastReading ? 'waiting' : hardwareProblem || !recentReading ? 'attention' : 'active'
    const activeNodes = nodes.filter((node) => String(node.estadoEnergia).toUpperCase() !== 'APAGADO' && String(node.estadoGeneral).toUpperCase() === 'OK').length
    return { humiditySeries, temperatureSeries, humidityNow, temperatureNow, lastReading, ageDays, progress, plantState, activeNodes }
  }, [telemetry, nodes, crop])

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500">Preparando datos del proyecto…</div>

  return <div className="mx-auto flex max-w-7xl flex-col gap-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-green-700">{project?.nombre}</p><h1 className="text-3xl font-black text-slate-950">Resumen del proyecto</h1><p className="mt-1 text-sm text-slate-600">Lecturas y estado actual obtenidos directamente de la telemetría.</p></div><button onClick={loadDashboard} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCcw size={16} />Actualizar</button></div>
    {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Humedad del suelo" value={dashboard.humidityNow === null ? 'Sin datos' : dashboard.humidityNow.toFixed(0)} note="Lectura ADC sin calibrar" icon={Droplets} />
      <Metric label="Temperatura del suelo" value={dashboard.temperatureNow === null ? 'Sin datos' : `${dashboard.temperatureNow.toFixed(1)} °C`} note={relativeTime(dashboard.lastReading)} icon={Thermometer} />
      <Metric label="Nodos operando" value={`${dashboard.activeNodes} / ${nodes.length}`} note={nodes.length ? `${nodes.length - dashboard.activeNodes} requieren revisión` : 'Sin nodos registrados'} icon={Cpu} />
      <Metric label="Registros consultados" value={telemetry.length} note="Últimos registros del proyecto" icon={Sprout} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
      <PlantCard crop={crop} dashboard={dashboard} onClick={() => setPlantOpen(true)} />
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart title="Humedad del suelo" subtitle="Lectura cruda ADC · últimas 24 horas" data={dashboard.humiditySeries} color="#0284c7" />
        <LineChart title="Temperatura del suelo" subtitle="Grados Celsius · últimas 24 horas" data={dashboard.temperatureSeries} color="#ea580c" suffix=" °C" />
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-bold text-slate-950">Alertas activas</h2><p className="text-sm text-slate-500">Problemas que todavía requieren atención.</p></div><span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">{notifications.length}</span></div><div className="space-y-3 p-5">{notifications.length ? notifications.map((item) => <div key={item.id} className="flex gap-3 rounded-lg border border-slate-200 p-3"><AlertTriangle size={18} className={item.severidad === 'CRITICA' ? 'text-red-600' : 'text-amber-600'} /><div><p className="text-sm font-bold text-slate-900">{item.titulo}</p><p className="text-xs text-slate-500">{item.mensaje}</p></div></div>) : <p className="py-6 text-center text-sm text-slate-500">No hay alertas activas.</p>}</div></div>
      <div className="rounded-xl border border-slate-200 bg-white"><div className="border-b px-5 py-4"><h2 className="font-bold text-slate-950">Lecturas recientes</h2><p className="text-sm text-slate-500">Últimos datos recibidos de los sensores.</p></div><div className="divide-y divide-slate-100">{telemetry.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-4 px-5 py-3"><span className={`h-2.5 w-2.5 rounded-full ${isTemperature(item) ? 'bg-orange-500' : 'bg-sky-600'}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.tipoComponente} · Nodo #{item.tbNodoId}</p><p className="text-xs text-slate-500">{formatDate(item.fechaHora)}</p></div><strong className="text-sm">{number(item.valorLectura)?.toFixed(2) ?? '—'}{isTemperature(item) ? ' °C' : ''}</strong></div>)}{!telemetry.length ? <p className="p-8 text-center text-sm text-slate-500">Aún no se han recibido lecturas.</p> : null}</div></div>
    </div>
    {plantOpen ? <PlantDetailModal crop={crop} dashboard={dashboard} onClose={() => setPlantOpen(false)} /> : null}
  </div>
}

function Metric({ label, value, note, icon: Icon }) { return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div><span className="rounded-lg bg-green-100 p-2.5 text-green-700"><Icon size={19} /></span></div><p className="mt-3 text-xs text-slate-500">{note}</p></article> }

function LineChart({ title, subtitle, data, color, suffix = '' }) {
  const points = data.length > 60 ? data.filter((_, index) => index % Math.ceil(data.length / 60) === 0 || index === data.length - 1) : data
  const values = points.map((item) => item.value); const min = values.length ? Math.min(...values) : 0; const max = values.length ? Math.max(...values) : 0; const range = max - min || 1
  const polyline = points.map((item, index) => `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${92 - ((item.value - min) / range) * 78}`).join(' ')
  return <article className="rounded-xl border border-slate-200 bg-white p-5"><div><h2 className="font-bold text-slate-950">{title}</h2><p className="text-xs text-slate-500">{subtitle}</p></div>{points.length ? <><div className="mt-5 h-48"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible"><line x1="0" y1="92" x2="100" y2="92" stroke="#e2e8f0" strokeWidth="1" vectorEffect="non-scaling-stroke" /><polyline fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" points={polyline} /></svg></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{formatDate(points[0].date)}</span><strong style={{ color }}>{points.at(-1).value.toFixed(1)}{suffix}</strong><span>{formatDate(points.at(-1).date)}</span></div></> : <div className="flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">Sin lecturas durante las últimas 24 horas.</div>}</article>
}

function PlantCard({ crop, dashboard, onClick }) {
  const state = { waiting: { label: 'Esperando datos', tone: 'text-slate-500', plant: 'plant-waiting' }, attention: { label: 'Requiere atención', tone: 'text-amber-700', plant: 'plant-attention' }, active: { label: 'Activa y monitoreada', tone: 'text-green-700', plant: 'plant-active' } }[dashboard.plantState]
  return <button onClick={onClick} className="group min-h-[22rem] rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-green-300 hover:shadow-md"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Estado del cultivo</p><h2 className="mt-1 text-2xl font-black text-slate-950">{crop?.cultivo || 'Cultivo sin configurar'}</h2><p className={`mt-1 text-sm font-bold ${state.tone}`}>{state.label}</p></div><span className="text-xs text-slate-400">Ver detalle</span></div><div className={`plant-graphic ${state.plant}`} aria-hidden="true"><span className="plant-pot" /><span className="plant-stem" /><span className="plant-leaf plant-leaf-left" /><span className="plant-leaf plant-leaf-right" /><span className="plant-leaf plant-leaf-top" /></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-500">{dashboard.ageDays === null ? 'Edad aún desconocida' : `${dashboard.ageDays} días desde la referencia inicial`}</span>{dashboard.progress !== null ? <strong className="text-green-700">{dashboard.progress}% del ciclo estimado</strong> : null}</div>{dashboard.progress !== null ? <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${dashboard.progress}%` }} /></div> : null}</button>
}

function PlantDetailModal({ crop, dashboard, onClose }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"><div className="w-full max-w-lg rounded-2xl bg-white shadow-xl"><div className="flex items-start justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-green-700">Estado general</p><h3 className="text-2xl font-black">{crop?.cultivo || 'Cultivo'}</h3></div><button onClick={onClose}><X /></button></div><div className="grid gap-3 p-5 sm:grid-cols-2"><Detail label="Variedad" value={crop?.variedad || 'No especificada'} /><Detail label="Fecha de siembra" value={crop?.fecha_siembra || 'No especificada'} /><Detail label="Edad estimada" value={dashboard.ageDays === null ? 'Pendiente' : `${dashboard.ageDays} días`} /><Detail label="Avance del ciclo" value={dashboard.progress === null ? 'Pendiente' : `${dashboard.progress}%`} /><Detail label="Última telemetría" value={relativeTime(dashboard.lastReading)} /><Detail label="Nodos operando" value={`${dashboard.activeNodes}`} /></div><p className="border-t px-5 py-4 text-sm text-slate-600">El estado visual resume disponibilidad de telemetría y hardware. Todavía no representa un diagnóstico biológico realizado por la IA.</p></div></div> }
function Detail({ label, value }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div> }
