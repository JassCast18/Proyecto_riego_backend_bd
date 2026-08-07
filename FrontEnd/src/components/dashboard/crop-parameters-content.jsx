import { useEffect, useState } from 'react'
import { Activity, CalendarDays, ChevronRight, Power, Sprout, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { changeProjectStatusRequest, getCropParametersRequest, listCropParameterHistoryRequest, getActiveProject } from '@/auth/projects.service.js'

const labels = { cultivo_id: 'Cultivo', variedad: 'Variedad', fecha_siembra: 'Fecha de siembra', tiempo_cosecha_dias: 'Cosecha estimada', humedad_minima: 'Humedad mínima', humedad_maxima: 'Humedad máxima', temperatura_minima: 'Temperatura mínima', temperatura_maxima: 'Temperatura máxima' }
const show = (value, suffix = '') => value === null || value === undefined || value === '' ? 'Pendiente' : `${value}${suffix}`
const date = (value) => value ? new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export function CropParametersContent() {
  const navigate = useNavigate()
  const project = getActiveProject()
  const [parameters, setParameters] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canManage = Number(project?.rol_id) === 1

  useEffect(() => {
    if (!project?.id) return
    Promise.all([getCropParametersRequest(project.id), listCropParameterHistoryRequest(project.id)])
      .then(([detail, rows]) => { setParameters(detail); setHistory(rows) })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [project?.id])

  const changeStatus = async () => {
    setSaving(true); setError('')
    try {
      await changeProjectStatusRequest(project.id, false)
      localStorage.removeItem('activeProject')
      window.dispatchEvent(new Event('project:changed'))
      navigate('/proyectos', { replace: true })
    } catch (statusError) { setError(statusError.message); setConfirmStatus(false) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="rounded-xl bg-white p-8 text-slate-600">Consultando parametrización…</div>

  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-green-700">Proyecto: {parameters?.proyecto}</p><h1 className="mt-1 text-3xl font-black text-slate-950">Parametrización de cultivo</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Información de consulta. Las futuras calibraciones de la IA crearán una nueva entrada sin borrar la carga inicial.</p></div>{canManage ? <button onClick={() => setConfirmStatus(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"><Power size={17} />Desactivar proyecto</button> : null}</div>
    {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Parameter icon={Sprout} label="Cultivo" value={show(parameters?.cultivo)} source="Carga inicial" />
      <Parameter icon={Sprout} label="Variedad" value={show(parameters?.variedad)} source={parameters?.variedad ? 'Usuario / EcoCrop' : 'Pendiente de aprendizaje'} />
      <Parameter icon={CalendarDays} label="Fecha de siembra" value={parameters?.fecha_siembra || 'Pendiente'} source={parameters?.fecha_siembra ? 'Usuario' : 'Sin referencia temporal'} />
      <Parameter icon={Activity} label="Cosecha estimada" value={show(parameters?.tiempo_cosecha_dias, ' días')} source="Referencia inicial" />
      <Parameter label="Humedad mínima" value={show(parameters?.humedad_minima, ' %')} source={parameters?.humedad_minima == null ? 'Pendiente de calibración' : 'Carga inicial'} />
      <Parameter label="Humedad máxima" value={show(parameters?.humedad_maxima, ' %')} source={parameters?.humedad_maxima == null ? 'Pendiente de calibración' : 'Carga inicial'} />
      <Parameter label="Temperatura mínima" value={show(parameters?.temperatura_minima, ' °C')} source="Referencia inicial" />
      <Parameter label="Temperatura máxima" value={show(parameters?.temperatura_maxima, ' °C')} source="Referencia inicial" />
    </div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Historial de parametrización</h2><p className="text-sm text-slate-500">Selecciona una fila para revisar los valores registrados.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Evento</th><th className="px-5 py-3">Origen</th><th className="px-5 py-3">Confianza</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{history.map((row) => <tr key={row.id} onClick={() => setSelectedHistory(row)} className="cursor-pointer hover:bg-slate-50"><td className="px-5 py-4">{date(row.fecha_registra)}</td><td className="px-5 py-4 font-semibold">{row.tipo_evento}</td><td className="px-5 py-4">{row.origen}</td><td className="px-5 py-4">{row.nivel_confianza == null ? '—' : `${row.nivel_confianza}%`}</td><td className="px-5 py-4 text-right"><ChevronRight size={18} /></td></tr>)}</tbody></table></div></div>
    {selectedHistory ? <HistoryModal row={selectedHistory} onClose={() => setSelectedHistory(null)} /> : null}
    {confirmStatus ? <ConfirmModal saving={saving} onCancel={() => setConfirmStatus(false)} onConfirm={changeStatus} /> : null}
  </section>
}

function Parameter({ icon: Icon, label, value, source }) { return <article className="rounded-xl border border-slate-200 bg-white p-5">{Icon ? <Icon className="mb-4 text-green-700" size={21} /> : null}<p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-xl font-black ${value === 'Pendiente' ? 'text-amber-600' : 'text-slate-950'}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{source}</p></article> }

function HistoryModal({ row, onClose }) { const values = row.valores_nuevos || {}; return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><h3 className="text-xl font-black">{row.tipo_evento}</h3><p className="text-sm text-slate-500">{date(row.fecha_registra)} · {row.origen}</p></div><button onClick={onClose}><X /></button></div><div className="grid gap-3 p-6 sm:grid-cols-2">{Object.entries(values).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{labels[key] || key.replaceAll('_', ' ')}</p><p className="mt-1 font-semibold">{show(value)}</p></div>)}<div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-500">Motivo</p><p className="mt-1 text-sm">{row.motivo || 'Sin observaciones adicionales.'}</p></div></div></div></div> }

function ConfirmModal({ saving, onCancel, onConfirm }) { return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-xl font-black">¿Desactivar este proyecto?</h3><p className="mt-2 text-sm text-slate-600">Dejará de aparecer entre los proyectos activos. La parametrización, telemetría e historial se conservarán.</p><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} disabled={saving} className="rounded-lg border px-4 py-2 font-semibold">Cancelar</button><button onClick={onConfirm} disabled={saving} className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white">{saving ? 'Desactivando…' : 'Sí, desactivar'}</button></div></div></div> }
