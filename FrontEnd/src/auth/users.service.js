import api from './api'

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors ||
    error?.message ||
    fallbackMessage
  )
}

export async function listUsersRequest(search = '', scope = 'project', projectId = null) {
  try {
    const response = await api.get('/users/manage', {
      params: { search, scope },
      headers: projectId ? { 'X-Project-Id': projectId } : undefined,
    })

    return response.data?.data?.usuarios || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar los usuarios.'))
  }
}

export async function listRolesRequest(projectId = null) {
  try {
    const response = await api.get('/users/manage/roles', { headers: projectId ? { 'X-Project-Id': projectId } : undefined })

    return response.data?.data?.roles || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar los roles.'))
  }
}

export async function createUserRequest(payload) {
  try {
    const response = await api.post('/users/manage', payload)

    return response.data?.message || 'Usuario creado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible crear el usuario.'))
  }
}

export async function updateUserRequest(id, payload) {
  try {
    const response = await api.patch(`/users/manage/${id}`, payload)

    return response.data?.message || 'Usuario actualizado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible actualizar el usuario.'))
  }
}

export async function updatePasswordRequest(id, payload) {
  try {
    const response = await api.patch(`/users/manage/${id}/password`, payload)

    return response.data?.message || 'Contraseña actualizada correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible actualizar la contraseña.'))
  }
}

export async function updateStatusRequest(id, payload) {
  try {
    const response = await api.patch(`/users/manage/${id}/status`, payload)

    return response.data?.message || 'Estado actualizado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible actualizar el estado del usuario.'))
  }
}

export async function changeProjectMembershipRequest(id, payload, projectId = null) {
  try {
    const response = await api.patch(`/users/manage/${id}/project`, payload, {
      headers: projectId ? { 'X-Project-Id': projectId } : undefined,
    })
    return response.data?.message
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible cambiar la asignación al proyecto.'))
  }
}
