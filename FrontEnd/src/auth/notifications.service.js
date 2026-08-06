import api from './api'

function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.response?.data?.errors || error?.message || fallbackMessage
}

export async function listNotificationsRequest({ status = 'all', limit = 50 } = {}) {
  try {
    const response = await api.get('/notificaciones', { params: { status, limit } })
    return response.data?.data?.notificaciones || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar las notificaciones.'))
  }
}

export async function reviewNotificationRequest(id) {
  try {
    await api.patch(`/notificaciones/${id}/revisada`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible marcar la notificación como revisada.'))
  }
}

export async function dismissNotificationRequest(id) {
  try {
    await api.delete(`/notificaciones/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible eliminar la notificación.'))
  }
}
