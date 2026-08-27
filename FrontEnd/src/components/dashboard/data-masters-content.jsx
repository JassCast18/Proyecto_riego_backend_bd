import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, PlusCircle, PencilLine, RefreshCcw, Trash2 } from 'lucide-react'
import {
  createMasterRecordRequest,
  deleteMasterRecordRequest,
  listMasterRecordsRequest,
  updateMasterRecordRequest,
  getRoleAccessRequest,
  saveRoleAccessRequest,
} from '../../auth/masters.service'
import { useAuth } from '@/context/useAuth.js'
import { useToast } from '@/context/useToast.js'

const MASTER_DEFINITIONS = [
  {
    key: 'finca',
    label: 'Finca',
    description: 'Administración de fincas y sus clientes propietarios.',
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
    description: 'Personas propietarias de las fincas administradas.',
    permissionKey: 'cliente.view',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre_completo', label: 'Propietario' },
      { key: 'nit', label: 'NIT' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'telefono', label: 'Teléfono' },
    ],
    fields: [
      { name: 'nombres', label: 'Nombres del propietario', type: 'text', placeholder: 'Ej. Ana María', required: true },
      { name: 'apellidos', label: 'Apellidos del propietario', type: 'text', placeholder: 'Ej. López Pérez', required: true },
      { name: 'nit', label: 'NIT', type: 'text', placeholder: '900123456-7' },
      { name: 'direccion', label: 'Dirección', type: 'text', placeholder: 'Dirección del cliente', required: true },
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
      { key: 'modulos_asignados', label: 'Módulos' },
      { key: 'submodulos_asignados', label: 'Submódulos' },
    ],
    fields: [
      { name: 'nombre_rol', label: 'Nombre del rol', type: 'text', placeholder: 'Ej. Supervisor' },
    ],
  },
  {
    key: 'modulos',
    label: 'Módulos',
    description: 'Secciones principales disponibles para asignar a los roles.',
    permissionKey: 'modulos_catalogo.view',
    columns: [
      { key: 'id', label: 'ID' }, { key: 'codigo_modulo', label: 'Código' },
      { key: 'nombre_modulo', label: 'Nombre' }, { key: 'ruta', label: 'Ruta' },
      { key: 'sn_activo', label: 'Activo' },
    ],
    fields: [
      { name: 'codigo_modulo', label: 'Código del módulo', type: 'text' },
      { name: 'nombre_modulo', label: 'Nombre del módulo', type: 'text' },
      { name: 'descripcion', label: 'Descripción', type: 'text' },
      { name: 'icono', label: 'Nombre del icono', type: 'text' },
      { name: 'ruta', label: 'Ruta', type: 'text' },
      { name: 'orden', label: 'Orden', type: 'number', defaultValue: 1 },
      { name: 'sn_activo', label: 'Estado del módulo', type: 'booleanToggle', defaultValue: true },
    ],
  },
  {
    key: 'submodulos',
    label: 'Submódulos',
    description: 'Opciones específicas que dependen de cada módulo.',
    permissionKey: 'submodulos_catalogo.view',
    columns: [
      { key: 'id', label: 'ID' }, { key: 'tb_modulo_id', label: 'Módulo', source: 'modulos' },
      { key: 'codigo_submodulo', label: 'Código' }, { key: 'nombre_submodulo', label: 'Nombre' },
      { key: 'sn_activo', label: 'Activo' },
    ],
    fields: [
      { name: 'tb_modulo_id', label: 'Módulo padre', type: 'select', source: 'modulos' },
      { name: 'codigo_submodulo', label: 'Código del submódulo', type: 'text' },
      { name: 'nombre_submodulo', label: 'Nombre del submódulo', type: 'text' },
      { name: 'descripcion', label: 'Descripción', type: 'text' },
      { name: 'ruta', label: 'Ruta', type: 'text' },
      { name: 'orden', label: 'Orden', type: 'number', defaultValue: 1 },
      { name: 'sn_activo', label: 'Estado del submódulo', type: 'booleanToggle', defaultValue: true },
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
      { name: 'estado_energia', label: 'Estado de energía', type: 'toggle', defaultValue: 'ENCENDIDO' },
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
      return record.nombre_completo || `Cliente #${record.id}`
    case 'roles':
      return record.nombre_rol || `Rol #${record.id}`
    case 'modulos':
      return record.nombre_modulo || `Módulo #${record.id}`
    case 'submodulos':
      return record.nombre_submodulo || `Submódulo #${record.id}`
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
    accumulator[field.name] = field.defaultValue ?? ''
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
  const toast = useToast()
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
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState(null)
  const [roleModules, setRoleModules] = useState([])

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

  useEffect(() => {
    setForm(getDefaultForm(currentDefinition))
    setEditingId(null)
    setPendingDeleteRecord(null)
    if (currentDefinition.key === 'roles') {
      getRoleAccessRequest().then(setRoleModules).catch((requestError) => setError(requestError.message))
    }
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

      if (currentDefinition.key === 'roles') {
        const accessPayload = {
          nombre_rol: form.nombre_rol,
          modulos: roleModules.filter((module) => module.seleccionado).map((module) => module.id),
          submodulos: roleModules.flatMap((module) => module.submodulos || []).filter((submodule) => submodule.seleccionado).map((submodule) => submodule.id),
        }
        await saveRoleAccessRequest(editingId, accessPayload)
        setMessage(editingId ? 'Rol y accesos actualizados correctamente.' : 'Rol y accesos creados correctamente.')
      } else if (editingId) {
        await updateMasterRecordRequest(currentDefinition.key, editingId, payload)
        setMessage('Registro actualizado correctamente.')
      } else {
        await createMasterRecordRequest(currentDefinition.key, payload)
        setMessage('Registro creado correctamente.')
      }

      await reloadAllData()
      setForm(getDefaultForm(currentDefinition))
      setEditingId(null)
      if (currentDefinition.key === 'roles') setRoleModules(await getRoleAccessRequest())
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (record) => {
    const nextForm = getDefaultForm(currentDefinition)

    currentDefinition.fields.forEach((field) => {
      nextForm[field.name] = record[field.name] ?? ''
    })

    nextForm.id = record.id
    setForm(nextForm)
    setEditingId(record.id)
    setMessage('')
    setError('')
    if (currentDefinition.key === 'roles') {
      try { setRoleModules(await getRoleAccessRequest(record.id)) }
      catch (requestError) { setError(requestError.message) }
    }
  }

  const openDeleteModal = (record) => {
    setPendingDeleteRecord(record)
    setError('')
    setMessage('')
  }

  const closeDeleteModal = () => {
    if (saving) {
      return
    }

    setPendingDeleteRecord(null)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteRecord) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteMasterRecordRequest(currentDefinition.key, pendingDeleteRecord.id)
      await reloadAllData()
      setMessage('Registro eliminado correctamente.')
      setPendingDeleteRecord(null)

      if (editingId === pendingDeleteRecord.id) {
        setForm(getDefaultForm(currentDefinition))
        setEditingId(null)
      }
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
    if (currentDefinition.key === 'roles') getRoleAccessRequest().then(setRoleModules).catch((requestError) => setError(requestError.message))
  }

  const toggleRoleModule = (moduleId) => {
    setRoleModules((current) => current.map((module) => {
      if (module.id !== moduleId) return module
      const selected = !module.seleccionado
      return { ...module, seleccionado: selected, submodulos: selected ? module.submodulos : (module.submodulos || []).map((submodule) => ({ ...submodule, seleccionado: false })) }
    }))
  }

  const toggleRoleSubmodule = (moduleId, submoduleId) => {
    setRoleModules((current) => current.map((module) => module.id !== moduleId ? module : {
      ...module,
      seleccionado: true,
      submodulos: (module.submodulos || []).map((submodule) => submodule.id === submoduleId ? { ...submodule, seleccionado: !submodule.seleccionado } : submodule),
    }))
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-600">Datos maestros</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Información base del proyecto</h1>
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
                                : typeof record[column.key] === 'boolean'
                                  ? (record[column.key] ? 'Sí' : 'No')
                                  : record[column.key] ?? '-'}
                          </td>
                        ))}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton icon={PencilLine} label="Editar" onClick={() => handleEdit(record)} />
                            <ActionButton icon={Trash2} label="Eliminar" onClick={() => openDeleteModal(record)} />
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

        <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
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

            {currentDefinition.key === 'roles' ? <RoleAccessSelector modules={roleModules} onToggleModule={toggleRoleModule} onToggleSubmodule={toggleRoleSubmodule} /> : null}

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

      {pendingDeleteRecord ? (
        <DeleteConfirmationModal
          title={currentDefinition.label}
          displayValue={buildDisplayValue(currentDefinition.key, pendingDeleteRecord)}
          saving={saving}
          onCancel={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      ) : null}
    </section>
  )
}

function RoleAccessSelector({ modules, onToggleModule, onToggleSubmodule }) {
  const selectedCount = modules.filter((module) => module.seleccionado).length
  return <fieldset className="space-y-3 border-t border-white/10 pt-4">
    <div><legend className="font-bold text-white">Accesos del rol</legend><p className="mt-1 text-xs text-slate-400">Selecciona los módulos que podrá utilizar. Distintos roles pueden compartir los mismos accesos.</p></div>
    <p className="text-xs font-semibold text-cyan-300">{selectedCount} de {modules.length} módulos seleccionados</p>
    <div className="max-h-[25rem] space-y-2 overflow-y-auto pr-1">
      {modules.map((module) => <div key={module.id} className={`rounded-xl border p-3 ${module.seleccionado ? 'border-cyan-400 bg-slate-800' : 'border-white/10 bg-slate-950'}`}>
        <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={Boolean(module.seleccionado)} onChange={() => onToggleModule(module.id)} className="mt-1 h-4 w-4 accent-cyan-400" /><span><span className="block text-sm font-bold text-white">{module.nombre}</span>{module.descripcion ? <span className="block text-xs text-slate-400">{module.descripcion}</span> : null}</span></label>
        {(module.submodulos || []).length ? <div className="ml-7 mt-3 grid gap-2 sm:grid-cols-2">{module.submodulos.map((submodule) => <label key={submodule.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${submodule.seleccionado ? 'border-cyan-400 bg-cyan-400 font-bold text-slate-950' : 'border-white/10 text-slate-300'}`}><input type="checkbox" checked={Boolean(submodule.seleccionado)} onChange={() => onToggleSubmodule(module.id, submodule.id)} className="h-3.5 w-3.5 accent-slate-950" />{submodule.nombre}</label>)}</div> : null}
      </div>)}
    </div>
  </fieldset>
}

function Field({ field, value, onChange, options }) {
  const isEnabled = String(value).toUpperCase() === 'ENCENDIDO'
  const isBooleanEnabled = value === true || String(value).toLowerCase() === 'true'

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white">
      <span>{field.label}</span>
      {field.type === 'select' ? (
        <select
          name={field.name}
          value={value}
          onChange={onChange}
          required={field.required}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        >
          <option value="">{field.placeholder || 'Selecciona una opción'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === 'toggle' || field.type === 'booleanToggle' ? (
        <button
          type="button"
          role="switch"
          aria-checked={field.type === 'booleanToggle' ? isBooleanEnabled : isEnabled}
          onClick={() => onChange({
            target: {
              name: field.name,
              value: field.type === 'booleanToggle' ? !isBooleanEnabled : (isEnabled ? 'APAGADO' : 'ENCENDIDO'),
            },
          })}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 transition hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        >
          <span className={(field.type === 'booleanToggle' ? isBooleanEnabled : isEnabled) ? 'text-emerald-300' : 'text-slate-300'}>
            {(field.type === 'booleanToggle' ? isBooleanEnabled : isEnabled) ? 'Activo' : 'Inactivo'}
          </span>
          <span
            aria-hidden="true"
            className={`relative h-7 w-12 rounded-full transition-colors ${(field.type === 'booleanToggle' ? isBooleanEnabled : isEnabled) ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${(field.type === 'booleanToggle' ? isBooleanEnabled : isEnabled) ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </span>
        </button>
      ) : (
        <input
          name={field.name}
          type={field.type || 'text'}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
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

function DeleteConfirmationModal({ title, displayValue, saving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <Trash2 size={20} />
          </span>

          <div>
            <h3 className="text-lg font-bold text-slate-950">Eliminar registro</h3>
            <p className="text-sm text-slate-600">¿Seguro que deseas eliminar este registro de {title}?</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {displayValue}
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
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
