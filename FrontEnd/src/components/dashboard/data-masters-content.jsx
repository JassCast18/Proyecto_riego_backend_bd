import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Database, PlusCircle, PencilLine, RefreshCcw, Trash2 } from 'lucide-react'
import {
  createMasterRecordRequest,
  deleteMasterRecordRequest,
  listMasterRecordsRequest,
  updateMasterRecordRequest,
} from '../../auth/masters.service'
import { useAuth } from '@/context/useAuth.js'

const MASTER_DEFINITIONS = [
  {
    key: 'finca',
    label: 'Finca',
    description: 'Administración de fincas asociadas a clientes.',
    permissionKey: 'finca.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'tb_cliente_id', label: 'Cliente', source: 'cliente' },
      { key: 'ubicacion_geografica', label: 'Ubicación geográfica' },
    ],
    fields: [
      { name: 'tb_cliente_id', label: 'Cliente', type: 'select', source: 'cliente', placeholder: 'Selecciona un cliente' },
      { name: 'ubicacion_geografica', label: 'Ubicación geográfica', type: 'text', placeholder: 'Ej. Vereda El Progreso' },
    ],
  },
  {
    key: 'sector',
    label: 'Sector',
    description: 'Sectores que dependen de una finca.',
    permissionKey: 'sector.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'tb_finca_id', label: 'Finca', source: 'finca' },
      { key: 'nombre_sector', label: 'Nombre del sector' },
    ],
    fields: [
      { name: 'tb_finca_id', label: 'Finca', type: 'select', source: 'finca', placeholder: 'Selecciona una finca' },
      { name: 'nombre_sector', label: 'Nombre del sector', type: 'text', placeholder: 'Ej. Sector Norte' },
    ],
  },
  {
    key: 'cliente',
    label: 'Cliente',
    description: 'Clientes vinculados al sistema.',
    permissionKey: 'cliente.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'tb_persona_id', label: 'Persona', source: 'persona' },
      { key: 'nit', label: 'NIT' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'telefono', label: 'Teléfono' },
    ],
    fields: [
      { name: 'tb_persona_id', label: 'Persona', type: 'number', placeholder: 'ID de persona (opcional)' },
      { name: 'nit', label: 'NIT', type: 'text', placeholder: '900123456-7' },
      { name: 'direccion', label: 'Dirección', type: 'text', placeholder: 'Dirección del cliente' },
      { name: 'telefono', label: 'Teléfono', type: 'text', placeholder: '3001234567' },
    ],
  },
  {
    key: 'roles',
    label: 'Roles',
    description: 'Catálogo de roles del sistema.',
    permissionKey: 'roles.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre_rol', label: 'Nombre del rol' },
    ],
    fields: [
      { name: 'nombre_rol', label: 'Nombre del rol', type: 'text', placeholder: 'Ej. Supervisor' },
    ],
  },
  {
    key: 'nodos',
    label: 'Nodos',
    description: 'Nodos IoT conectados a cada sector.',
    permissionKey: 'nodos.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'tb_sector_id', label: 'Sector', source: 'sector' },
      { key: 'tipo_nodo', label: 'Tipo' },
      { key: 'direccion_mac', label: 'MAC' },
      { key: 'estado_energia', label: 'Energía' },
    ],
    fields: [
      { name: 'tb_sector_id', label: 'Sector', type: 'select', source: 'sector', placeholder: 'Selecciona un sector' },
      { name: 'tipo_nodo', label: 'Tipo de nodo', type: 'text', placeholder: 'Ej. ESP32 maestro' },
      { name: 'direccion_mac', label: 'Dirección MAC', type: 'text', placeholder: 'AA:BB:CC:DD:EE:FF' },
      { name: 'estado_energia', label: 'Estado de energía', type: 'text', placeholder: 'Encendido / Apagado' },
    ],
  },
  {
    key: 'sensores',
    label: 'Sensores',
    description: 'Sensores y actuadores instalados por nodo.',
    permissionKey: 'sensores.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'tb_nodo_id', label: 'Nodo', source: 'nodos' },
      { key: 'tipo_componente', label: 'Tipo de componente' },
    ],
    fields: [
      { name: 'tb_nodo_id', label: 'Nodo', type: 'select', source: 'nodos', placeholder: 'Selecciona un nodo' },
      { name: 'tipo_componente', label: 'Tipo de componente', type: 'text', placeholder: 'Ej. Higrometro_A0' },
    ],
  },
]

function buildDisplayValue(masterKey, record) {
  if (!record) {
    return ''
  }

  switch (masterKey) {
    case 'finca':
      return `Finca #${record.id} · ${record.ubicacion_geografica || 'Sin ubicación'}`
    case 'sector':
      return `Sector #${record.id} · ${record.nombre_sector || 'Sin nombre'}`
    case 'cliente':
      return `Cliente #${record.id} · ${record.nit || record.direccion || 'Sin dato'}`
    case 'roles':
      return record.nombre_rol || `Rol #${record.id}`
    case 'nodos':
      return `Nodo #${record.id} · ${record.tipo_nodo || 'Sin tipo'}`
    case 'sensores':
      return `Sensor #${record.id} · ${record.tipo_componente || 'Sin tipo'}`
    default:
      return `Registro #${record.id}`
  }
}

function getDefaultForm(definition) {
  return definition.fields.reduce((accumulator, field) => {
    accumulator[field.name] = ''
    return accumulator
  }, { id: null })
}

function hasPermission(permissions, key) {
  if (permissions.size === 0) {
    return true
  }

  return permissions.has(key)
}

export function DataMastersContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const permissions = useMemo(() => new Set(user?.permisos || []), [user?.permisos])

  const visibleMasters = useMemo(
    () => MASTER_DEFINITIONS.filter((definition) => hasPermission(permissions, definition.permissionKey)),
    [permissions],
  )

  const currentKeyFromRoute = location.pathname.split('/').filter(Boolean).at(-1)
  const currentDefinition =
    visibleMasters.find((definition) => definition.key === currentKeyFromRoute) ||
    visibleMasters[0] ||
    MASTER_DEFINITIONS[0]

  const [recordsByKey, setRecordsByKey] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(getDefaultForm(currentDefinition))
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    setForm(getDefaultForm(currentDefinition))
    setEditingId(null)
  }, [currentDefinition.key])

  useEffect(() => {
    let active = true

    const loadAllMasters = async () => {
      setLoading(true)
      setError('')

      try {
        const resultEntries = await Promise.all(
          MASTER_DEFINITIONS.map(async (definition) => [definition.key, await listMasterRecordsRequest(definition.key)]),
        )

        if (active) {
          setRecordsByKey(Object.fromEntries(resultEntries))
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAllMasters()

    return () => {
      active = false
    }
  }, [])

  const currentRecords = recordsByKey[currentDefinition.key] || []

  const optionSets = useMemo(() => {
    return MASTER_DEFINITIONS.reduce((accumulator, definition) => {
      accumulator[definition.key] = (recordsByKey[definition.key] || []).map((record) => ({
        value: record.id,
        label: buildDisplayValue(definition.key, record),
      }))

      return accumulator
    }, {})
  }, [recordsByKey])

  const reloadCurrentData = async () => {
    const result = await listMasterRecordsRequest(currentDefinition.key)

    setRecordsByKey((current) => ({
      ...current,
      [currentDefinition.key]: result,
    }))
  }

  const reloadAllData = async () => {
    const resultEntries = await Promise.all(
      MASTER_DEFINITIONS.map(async (definition) => [definition.key, await listMasterRecordsRequest(definition.key)]),
    )

    setRecordsByKey(Object.fromEntries(resultEntries))
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([key, value]) => key !== 'id' && value !== ''),
      )

      if (editingId) {
        await updateMasterRecordRequest(currentDefinition.key, editingId, payload)
        setMessage('Registro actualizado correctamente.')
      } else {
        await createMasterRecordRequest(currentDefinition.key, payload)
        setMessage('Registro creado correctamente.')
      }

      await reloadAllData()
      setForm(getDefaultForm(currentDefinition))
      setEditingId(null)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (record) => {
    const nextForm = getDefaultForm(currentDefinition)

    currentDefinition.fields.forEach((field) => {
      nextForm[field.name] = record[field.name] ?? ''
    })

    nextForm.id = record.id
    setForm(nextForm)
    setEditingId(record.id)
    setMessage('')
    setError('')
  }

  const handleDelete = async (record) => {
    const confirmed = window.confirm(`¿Eliminar ${buildDisplayValue(currentDefinition.key, record)}?`)

    if (!confirmed) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteMasterRecordRequest(currentDefinition.key, record.id)
      await reloadAllData()
      setMessage('Registro eliminado correctamente.')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setForm(getDefaultForm(currentDefinition))
    setEditingId(null)
    setMessage('')
    setError('')
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_24%),linear-gradient(180deg,#f8fbff,#edf6ff)] p-4 shadow-xl shadow-slate-900/5 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-600">Datos maestros</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">ABM dinámico de catálogos</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-700">
            Administra fincas, sectores, clientes, roles, nodos y sensores desde un mismo módulo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleMasters.map((definition) => {
            const active = definition.key === currentDefinition.key

            return (
              <button
                key={definition.key}
                type="button"
                onClick={() => navigate(`/dashboard/maestros/${definition.key}`)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {definition.label}
              </button>
            )
          })}
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{currentDefinition.label}</h2>
              <p className="text-sm text-slate-600">{currentDefinition.description}</p>
            </div>

            <button
              type="button"
              onClick={reloadCurrentData}
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Recargar
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    {currentDefinition.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em]">
                        {column.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={currentDefinition.columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                        Cargando registros...
                      </td>
                    </tr>
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={currentDefinition.columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                        No hay registros en este catálogo.
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80">
                        {currentDefinition.columns.map((column) => (
                          <td key={column.key} className="px-4 py-4 text-slate-700">
                            {column.key === 'id'
                              ? record[column.key]
                              : column.source
                                ? buildDisplayValue(column.source, recordsByKey[column.source]?.find((optionRecord) => optionRecord.id === record[column.key])) || record[column.key] || '-'
                                : record[column.key] || '-'}
                          </td>
                        ))}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton icon={PencilLine} label="Editar" onClick={() => handleEdit(record)} />
                            <ActionButton icon={Trash2} label="Eliminar" onClick={() => handleDelete(record)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/10">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
              {editingId ? <ArrowLeftRight size={22} /> : <PlusCircle size={22} />}
            </span>
            <div>
              <h2 className="text-xl font-bold">{editingId ? 'Editar registro' : 'Nuevo registro'}</h2>
              <p className="text-sm text-slate-300">Completa los campos para guardar el catálogo.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {currentDefinition.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={form[field.name] ?? ''}
                onChange={handleFieldChange}
                options={optionSets[field.source] || []}
              />
            ))}

            <div className="flex justify-end gap-3 pt-2">
              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancelar
                </button>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Atajos</p>
            <p className="mt-1">Inserta un registro nuevo o selecciona editar para modificar un dato existente en la tabla.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ field, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      <span>{field.label}</span>
      {field.type === 'select' ? (
        <select
          name={field.name}
          value={value}
          onChange={onChange}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        >
          <option value="">{field.placeholder || 'Selecciona una opción'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={field.name}
          type={field.type || 'text'}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
      )}
    </label>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <Icon size={14} />
      {label}
    </button>
  )
}