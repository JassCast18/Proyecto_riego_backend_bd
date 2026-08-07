import api from './api'

const message = (error, fallback) => error?.response?.data?.message || error?.message || fallback

export async function listMyProjectsRequest(inactive = false) {
  try {
    const response = await api.get('/proyectos', { params: inactive ? { estado: 'inactivos' } : undefined })
    return {
      projects: response.data?.data?.proyectos || [],
      canCreateProjects: Boolean(response.data?.data?.puedeCrearProyectos),
    }
  } catch (error) {
    throw new Error(message(error, 'No fue posible consultar tus proyectos.'))
  }
}

export async function getCropParametersRequest(projectId) {
  try {
    const response = await api.get(`/proyectos/${projectId}/parametrizacion`)
    return response.data?.data?.parametrizacion || null
  } catch (error) {
    throw new Error(message(error, 'No fue posible consultar la parametrización.'))
  }
}

export async function listCropParameterHistoryRequest(projectId) {
  try {
    const response = await api.get(`/proyectos/${projectId}/parametrizacion/historial`)
    return response.data?.data?.historial || []
  } catch (error) {
    throw new Error(message(error, 'No fue posible consultar el historial.'))
  }
}

export async function changeProjectStatusRequest(projectId, active) {
  try {
    const response = await api.patch(`/proyectos/${projectId}/estado`, { activo: active })
    return response.data?.message
  } catch (error) {
    throw new Error(message(error, 'No fue posible cambiar el estado del proyecto.'))
  }
}

export async function listCropsRequest() {
  try {
    const response = await api.get('/proyectos/cultivos')
    return response.data?.data?.cultivos || []
  } catch (error) {
    throw new Error(message(error, 'No fue posible consultar los cultivos.'))
  }
}

export async function searchPlantReferencesRequest(query) {
  try {
    const response = await api.get('/proyectos/referencias/plantas', { params: { q: query } })
    return response.data?.data?.variedades || []
  } catch (error) {
    throw new Error(message(error, 'No fue posible consultar variedades en internet.'))
  }
}

export async function getPlantReferenceRequest(slug) {
  try {
    const response = await api.get(`/proyectos/referencias/plantas/${encodeURIComponent(slug)}`)
    return response.data?.data?.referencia || null
  } catch (error) {
    throw new Error(message(error, 'No fue posible consultar los parámetros de la planta.'))
  }
}

export async function createProjectRequest(payload) {
  try {
    const response = await api.post('/proyectos', payload)
    return response.data?.data?.proyectoId
  } catch (error) {
    throw new Error(message(error, 'No fue posible crear el proyecto.'))
  }
}

export async function configureProjectCropRequest(projectId, payload) {
  try {
    await api.put(`/proyectos/${projectId}/cultivo`, payload)
  } catch (error) {
    throw new Error(message(error, 'No fue posible configurar el cultivo.'))
  }
}

export async function createProjectInfrastructureRequest(projectId, payload) {
  try {
    await api.post(`/proyectos/${projectId}/infraestructura`, payload)
  } catch (error) {
    throw new Error(message(error, 'No fue posible crear la infraestructura.'))
  }
}

export async function assignProjectUserRequest(projectId, payload) {
  try {
    await api.post(`/proyectos/${projectId}/usuarios`, payload)
  } catch (error) {
    throw new Error(message(error, 'No fue posible asignar el usuario.'))
  }
}

export async function selectActiveProject(project) {
  localStorage.setItem('activeProject', JSON.stringify(project))
  try {
    const response = await api.get('/users/manage/permissions')
    const permissions = response.data?.data?.permisos || []
    const storedUser = JSON.parse(localStorage.getItem('authUser') || 'null')
    if (storedUser) {
      localStorage.setItem('authUser', JSON.stringify({
        ...storedUser,
        tbRolId: project.rol_id,
        rol: project.rol,
        permisos: permissions,
      }))
    }
  } catch (error) {
    localStorage.removeItem('activeProject')
    throw new Error(message(error, 'No fue posible activar el proyecto.'))
  }
  window.dispatchEvent(new Event('project:changed'))
  window.dispatchEvent(new Event('auth:session-changed'))
}

export function getActiveProject() {
  try {
    return JSON.parse(localStorage.getItem('activeProject'))
  } catch {
    return null
  }
}
