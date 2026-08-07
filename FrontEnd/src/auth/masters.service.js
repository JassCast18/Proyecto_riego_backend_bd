import api from './api'

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors ||
    error?.message ||
    fallbackMessage
  )
}

export async function listMasterRecordsRequest(masterKey) {
  try {
    const response = await api.get(`/masters/${masterKey}`)

    return response.data?.data?.registros || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar el catálogo.'))
  }
}

export async function createMasterRecordRequest(masterKey, payload) {
  try {
    const response = await api.post(`/masters/${masterKey}`, payload)

    return response.data?.message || 'Registro creado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible crear el registro.'))
  }
}

export async function updateMasterRecordRequest(masterKey, id, payload) {
  try {
    const response = await api.patch(`/masters/${masterKey}/${id}`, payload)

    return response.data?.message || 'Registro actualizado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible actualizar el registro.'))
  }
}

export async function deleteMasterRecordRequest(masterKey, id) {
  try {
    const response = await api.delete(`/masters/${masterKey}/${id}`)

    return response.data?.message || 'Registro eliminado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible eliminar el registro.'))
  }
}

export async function getRoleAccessRequest(roleId = null) {
  try {
    const response = await api.get('/masters/roles/accesos/configuracion', { params: roleId ? { rolId: roleId } : undefined })
    return response.data?.data?.modulos || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar los accesos del rol.'))
  }
}

export async function saveRoleAccessRequest(roleId, payload) {
  try {
    const response = roleId
      ? await api.patch(`/masters/roles/accesos/${roleId}`, payload)
      : await api.post('/masters/roles/accesos', payload)
    return response.data?.message || 'Rol guardado correctamente.'
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible guardar el rol y sus accesos.'))
  }
}
