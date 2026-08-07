import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LogOut, Plus, Sprout, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { changeProjectMembershipRequest, listRolesRequest, listUsersRequest } from '../auth/users.service.js'
import {
  assignProjectUserRequest,
  configureProjectCropRequest,
  createProjectInfrastructureRequest,
  createProjectRequest,
  listCropsRequest,
  listMyProjectsRequest,
  selectActiveProject,
  searchPlantReferencesRequest,
  getPlantReferenceRequest,
  getCropParametersRequest,
  changeProjectStatusRequest,
} from '../auth/projects.service.js'

const emptyCrop = {
  cultivoId: '', variedad: '', fechaSiembra: '', tiempoCosechaDias: '',
  humedadMinima: '', humedadMaxima: '', temperaturaMinima: '', temperaturaMaxima: '', observaciones: '',
}

function Field({ label, ...props }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-white">{label}</span><input {...props} className="w-full rounded-xl border border-white/40 bg-white px-4 py-3 text-slate-900 outline-none focus:border-white focus:ring-2 focus:ring-white/30" /></label>
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [showInactiveProjects, setShowInactiveProjects] = useState(false)
  const [inactiveDetail, setInactiveDetail] = useState(null)
  const [reactivateProject, setReactivateProject] = useState(null)
  const [canCreateProjects, setCanCreateProjects] = useState(false)
  const [crops, setCrops] = useState([])
  const [users, setUsers] = useState([])
  const [assignedUsers, setAssignedUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [step, setStep] = useState(5)
  const [projectId, setProjectId] = useState(null)
  const [project, setProject] = useState({ nombre: '', descripcion: '' })
  const [crop, setCrop] = useState(emptyCrop)
  const [infrastructure, setInfrastructure] = useState({ finca: '', sector: '', tipoNodo: '', direccionMac: '' })
  const [assignment, setAssignment] = useState({ usuarioId: '', rolId: '' })
  const [plantReferences, setPlantReferences] = useState([])
  const [referenceStatus, setReferenceStatus] = useState('')
  const [unknownVariety, setUnknownVariety] = useState(false)
  const [unknownPlantingDate, setUnknownPlantingDate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadProjects = useCallback(async (inactive = false) => {
    const result = await listMyProjectsRequest(inactive)
    setProjects(result.projects)
    setCanCreateProjects(result.canCreateProjects)

    if (inactive) { setStep(5); return }

    if (result.projects.length === 1 && !result.canCreateProjects) {
      await selectActiveProject(result.projects[0])
      navigate('/dashboard', { replace: true })
      return
    }

    if (result.projects.length === 0 && result.canCreateProjects) setStep(1)
    else setStep(5)
  }, [navigate])

  useEffect(() => {
    Promise.all([loadProjects(), listCropsRequest()])
      .then(([, cropList]) => setCrops(cropList))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [loadProjects])

  const run = async (action) => {
    setSaving(true); setError('')
    try { await action() } catch (actionError) { setError(actionError.message) }
    finally { setSaving(false) }
  }

  const startProject = () => {
    setProjectId(null); setProject({ nombre: '', descripcion: '' }); setCrop(emptyCrop)
    setUnknownVariety(false); setUnknownPlantingDate(false); setReferenceStatus(''); setPlantReferences([])
    setInfrastructure({ finca: '', sector: '', tipoNodo: '', direccionMac: '' }); setAssignment({ usuarioId: '', rolId: '' }); setAssignedUsers([]); setStep(1); setError('')
  }

  const createProject = (event) => {
    event.preventDefault()
    run(async () => { const id = await createProjectRequest(project); setProjectId(id); setStep(2) })
  }

  const saveCrop = (event) => {
    event.preventDefault()
    run(async () => { await configureProjectCropRequest(projectId, crop); setStep(3) })
  }

  const changeCrop = async (event) => {
    const cultivoId = event.target.value
    setCrop({ ...emptyCrop, cultivoId })
    setUnknownVariety(false)
    setUnknownPlantingDate(false)
    setPlantReferences([])
    setReferenceStatus('')
    const selectedCrop = crops.find((item) => String(item.id) === String(cultivoId))
    if (!selectedCrop) return
    try {
      setReferenceStatus('Buscando referencias agronómicas en FAO EcoCrop…')
      const references = await searchPlantReferencesRequest(selectedCrop.nombre)
      setPlantReferences(references)
      setReferenceStatus(references.length ? 'Puedes seleccionar una sugerencia o escribir tu propia variedad.' : 'No se encontraron sugerencias; puedes escribir la variedad.')
    } catch (referenceError) {
      setReferenceStatus(referenceError.message)
    }
  }

  const changeVariety = async (event) => {
    const variedad = event.target.value
    setUnknownVariety(false)
    setCrop((current) => ({ ...current, variedad }))
    const selected = plantReferences.find((item) => item.nombre === variedad)
    if (!selected) return
    try {
      setReferenceStatus('Consultando parámetros agrícolas…')
      const reference = await getPlantReferenceRequest(selected.slug)
      setCrop((current) => ({
        ...current,
        variedad,
        tiempoCosechaDias: reference?.tiempoCosechaDias ?? current.tiempoCosechaDias,
        temperaturaMinima: reference?.temperaturaMinima ?? current.temperaturaMinima,
        temperaturaMaxima: reference?.temperaturaMaxima ?? current.temperaturaMaxima,
      }))
      const availableFields = reference?.camposDisponibles || []
      const cycleNote = reference?.tiempoCosechaMinimo != null && reference?.tiempoCosechaMaximo != null
        ? ` El ciclo registrado va de ${reference.tiempoCosechaMinimo} a ${reference.tiempoCosechaMaximo} días; se colocó el promedio como estimación editable.`
        : ''
      const agronomicNotes = [
        reference?.precipitacionMinima != null ? `Precipitación óptima: ${reference.precipitacionMinima}-${reference.precipitacionMaxima} mm/año.` : '',
        reference?.phMinimo != null ? `pH óptimo: ${reference.phMinimo}-${reference.phMaximo}.` : '',
      ].filter(Boolean).join(' ')
      setReferenceStatus(availableFields.length
        ? `FAO EcoCrop completó: ${availableFields.filter((field) => !['precipitación', 'pH del suelo'].includes(field)).join(', ')}.${cycleNote} ${agronomicNotes} La humedad del suelo debe configurarse según el sensor y el terreno.`
        : 'FAO EcoCrop reconoce este cultivo, pero no contiene parámetros compatibles para completar. Puedes ingresarlos manualmente.')
    } catch (referenceError) {
      setReferenceStatus(referenceError.message)
    }
  }

  const saveInfrastructure = (event) => {
    event.preventDefault()
    run(async () => { await createProjectInfrastructureRequest(projectId, infrastructure); await prepareUsers() })
  }

  const prepareUsers = async () => {
    setError('')
    try {
      const [userList, projectUsers, roleList] = await Promise.all([
        listUsersRequest('', 'global', projectId),
        listUsersRequest('', 'project', projectId),
        listRolesRequest(projectId),
      ])
      const assignedIds = new Set(projectUsers.map((item) => Number(item.id)))
      setUsers(userList.filter((item) => Number(item.id) !== Number(user?.id) && item.snActivo && !assignedIds.has(Number(item.id))))
      setAssignedUsers(projectUsers.filter((item) => Number(item.id) !== Number(user?.id)))
      setRoles(roleList); setStep(4)
    } catch (loadError) { setError(loadError.message) }
  }

  const assignUser = (event) => {
    event.preventDefault()
    run(async () => { await assignProjectUserRequest(projectId, assignment); setAssignment({ usuarioId: '', rolId: '' }); await prepareUsers() })
  }

  const removeAssignedUser = (assignedUser) => run(async () => {
    await changeProjectMembershipRequest(assignedUser.id, { activo: false }, projectId)
    await prepareUsers()
  })

  const finish = () => run(async () => { await loadProjects(); setStep(5) })
  const toggleInactiveProjects = () => run(async () => {
    const next = !showInactiveProjects
    setShowInactiveProjects(next)
    await loadProjects(next)
  })
  const openInactiveProject = async (selected) => {
    setError('')
    try { setInactiveDetail({ project: selected, parameters: await getCropParametersRequest(selected.id) }) }
    catch (detailError) { setError(detailError.message) }
  }
  const confirmReactivation = () => run(async () => {
    await changeProjectStatusRequest(reactivateProject.id, true)
    setReactivateProject(null); setInactiveDetail(null)
    await loadProjects(true)
  })
  const enter = async (selected) => {
    if (!selected.configurado && canCreateProjects) {
      setProjectId(selected.id)
      setProject({ nombre: selected.nombre, descripcion: selected.descripcion || '' })
      setStep(2)
      return
    }
    try {
      await selectActiveProject(selected)
      navigate('/dashboard')
    } catch (selectionError) {
      setError(selectionError.message)
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-green-700 text-lg font-bold text-white">Preparando tus proyectos…</main>

  return (
    <main className="min-h-screen bg-green-700 text-white">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3 font-bold"><Sprout size={26} /><span>Frutas del Oasis</span></div>
        <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border border-white/40 px-3 py-2 text-sm hover:bg-white/10"><LogOut size={17} />Salir</button>
      </header>

      <section key={step} className="mx-auto flex min-h-[calc(100vh-84px)] max-w-5xl animate-in fade-in slide-in-from-bottom-3 flex-col justify-center px-6 pb-14 duration-300">
        <div className="mb-7 flex items-center justify-between text-sm text-white/75"><span>{step < 5 ? `Paso ${step} de 5` : 'Tus proyectos'}</span>{step < 5 && projects.length ? <button onClick={() => setStep(5)}>Cancelar</button> : null}</div>
        {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        {step === 1 ? <form onSubmit={createProject} className="max-w-2xl space-y-5"><h1 className="text-4xl font-black md:text-6xl">¿Cómo se llamará tu proyecto?</h1><p className="text-lg text-white/80">Usa un nombre fácil de reconocer para tu plantación.</p><Field label="Nombre del proyecto" value={project.nombre} onChange={(e) => setProject({ ...project, nombre: e.target.value })} minLength={3} maxLength={100} required autoFocus /><Field label="Descripción (opcional)" value={project.descripcion} onChange={(e) => setProject({ ...project, descripcion: e.target.value })} maxLength={300} /><Next loading={saving} /></form> : null}

        {step === 2 ? (
          <form onSubmit={saveCrop} className="max-w-3xl space-y-7">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">Cuéntanos sobre el cultivo</h1>
              <p className="mt-3 max-w-2xl text-lg text-white/80">Solo el cultivo es indispensable. Los demás datos ayudan a la IA a comenzar con una mejor referencia, pero podrá aprender con la telemetría.</p>
            </div>

            <Reveal>
              <label className="block max-w-xl">
                <span className="mb-1.5 block text-sm font-bold">¿Qué vas a cultivar? <span className="font-normal text-white/70">Obligatorio</span></span>
                <select required value={crop.cultivoId} onChange={changeCrop} className="w-full rounded-xl bg-white px-4 py-3 text-slate-900">
                  <option value="">Selecciona un cultivo</option>
                  {crops.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
              </label>
            </Reveal>

            {crop.cultivoId ? (
              <Reveal key={`variety-${crop.cultivoId}`}>
                <label className="block max-w-xl">
                  <span className="mb-1.5 block text-sm font-bold">¿Conoces la variedad?</span>
                  <input list="plant-varieties" value={crop.variedad} onChange={changeVariety} disabled={unknownVariety} className="w-full rounded-xl border border-white/40 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-white/30 disabled:bg-white/75" />
                  <datalist id="plant-varieties">{plantReferences.map((item) => <option key={item.id} value={item.nombre}>{item.nombreComun}</option>)}</datalist>
                </label>
                <button type="button" onClick={() => {
                  if (unknownVariety) {
                    setUnknownVariety(false)
                    setReferenceStatus('Puedes seleccionar una sugerencia de FAO EcoCrop o escribir tu propia variedad.')
                  } else {
                    setUnknownVariety(true)
                    setCrop((current) => ({ ...current, variedad: '' }))
                    setReferenceStatus('La IA comenzará con la referencia general del cultivo y podrá ajustarse con la telemetría.')
                  }
                }} className="mt-2 text-sm font-semibold text-white underline decoration-white/50 underline-offset-4">{unknownVariety ? 'Sí, quiero indicar la variedad' : 'No conozco la variedad'}</button>
                {referenceStatus ? <p className="mt-3 max-w-2xl rounded-xl bg-black/10 px-4 py-3 text-sm text-white/85">{referenceStatus}</p> : null}
              </Reveal>
            ) : null}

            {(crop.variedad.trim() || unknownVariety) ? (
              <Reveal key="planting-date">
                <div className="max-w-xl">
                  <Field label="¿Cuándo se sembró? (opcional)" type="date" value={crop.fechaSiembra} disabled={unknownPlantingDate} onChange={(e) => { setUnknownPlantingDate(false); setCrop({ ...crop, fechaSiembra: e.target.value }) }} />
                  <p className="mt-2 text-sm text-white/70">La fecha permite estimar la etapa de crecimiento. Si no la conoces, la IA comenzará sin esa referencia y necesitará más observaciones.</p>
                  <button type="button" onClick={() => {
                    setUnknownPlantingDate((current) => !current)
                    setCrop((current) => ({ ...current, fechaSiembra: '' }))
                  }} className="mt-2 text-sm font-semibold text-white underline decoration-white/50 underline-offset-4">{unknownPlantingDate ? 'Sí, quiero indicar la fecha' : 'No conozco la fecha'}</button>
                </div>
              </Reveal>
            ) : null}

            {(crop.fechaSiembra || unknownPlantingDate) ? (
              <Reveal key="optional-parameters">
                <div className="rounded-2xl border border-white/25 bg-white/10 p-5">
                  <h2 className="text-xl font-bold">Parámetros iniciales <span className="text-sm font-normal text-white/70">Opcionales</span></h2>
                  <p className="mt-1 text-sm text-white/75">Conserva las sugerencias de FAO EcoCrop, cámbialas o déjalas vacías. Los campos vacíos quedarán pendientes para calibración y aprendizaje.</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Cosecha estimada (días)" type="number" min="1" value={crop.tiempoCosechaDias} onChange={(e) => setCrop({ ...crop, tiempoCosechaDias: e.target.value })} />
                    <Field label="Humedad mínima (%)" type="number" min="0" max="100" step="0.01" value={crop.humedadMinima} onChange={(e) => setCrop({ ...crop, humedadMinima: e.target.value })} />
                    <Field label="Humedad máxima (%)" type="number" min="0" max="100" step="0.01" value={crop.humedadMaxima} onChange={(e) => setCrop({ ...crop, humedadMaxima: e.target.value })} />
                    <Field label="Temperatura mínima (°C)" type="number" step="0.01" value={crop.temperaturaMinima} onChange={(e) => setCrop({ ...crop, temperaturaMinima: e.target.value })} />
                    <Field label="Temperatura máxima (°C)" type="number" step="0.01" value={crop.temperaturaMaxima} onChange={(e) => setCrop({ ...crop, temperaturaMaxima: e.target.value })} />
                  </div>
                  <p className="mt-4 text-xs text-white/65">La humedad no se completa desde EcoCrop porque depende del terreno y de la calibración del sensor.</p>
                </div>
                <div className="mt-5"><Next loading={saving} /></div>
              </Reveal>
            ) : null}
          </form>
        ) : null}

        {step === 3 ? <form onSubmit={saveInfrastructure} className="max-w-3xl space-y-5"><h1 className="text-4xl font-black md:text-6xl">Prepara el terreno</h1><p className="text-lg text-white/80">Este paso es opcional. Puedes completar estos datos después.</p><div className="grid gap-4 md:grid-cols-2"><Field label="Nombre o ubicación de la finca" value={infrastructure.finca} onChange={(e) => setInfrastructure({ ...infrastructure, finca: e.target.value })} required /><Field label="Sector" value={infrastructure.sector} onChange={(e) => setInfrastructure({ ...infrastructure, sector: e.target.value })} /><Field label="Tipo de nodo" value={infrastructure.tipoNodo} onChange={(e) => setInfrastructure({ ...infrastructure, tipoNodo: e.target.value })} /><Field label="Dirección MAC" value={infrastructure.direccionMac} onChange={(e) => setInfrastructure({ ...infrastructure, direccionMac: e.target.value })} /></div><div className="flex flex-wrap gap-3"><button type="button" onClick={prepareUsers} className="rounded-xl border border-white/50 px-5 py-3 font-bold hover:bg-white/10">Omitir por ahora</button><Next loading={saving} back={() => setStep(2)} /></div></form> : null}

        {step === 4 ? (
          <div className="max-w-4xl space-y-6">
            <div>
              <div className="flex items-baseline gap-3"><h1 className="text-4xl font-black md:text-6xl">Invita a tu equipo</h1><span className="text-sm font-semibold text-white/65">Opcional</span></div>
              <p className="mt-3 text-lg text-white/80">Asigna usuarios existentes y define su rol en este proyecto. También puedes hacerlo después desde el listado de usuarios.</p>
            </div>

            <form onSubmit={assignUser} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <select required value={assignment.usuarioId} onChange={(e) => setAssignment({ ...assignment, usuarioId: e.target.value })} disabled={!users.length} className="rounded-xl bg-white px-4 py-3 text-slate-900 disabled:bg-white/70">
                <option value="">{users.length ? 'Selecciona un usuario' : 'Todos los usuarios disponibles están asignados'}</option>
                {users.map((item) => <option key={item.id} value={item.id}>{item.nombreCompleto} — {item.username}</option>)}
              </select>
              <select required value={assignment.rolId} onChange={(e) => setAssignment({ ...assignment, rolId: e.target.value })} disabled={!users.length} className="rounded-xl bg-white px-4 py-3 text-slate-900 disabled:bg-white/70">
                <option value="">Rol en el proyecto</option>
                {roles.map((item) => <option key={item.id} value={item.id}>{item.nombre_rol}</option>)}
              </select>
              <button disabled={saving || !users.length} className="rounded-xl bg-white px-5 py-3 font-bold text-green-800 disabled:opacity-60">Asignar</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-white/25 bg-white text-slate-900">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold">Equipo asignado</h2>
                <p className="text-sm text-slate-500">{assignedUsers.length ? `${assignedUsers.length} usuario${assignedUsers.length === 1 ? '' : 's'} agregado${assignedUsers.length === 1 ? '' : 's'}` : 'Todavía no agregaste a nadie'}</p>
              </div>
              {assignedUsers.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Usuario</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3 text-right">Acción</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {assignedUsers.map((item) => (
                        <tr key={item.id} className="animate-in fade-in duration-300">
                          <td className="px-5 py-4"><div className="font-semibold">{item.nombreCompleto}</div><div className="text-xs text-slate-500">{item.username}</div></td>
                          <td className="px-5 py-4"><span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">{item.rolProyecto || item.rol || 'Sin rol'}</span></td>
                          <td className="px-5 py-4 text-right"><button type="button" onClick={() => removeAssignedUser(item)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} />Quitar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="px-5 py-8 text-center text-sm text-slate-500">Este paso es opcional. Puedes continuar sin asignar usuarios.</p>}
            </div>

            <div className="flex gap-3"><button onClick={() => setStep(3)} className="rounded-xl border border-white/50 px-5 py-3"><ArrowLeft /></button><button onClick={finish} disabled={saving} className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-green-800"><Check size={19} />Terminar</button></div>
          </div>
        ) : null}

        {step === 5 ? <div><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black md:text-6xl">{showInactiveProjects ? 'Proyectos desactivados' : 'Elige dónde trabajar'}</h1><p className="mt-3 text-lg text-white/80">{showInactiveProjects ? 'Consulta su parametrización o reactiva un proyecto cuando lo necesites.' : 'Cada proyecto conserva su propia configuración, equipo e infraestructura.'}</p></div><button type="button" onClick={toggleInactiveProjects} disabled={saving} className="text-sm font-bold text-white underline decoration-white/50 underline-offset-4">{showInactiveProjects ? 'Volver a proyectos activos' : 'Ver proyectos desactivados'}</button></div><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((item) => <button key={item.id} onClick={() => showInactiveProjects ? openInactiveProject(item) : enter(item)} className="min-h-44 rounded-2xl border border-white/30 bg-white p-6 text-left text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Sprout className={showInactiveProjects ? 'text-slate-400' : 'text-green-700'} /><h2 className="mt-6 text-xl font-black">{item.nombre}</h2><p className="mt-1 text-sm text-slate-500">{item.cultivo || 'Configuración pendiente'} · {item.rol}</p>{showInactiveProjects ? <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Desactivado</span> : null}</button>)}{canCreateProjects && !showInactiveProjects ? <button onClick={startProject} className="flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/60 text-white transition hover:bg-white/10"><Plus size={46} /><span className="mt-3 font-bold">Crear otro proyecto</span></button> : null}</div>{!projects.length ? <p className="mt-10 rounded-xl bg-white/10 p-5">{showInactiveProjects ? 'No tienes proyectos desactivados.' : 'Todavía no tienes proyectos asignados. Solicita acceso a un propietario.'}</p> : null}</div> : null}
      </section>
      {inactiveDetail ? <InactiveProjectModal detail={inactiveDetail} canReactivate={Number(inactiveDetail.project.rol_id) === 1} onClose={() => setInactiveDetail(null)} onReactivate={() => setReactivateProject(inactiveDetail.project)} /> : null}
      {reactivateProject ? <ReactivateModal project={reactivateProject} saving={saving} onCancel={() => setReactivateProject(null)} onConfirm={confirmReactivation} /> : null}
    </main>
  )
}

function Next({ loading, back }) {
  return <span className="inline-flex gap-3">{back ? <button type="button" onClick={back} className="rounded-xl border border-white/50 px-4 py-3"><ArrowLeft /></button> : null}<button disabled={loading} className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-green-800 disabled:opacity-60">{loading ? 'Guardando…' : 'Continuar'}<ArrowRight size={19} /></button></span>
}

function Reveal({ children }) {
  return <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">{children}</div>
}

function InactiveProjectModal({ detail, canReactivate, onClose, onReactivate }) {
  const data = detail.parameters || {}
  const value = (item, suffix = '') => item === null || item === undefined || item === '' ? 'Pendiente' : `${item}${suffix}`
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 text-slate-900"><div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><span className="text-xs font-bold uppercase text-slate-500">Proyecto desactivado</span><h2 className="text-2xl font-black">{detail.project.nombre}</h2></div><button onClick={onClose}><X /></button></div><div className="grid gap-3 p-6 sm:grid-cols-2"><Info label="Cultivo" value={value(data.cultivo)} /><Info label="Variedad" value={value(data.variedad)} /><Info label="Fecha de siembra" value={value(data.fecha_siembra)} /><Info label="Cosecha estimada" value={value(data.tiempo_cosecha_dias, ' días')} /><Info label="Humedad" value={`${value(data.humedad_minima)} – ${value(data.humedad_maxima)} %`} /><Info label="Temperatura" value={`${value(data.temperatura_minima)} – ${value(data.temperatura_maxima)} °C`} /></div>{canReactivate ? <div className="flex justify-end border-t px-6 py-4"><button onClick={onReactivate} className="rounded-lg bg-green-700 px-4 py-2.5 font-bold text-white">Reactivar proyecto</button></div> : null}</div></div>
}

function Info({ label, value }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div> }

function ReactivateModal({ project, saving, onCancel, onConfirm }) { return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 text-slate-900"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-xl font-black">¿Reactivar {project.nombre}?</h3><p className="mt-2 text-sm text-slate-600">El proyecto volverá a aparecer en el menú principal y sus usuarios podrán seleccionarlo nuevamente.</p><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} disabled={saving} className="rounded-lg border px-4 py-2 font-semibold">Cancelar</button><button onClick={onConfirm} disabled={saving} className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white">{saving ? 'Reactivando…' : 'Sí, reactivar'}</button></div></div></div> }
