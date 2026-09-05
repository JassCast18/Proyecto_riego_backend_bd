import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, CircleOff, ListFilter, Power, RefreshCcw, Wifi } from 'lucide-react'
import { listHardwareStateRequest, listTelemetryHardwareRequest, switchNodeEnergyRequest } from '../../auth/hardware.service'
import { useToast } from '@/context/useToast.js'
import { getActiveProject,getCropParametersRequest } from '@/auth/projects.service.js'

function getStatusTone(status) {
  const normalized = String(status || '').toUpperCase()

  if (normalized === 'OK') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (normalized === 'WARNING') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (normalized === 'ERROR') return 'bg-red-100 text-red-800 border-red-200'
  if (normalized === 'OFFLINE') return 'bg-slate-200 text-slate-700 border-slate-300'
  if (normalized === 'EN_REVISION') return 'bg-sky-100 text-sky-800 border-sky-200'
  if (normalized === 'REQUIERE_REPARACION') return 'bg-amber-100 text-amber-900 border-amber-300'

  return 'bg-sky-100 text-sky-800 border-sky-200'
}

function formatDate(value) {
  if (!value) return 'Sin datos'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatReading(value) {
  if (value === null || value === undefined || value === '') return 'Sin dato'

  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) return String(value)

  return numberValue.toFixed(2)
}

export function HardwareStatusContent() {
  const toast = useToast()
  const [nodes, setNodes] = useState([])
  const [telemetrias, setTelemetrias] = useState([])
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [loadingTelemetrias, setLoadingTelemetrias] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pendingNode, setPendingNode] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [cycle, setCycle] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalRegistros: 0, totalPaginas: 0, idNodo: null })

  useEffect(() => {
    if (message) {
      toast.success(message)
      setMessage('')
    }
  }, [message, toast])

  useEffect(() => {
    if (error) {
      toast.error(error)
      setError('')
    }
  }, [error, toast])

  const loadNodes = useCallback(async ({ background = false } = {}) => {
    if (!background) setLoadingNodes(true)
    setError('')

    try {
      const result = await listHardwareStateRequest()
      setNodes(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      if (!background) setLoadingNodes(false)
    }
  }, [])

  const loadTelemetrias = async ({ nodeId = selectedNodeId, page = 1 } = {}) => {
    setLoadingTelemetrias(true)
    setError('')

    try {
      const result = await listTelemetryHardwareRequest({
        idNodo: nodeId,
        page,
        limit: pagination.limit,
      })

      setTelemetrias(result.telemetrias)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
      setTelemetrias([])
    } finally {
      setLoadingTelemetrias(false)
    }
  }

  useEffect(() => {
    loadNodes()
    const project=getActiveProject()
    if(project?.id)getCropParametersRequest(project.id).then(setCycle).catch(error=>setError(error.message))

    const intervalId = window.setInterval(() => {
      loadNodes({ background: true })
    }, 5_000)

    return () => window.clearInterval(intervalId)
  }, [loadNodes])

  useEffect(() => {
    loadTelemetrias({ nodeId: selectedNodeId, page: 1 })
  }, [selectedNodeId])

  const stats = useMemo(() => {
    const total = nodes.length
    const encendidos = nodes.filter((node) => String(node.estadoEnergia).toUpperCase() !== 'APAGADO').length
    const apagados = total - encendidos
    const activos = nodes.filter((node) => String(node.estadoGeneral).toUpperCase() === 'OK').length

    return { total, encendidos, apagados, activos }
  }, [nodes])

  const selectedNode = useMemo(() => {
    if (selectedNodeId === null) return null
    return nodes.find((node) => Number(node.id) === Number(selectedNodeId)) || null
  }, [nodes, selectedNodeId])

  const openToggleModal = (node) => {
    setPendingNode(node)
    setError('')
    setMessage('')
  }

  const closeToggleModal = () => {
    if (savingId) {
      return
    }

    setPendingNode(null)
  }

  const handleToggle = async (node) => {
    const apagado = String(node.estadoEnergia).toUpperCase() === 'APAGADO'

    setSavingId(node.id)
    setError('')
    setMessage('')

    try {
      const nextState = apagado ? 'ENCENDIDO' : 'APAGADO'
      await switchNodeEnergyRequest(node.id, nextState)
      setMessage(apagado ? 'Nodo encendido correctamente.' : 'Nodo apagado correctamente. El gateway podrá leer la instrucción de suspensión.')
      await loadNodes()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingId(null)
      setPendingNode(null)
    }
  }

  const handleSelectNode = (nodeId) => {
    setSelectedNodeId(Number(nodeId))
  }

  const handleSelectAll = () => {
    setSelectedNodeId(null)
  }

  const handleRefreshTelemetry = () => {
    loadTelemetrias({ nodeId: selectedNodeId, page: pagination.page })
  }

  const totalPages = pagination.totalPaginas || 0
  const currentPage = pagination.page || 1

  return (
    <section className={`min-h-[calc(100vh-8rem)] rounded-xl border p-4 shadow-sm md:p-6 ${cycle?.ciclo_id?'border-slate-200 bg-slate-50':'border-slate-300 bg-slate-200'}`}>
      <div className={`mb-5 rounded-xl border px-4 py-3 ${cycle?.ciclo_id?'border-green-200 bg-green-50 text-green-900':'border-slate-300 bg-slate-300 text-slate-700'}`}><p className="text-xs font-black uppercase tracking-wide">Contexto de telemetría</p><p className="mt-1 font-bold">{cycle?.ciclo_id?`Plantación #${cycle.numero_ciclo} · ${cycle.cultivo}`:'Sin plantación activa · preparación o descanso del terreno'}</p></div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-600">Hardware</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Estado de hardware</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-700">
            Revisa el estado de cada nodo, su última conexión y apaga o reactiva el equipo desde aquí.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadNodes()
            handleRefreshTelemetry()
          }}
          className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCcw size={16} />
          Actualizar todo
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total nodos" value={stats.total} icon={Wifi} />
        <MetricCard label="Nodos encendidos" value={stats.encendidos} icon={CheckCircle2} />
        <MetricCard label="Nodos apagados" value={stats.apagados} icon={CircleOff} />
        <MetricCard label="Nodos OK" value={stats.activos} icon={AlertCircle} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loadingNodes ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Cargando estado de hardware...
          </div>
        ) : nodes.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No hay nodos registrados.
          </div>
        ) : (
          nodes.map((node) => {
            const apagado = String(node.estadoEnergia).toUpperCase() === 'APAGADO'
            const isSelected = Number(selectedNodeId) === Number(node.id)

            return (
              <article
                key={node.id}
                className={`rounded-xl border bg-white p-5 shadow-sm transition ${isSelected ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-200'}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Nodo #{node.id}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{node.tipoNodo}</h2>
                    <p className="text-sm text-slate-600">MAC: {node.direccionMac || 'Sin MAC'}</p>
                  </div>

                  <span className={`max-w-36 break-words rounded-full border px-3 py-1 text-center text-xs font-semibold ${getStatusTone(node.estadoGeneral)}`}>
                    {node.estadoGeneral}
                  </span>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <Row label="Energía" value={node.estadoEnergia || 'ENCENDIDO'} />
                  {(node.componentes || []).map((component) => (
                    <ComponentRow key={component.id} component={component} />
                  ))}
                  {(node.componentes || []).length === 0 ? (
                    <Row label="Sensores" value="No hay sensores asociados" />
                  ) : null}
                  <Row label="Última conexión" value={formatDate(node.ultimaConexion)} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectNode(node.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isSelected ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <ListFilter size={16} />
                    Listar nodo
                  </button>

                  <button
                    type="button"
                    onClick={() => openToggleModal(node)}
                    disabled={savingId === node.id}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${apagado ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                  >
                    <Power size={16} />
                    {savingId === node.id ? 'Procesando...' : apagado ? 'Encender nodo' : 'Apagar nodo'}
                  </button>

                  {apagado ? (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                      Apagado, listo para suspender sensores
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800">
                      En línea para telemetría
                    </span>
                  )}
                </div>

                {String(node.estadoEnergia).toUpperCase() === 'APAGADO' ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    Cuando este nodo reporte telemetría, la API responderá con la instrucción <span className="font-bold">SUSPENDER</span>.
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Telemetría</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {selectedNode ? `Nodo #${selectedNode.id} · ${selectedNode.tipoNodo}` : 'Todos los nodos'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {pagination.totalRegistros} registros en total, mostrando los más recientes de 15 en 15.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedNodeId === null ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Todos los nodos
            </button>

            <button
              type="button"
              onClick={handleRefreshTelemetry}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Actualizar telemetría
            </button>
          </div>
        </div>

        {loadingTelemetrias ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Cargando telemetría...
          </div>
        ) : telemetrias.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No hay telemetría para el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nodo</th>
                  <th className="px-4 py-3">Sensor</th>
                  <th className="px-4 py-3">Componente</th>
                  <th className="px-4 py-3">Lectura</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {telemetrias.map((telemetria) => {
                  const nodo = nodes.find((item) => Number(item.id) === Number(telemetria.tbNodoId))

                  return (
                    <tr key={telemetria.id} className="hover:bg-cyan-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        #{telemetria.tbNodoId}
                        {nodo ? <span className="ml-2 text-xs font-medium text-slate-500">{nodo.tipoNodo}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{telemetria.tbSensorId}</td>
                      <td className="px-4 py-3 text-slate-700">{telemetria.tipoComponente}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatReading(telemetria.valorLectura)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(telemetria.fechaHora)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Página {currentPage} de {totalPages || 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentPage > 1) {
                  const nextPage = currentPage - 1
                  setPagination((current) => ({ ...current, page: nextPage }))
                  loadTelemetrias({ nodeId: selectedNodeId, page: nextPage })
                }
              }}
              disabled={currentPage <= 1 || loadingTelemetrias}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentPage < (totalPages || 1)) {
                  const nextPage = currentPage + 1
                  setPagination((current) => ({ ...current, page: nextPage }))
                  loadTelemetrias({ nodeId: selectedNodeId, page: nextPage })
                }
              }}
              disabled={currentPage >= (totalPages || 1) || loadingTelemetrias || totalPages === 0}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {pendingNode ? (
        <ConfirmationModal
          node={pendingNode}
          saving={savingId === pendingNode.id}
          onCancel={closeToggleModal}
          onConfirm={() => handleToggle(pendingNode)}
        />
      ) : null}
    </section>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
      </div>
      <p className="text-3xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value || 'Sin datos'}</span>
    </div>
  )
}

function ComponentRow({ component }) {
  const reading = component.ultimaLectura === null || component.ultimaLectura === undefined
    ? 'Sin lectura'
    : formatReading(component.ultimaLectura)

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 break-words font-semibold text-slate-900">{component.tipoComponente}</span>
        <span className={`max-w-full break-words rounded-full border px-2 py-0.5 text-center text-[11px] font-bold ${getStatusTone(component.estado)}`}>
          {String(component.estado).replaceAll('_',' ')}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-600">Lectura: {reading}</p>
      <p className="mt-1 text-xs text-slate-500">{component.mensaje}</p>
    </div>
  )
}

function ConfirmationModal({ node, saving, onCancel, onConfirm }) {
  const apagado = String(node.estadoEnergia).toUpperCase() === 'APAGADO'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${apagado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <AlertCircle size={20} />
          </span>

          <div>
            <h3 className="text-lg font-bold text-slate-950">
              {apagado ? 'Encender nodo' : 'Apagar nodo'}
            </h3>
            <p className="text-sm text-slate-600">
              {apagado
                ? `¿Seguro que deseas encender ${node.tipoNodo}?`
                : `¿Seguro que deseas apagar ${node.tipoNodo}?`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          {apagado
            ? 'El nodo volverá a reportar telemetría cuando se reactive.'
            : 'Al apagarlo, el gateway podrá interpretar la instrucción de suspensión.'}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${apagado ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {saving ? 'Procesando...' : apagado ? 'Encender' : 'Apagar'}
          </button>
        </div>
      </div>
    </div>
  )
}
