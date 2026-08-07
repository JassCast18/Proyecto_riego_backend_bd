import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, KeyRound, PencilLine, Search, Shield, UserMinus, UserPlus } from 'lucide-react'
import {
  createUserRequest,
  changeProjectMembershipRequest,
  listRolesRequest,
  listUsersRequest,
  updatePasswordRequest,
  updateStatusRequest,
  updateUserRequest,
} from '../../auth/users.service'
import { useAuth } from '@/context/useAuth.js'
import { useToast } from '@/context/useToast.js'

const MIN_PASSWORD_LENGTH = 8
const COUNTRY_OPTIONS = [
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: '+52', flag: '🇲🇽', name: 'México' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
]

const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  correo_electronico: '',
  username: '',
  codigo_pais: '+502',
  telefono: '',
  password: '',
  tb_rol_id: '2',
}

const INITIAL_EDIT = {
  id: null,
  nombres: '',
  apellidos: '',
  correo_electronico: '',
  username: '',
  codigo_pais: '',
  telefono: '',
  tb_rol_id: '2',
  sn_activo: true,
}

export function UserManagementContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentSection = location.pathname.includes('/registrar') ? 'register' : 'list'
  const { user: authenticatedUser } = useAuth()
  const toast = useToast()

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('project')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [editForm, setEditForm] = useState(INITIAL_EDIT)
  const [passwordForm, setPasswordForm] = useState({ id: null, password: '', confirmPassword: '' })
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [pendingStatusUser, setPendingStatusUser] = useState(null)
  const [pendingMembershipUser, setPendingMembershipUser] = useState(null)
  const [membershipRoleId, setMembershipRoleId] = useState('2')

  const roleOptions = useMemo(() => {
    if (roles.length > 0) {
      return roles
    }

    return [
      { id: 1, nombre_rol: 'Administrador' },
      { id: 2, nombre_rol: 'Supervisor' },
      { id: 3, nombre_rol: 'Operador' },
    ]
  }, [roles])

  const loadUsers = async (value = search) => {
    setLoading(true)
    try {
      const response = await listUsersRequest(value, scope)
      setUsers(response)
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const result = await listRolesRequest()

        if (active) {
          setRoles(result)
        }
      } catch {
        if (active) {
          setRoles([])
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const delay = setTimeout(() => {
      if (currentSection === 'list') {
        loadUsers(search)
      } else {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(delay)
  }, [search, currentSection, scope])

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target

    setEditForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.correo_electronico.trim() || !form.password) {
      toast.warning('Completa nombre, apellido, correo y contraseña.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.correo_electronico.trim())) {
      toast.warning('Ingresa un correo electrónico válido.')
      return
    }

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      toast.warning(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (form.telefono && !/^\d{7,15}$/.test(form.telefono)) {
      toast.warning('El teléfono debe contener entre 7 y 15 dígitos.')
      return
    }

    setSaving(true)

    try {
      await createUserRequest({
        ...form,
        codigo_pais: form.telefono ? form.codigo_pais : '',
        tb_rol_id: Number(form.tb_rol_id),
      })

      toast.success('Usuario registrado correctamente.')
      setForm(INITIAL_FORM)
      navigate('/dashboard/usuarios/listado')
      await loadUsers('')
    } catch (submitError) {
      toast.error(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (user) => {
    setEditForm({
      id: user.id,
      nombres: user.nombres || '',
      apellidos: user.apellidos || '',
      correo_electronico: user.correoElectronico || '',
      username: user.username || '',
      codigo_pais: user.codigoPais || '+502',
      telefono: user.telefono || '',
      tb_rol_id: String(user.tbRolId || 2),
      sn_activo: Boolean(user.snActivo),
    })
    setEditOpen(true)
  }

  const openPassword = (user) => {
    setPasswordForm({ id: user.id, password: '', confirmPassword: '' })
    setPasswordOpen(true)
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    if (!editForm.nombres || !editForm.apellidos || !editForm.correo_electronico) {
      toast.warning('Completa los campos principales del usuario.')
      return
    }

    if (editForm.telefono && !/^\d{7,15}$/.test(editForm.telefono)) {
      toast.warning('El teléfono debe contener entre 7 y 15 dígitos.')
      return
    }

    setSaving(true)

    try {
      await updateUserRequest(editForm.id, {
        nombres: editForm.nombres,
        apellidos: editForm.apellidos,
        correo_electronico: editForm.correo_electronico,
        codigo_pais: editForm.telefono ? editForm.codigo_pais : '',
        telefono: editForm.telefono,
        tb_rol_id: Number(editForm.tb_rol_id),
        sn_activo: editForm.sn_activo,
      })
      setEditOpen(false)
      toast.success('Usuario actualizado correctamente.')
      await loadUsers(search)
    } catch (submitError) {
      toast.error(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (!passwordForm.password || passwordForm.password.length < MIN_PASSWORD_LENGTH) {
      toast.warning(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (passwordForm.password.length > 72) {
      toast.warning('La contraseña no puede superar los 72 caracteres.')
      return
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.warning('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)

    try {
      await updatePasswordRequest(passwordForm.id, { password: passwordForm.password })
      setPasswordOpen(false)
      toast.success('Contraseña actualizada correctamente.')
    } catch (submitError) {
      toast.error(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user) => {
    if (Number(user.id) === Number(authenticatedUser?.id)) {
      toast.warning('No puedes desactivar el usuario con el que iniciaste sesión.')
      return
    }

    setSaving(true)
    try {
      await updateStatusRequest(user.id, { sn_activo: !user.snActivo })
      await loadUsers(search)
      toast.success(user.snActivo ? 'Usuario desactivado correctamente.' : 'Usuario activado correctamente.')
      setPendingStatusUser(null)
    } catch (submitError) {
      toast.error(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const requestStatusChange = (user) => {
    if (user.snActivo) {
      setPendingStatusUser(user)
      return
    }

    toggleStatus(user)
  }

  const requestMembershipChange = (user) => {
    setMembershipRoleId(String(user.tbRolProyectoId || user.tbRolId || 2))
    setPendingMembershipUser(user)
  }

  const changeMembership = async () => {
    if (!pendingMembershipUser) return
    setSaving(true)
    try {
      await changeProjectMembershipRequest(pendingMembershipUser.id, {
        activo: !pendingMembershipUser.asignadoProyecto,
        rolId: Number(membershipRoleId),
      })
      toast.success(pendingMembershipUser.asignadoProyecto ? 'Usuario retirado del proyecto.' : 'Usuario agregado al proyecto.')
      setPendingMembershipUser(null)
      await loadUsers(search)
    } catch (submitError) {
      toast.error(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const activeUsers = users.filter((user) => user.snActivo).length
  const inactiveUsers = users.length - activeUsers

  return (
    <DashboardFrame>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Gestión de usuarios</p>
          <h1 className="text-3xl font-black text-emerald-950">Usuarios del sistema</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <MetricCard label="Total usuarios" value={users.length} />
          <MetricCard label="Activos" value={activeUsers} />
          <MetricCard label="Inactivos" value={inactiveUsers} />
          <MetricCard label="Roles disponibles" value={roleOptions.length} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/usuarios/listado')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${currentSection === 'list' ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20' : 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'}`}
          >
            Listado de usuarios
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/usuarios/registrar')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${currentSection === 'register' ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20' : 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'}`}
          >
            Registrar usuario
          </button>
        </div>

        {currentSection === 'register' ? (
          <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
            <div className="mb-5">
              <div>
                <h2 className="text-xl font-bold text-emerald-950">Registrar usuario</h2>
                <p className="text-sm text-emerald-900/65">Crea un nuevo acceso para el sistema.</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
              <Field label="Nombres" name="nombres" value={form.nombres} onChange={handleFormChange} required minLength={2} maxLength={100} />
              <Field label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleFormChange} required minLength={2} maxLength={100} />
              <Field label="Correo electrónico" name="correo_electronico" type="email" value={form.correo_electronico} onChange={handleFormChange} required maxLength={100} />
              <Field label="Usuario" name="username" value={form.username} onChange={handleFormChange} maxLength={50} />
              <Field label="Contraseña" name="password" type="password" value={form.password} onChange={handleFormChange} required minLength={MIN_PASSWORD_LENGTH} maxLength={72} />
              <PhoneField codigoPais={form.codigo_pais} telefono={form.telefono} onChange={handleFormChange} />
              <SelectField label="Rol" name="tb_rol_id" value={form.tb_rol_id} onChange={handleFormChange} options={roleOptions} />

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setForm(INITIAL_FORM)}
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Guardando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-950">Listado de usuarios</h2>
                <p className="text-sm text-emerald-900/65">Consulta miembros del proyecto o usuarios globales.</p>
                <div className="mt-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 p-1">
                  <button type="button" onClick={() => setScope('project')} className={`rounded-lg px-3 py-2 text-xs font-bold ${scope === 'project' ? 'bg-emerald-700 text-white' : 'text-emerald-800'}`}>Usuarios del proyecto</button>
                  <button type="button" onClick={() => setScope('global')} className={`rounded-lg px-3 py-2 text-xs font-bold ${scope === 'global' ? 'bg-emerald-700 text-white' : 'text-emerald-800'}`}>Usuarios globales</button>
                </div>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, correo, teléfono, usuario o rol"
                  className="w-full rounded-2xl border border-emerald-200 bg-white py-3 pl-10 pr-4 text-sm text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-emerald-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100 text-left text-sm">
                  <thead className="bg-emerald-50 text-emerald-900">
                    <tr>
                      <Th>Usuario</Th>
                      <Th>Correo</Th>
                      <Th>Rol</Th>
                      <Th>Estado</Th>
                      <Th>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-emerald-900/60">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-emerald-900/60">
                          No hay usuarios que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        const isCurrentUser = Number(user.id) === Number(authenticatedUser?.id)

                        return (
                        <tr key={user.id} className={isCurrentUser ? 'bg-emerald-50' : 'hover:bg-slate-50'}>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-emerald-950">
                              {user.nombreCompleto}
                              {isCurrentUser ? <span className="rounded bg-emerald-700 px-2 py-0.5 text-[11px] font-semibold text-white">Sesión actual</span> : null}
                            </div>
                            <div className="text-xs text-emerald-900/55">{user.username || 'Sin usuario'}</div>
                          </td>
                          <td className="px-4 py-4 text-emerald-900/80">
                            <div>{user.correoElectronico}</div>
                            {user.telefono ? <div className="mt-1 text-xs text-emerald-900/55">{user.codigoPais} {user.telefono}</div> : null}
                          </td>
                          <td className="px-4 py-4 text-emerald-900/80">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${user.asignadoProyecto ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                              {user.asignadoProyecto ? (user.rolProyecto || user.rol || 'Asignado') : 'No existe rol'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.snActivo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                              {user.snActivo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <ActionButton icon={PencilLine} label="Editar" onClick={() => openEdit(user)} />
                              <ActionButton icon={KeyRound} label="Contraseña" onClick={() => openPassword(user)} />
                              <ActionButton
                                icon={user.snActivo ? Shield : Eye}
                                label={user.snActivo ? 'Desactivar' : 'Activar'}
                                onClick={() => requestStatusChange(user)}
                                disabled={isCurrentUser}
                              />
                              <ActionButton
                                icon={user.asignadoProyecto ? UserMinus : UserPlus}
                                label={user.asignadoProyecto ? 'Quitar del proyecto' : 'Agregar al proyecto'}
                                onClick={() => requestMembershipChange(user)}
                                disabled={isCurrentUser && user.asignadoProyecto}
                              />
                            </div>
                          </td>
                        </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {editOpen ? (
        <Modal title="Editar usuario" onClose={() => setEditOpen(false)}>
          <form onSubmit={saveEdit} className="grid gap-4 md:grid-cols-2">
            <Field label="Nombres" name="nombres" value={editForm.nombres} onChange={handleEditChange} />
            <Field label="Apellidos" name="apellidos" value={editForm.apellidos} onChange={handleEditChange} />
            <Field label="Correo electrónico" name="correo_electronico" type="email" value={editForm.correo_electronico} onChange={handleEditChange} />
            <Field label="Usuario" name="username" value={editForm.username} disabled title="El nombre de usuario no se puede modificar." />
            <PhoneField codigoPais={editForm.codigo_pais} telefono={editForm.telefono} onChange={handleEditChange} />
            <SelectField label="Rol" name="tb_rol_id" value={editForm.tb_rol_id} onChange={handleEditChange} options={roleOptions} />

            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {passwordOpen ? (
        <Modal title="Cambiar contraseña" onClose={() => setPasswordOpen(false)}>
          <form onSubmit={savePassword} className="space-y-4">
            <Field
              label="Nueva contraseña"
              name="password"
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={72}
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
            />
            <Field
              label="Confirmar contraseña"
              name="confirmPassword"
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={72}
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setPasswordOpen(false)} className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">
                {saving ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {pendingStatusUser ? (
        <StatusConfirmationModal
          user={pendingStatusUser}
          saving={saving}
          onCancel={() => setPendingStatusUser(null)}
          onConfirm={() => toggleStatus(pendingStatusUser)}
        />
      ) : null}

      {pendingMembershipUser ? (
        <MembershipConfirmationModal
          user={pendingMembershipUser}
          roles={roleOptions}
          roleId={membershipRoleId}
          onRoleChange={setMembershipRoleId}
          saving={saving}
          onCancel={() => setPendingMembershipUser(null)}
          onConfirm={changeMembership}
        />
      ) : null}
    </DashboardFrame>
  )
}

function DashboardFrame({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      {children}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5">
      <div className="mb-4">
        <p className="text-sm font-medium text-emerald-900/70">{label}</p>
      </div>
      <p className="text-3xl font-black text-emerald-950">{value}</p>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-emerald-950">
      <span>{label}</span>
      <input
        {...props}
        className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-950 outline-none transition placeholder:text-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
      />
    </label>
  )
}

function SelectField({ label, options, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-emerald-950">
      <span>{label}</span>
      <select
        {...props}
        className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.nombre_rol}
          </option>
        ))}
      </select>
    </label>
  )
}

function PhoneField({ codigoPais, telefono, onChange }) {
  return (
    <fieldset className="flex flex-col gap-2 text-sm font-medium text-emerald-950">
      <legend className="mb-2">Teléfono</legend>
      <div className="grid grid-cols-[minmax(145px,0.8fr)_1fr] gap-2">
        <select name="codigo_pais" value={codigoPais} onChange={onChange} aria-label="País" className="min-w-0 rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
          {COUNTRY_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>{country.flag} {country.name} ({country.code})</option>
          ))}
        </select>
        <input
          name="telefono"
          type="tel"
          inputMode="numeric"
          value={telefono}
          onChange={(event) => {
            event.target.value = event.target.value.replace(/\D/g, '').slice(0, 15)
            onChange(event)
          }}
          maxLength={15}
          aria-label="Número de teléfono"
          className="min-w-0 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
      </div>
    </fieldset>
  )
}

function MembershipConfirmationModal({ user, roles, roleId, onRoleChange, saving, onCancel, onConfirm }) {
  const adding = !user.asignadoProyecto
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-950">¿Estás seguro de {adding ? 'agregar' : 'quitar'} este usuario {adding ? 'al' : 'del'} proyecto?</h3>
        <p className="mt-2 text-sm text-slate-600">{user.nombreCompleto} {adding ? 'podrá trabajar con la información del proyecto activo.' : 'perderá el acceso al proyecto, pero su cuenta global seguirá activa.'}</p>
        {adding ? <label className="mt-4 block text-sm font-semibold text-slate-700">Rol dentro del proyecto<select value={roleId} onChange={(event) => onRoleChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">{roles.map((role) => <option key={role.id} value={role.id}>{role.nombre_rol}</option>)}</select></label> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${adding ? 'bg-emerald-700' : 'bg-red-600'}`}>{saving ? 'Guardando...' : adding ? 'Agregar' : 'Quitar'}</button>
        </div>
      </div>
    </div>
  )
}

function StatusConfirmationModal({ user, saving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="status-confirmation-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h3 id="status-confirmation-title" className="text-lg font-bold text-slate-950">¿Estás seguro de desactivar el usuario?</h3>
        <p className="mt-2 text-sm text-slate-600">{user.nombreCompleto} no podrá iniciar sesión hasta que vuelvas a activarlo.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{saving ? 'Desactivando...' : 'Desactivar'}</button>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'No puedes desactivar tu sesión actual' : undefined}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-emerald-950">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-800">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Th({ children }) {
  return <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.18em]">{children}</th>
}
