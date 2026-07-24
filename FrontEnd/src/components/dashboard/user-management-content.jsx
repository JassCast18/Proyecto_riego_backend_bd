import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, KeyRound, PencilLine, PlusCircle, Search, Shield, Users } from 'lucide-react'
import {
  createUserRequest,
  listRolesRequest,
  listUsersRequest,
  updatePasswordRequest,
  updateStatusRequest,
  updateUserRequest,
} from '../../auth/users.service'

const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  correo_electronico: '',
  username: '',
  password: '',
  tb_rol_id: '2',
}

const INITIAL_EDIT = {
  id: null,
  nombres: '',
  apellidos: '',
  correo_electronico: '',
  username: '',
  tb_rol_id: '2',
  sn_activo: true,
}

export function UserManagementContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentSection = location.pathname.includes('/registrar') ? 'register' : 'list'

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editForm, setEditForm] = useState(INITIAL_EDIT)
  const [passwordForm, setPasswordForm] = useState({ id: null, password: '', confirmPassword: '' })
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

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
    setError('')

    try {
      const response = await listUsersRequest(value)
      setUsers(response)
    } catch (requestError) {
      setError(requestError.message)
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
  }, [search, currentSection])

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
    setError('')
    setMessage('')

    if (!form.nombres || !form.apellidos || !form.correo_electronico || !form.password) {
      setError('Completa nombre, apellido, correo y contraseña.')
      return
    }

    setSaving(true)

    try {
      await createUserRequest({
        ...form,
        tb_rol_id: Number(form.tb_rol_id),
      })

      setMessage('Usuario registrado correctamente.')
      setForm(INITIAL_FORM)
      navigate('/dashboard/usuarios/listado')
      await loadUsers('')
    } catch (submitError) {
      setError(submitError.message)
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
    setError('')

    if (!editForm.nombres || !editForm.apellidos || !editForm.correo_electronico) {
      setError('Completa los campos principales del usuario.')
      return
    }

    setSaving(true)

    try {
      await updateUserRequest(editForm.id, {
        ...editForm,
        tb_rol_id: Number(editForm.tb_rol_id),
      })
      setEditOpen(false)
      setMessage('Usuario actualizado correctamente.')
      await loadUsers(search)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setError('')

    if (!passwordForm.password || passwordForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)

    try {
      await updatePasswordRequest(passwordForm.id, { password: passwordForm.password })
      setPasswordOpen(false)
      setMessage('Contraseña actualizada correctamente.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user) => {
    setError('')
    setMessage('')

    try {
      await updateStatusRequest(user.id, { sn_activo: !user.snActivo })
      await loadUsers(search)
    } catch (submitError) {
      setError(submitError.message)
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
          <p className="max-w-3xl text-sm text-emerald-900/70">
            Registra nuevos usuarios, revisa el listado general y administra contraseña, estado y perfil desde una sola vista.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <MetricCard label="Total usuarios" value={users.length} icon={Users} />
          <MetricCard label="Activos" value={activeUsers} icon={CheckCircle2} />
          <MetricCard label="Inactivos" value={inactiveUsers} icon={Shield} />
          <MetricCard label="Roles disponibles" value={roleOptions.length} icon={Eye} />
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

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {currentSection === 'register' ? (
          <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <PlusCircle size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-emerald-950">Registrar usuario</h2>
                <p className="text-sm text-emerald-900/65">Crea un nuevo acceso para el sistema.</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
              <Field label="Nombres" name="nombres" value={form.nombres} onChange={handleFormChange} placeholder="Juan Carlos" />
              <Field label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleFormChange} placeholder="Pérez Gómez" />
              <Field label="Correo electrónico" name="correo_electronico" type="email" value={form.correo_electronico} onChange={handleFormChange} placeholder="usuario@correo.com" />
              <Field label="Usuario" name="username" value={form.username} onChange={handleFormChange} placeholder="usuario.apellido" />
              <Field label="Contraseña" name="password" type="password" value={form.password} onChange={handleFormChange} placeholder="********" />
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
                <p className="text-sm text-emerald-900/65">Busca, edita y cambia contraseñas desde aquí.</p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, correo, usuario o rol"
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
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-emerald-50/70">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-emerald-950">{user.nombreCompleto}</div>
                            <div className="text-xs text-emerald-900/55">{user.username || 'Sin usuario'}</div>
                          </td>
                          <td className="px-4 py-4 text-emerald-900/80">{user.correoElectronico}</td>
                          <td className="px-4 py-4 text-emerald-900/80">{user.rol}</td>
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
                                onClick={() => toggleStatus(user)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
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
            <Field label="Usuario" name="username" value={editForm.username} onChange={handleEditChange} />
            <SelectField label="Rol" name="tb_rol_id" value={editForm.tb_rol_id} onChange={handleEditChange} options={roleOptions} />
            <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
              <input type="checkbox" name="sn_activo" checked={editForm.sn_activo} onChange={handleEditChange} />
              Usuario activo
            </label>

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
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
            />
            <Field
              label="Confirmar contraseña"
              name="confirmPassword"
              type="password"
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
    </DashboardFrame>
  )
}

function DashboardFrame({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_28%),linear-gradient(180deg,#f9fffc,#edf7f1)]">
      {children}
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-emerald-900/70">{label}</p>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Icon size={18} />
        </span>
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

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl shadow-emerald-950/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-emerald-950">{title}</h3>
            <p className="text-sm text-emerald-900/65">Actualiza la información del usuario seleccionado.</p>
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