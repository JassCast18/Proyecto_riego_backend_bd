import api from './api'

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors ||
    error?.message ||
    fallbackMessage
  )
}

export async function loginRequest(credentials) {
  try {
    const response = await api.post('/users/login', credentials)
    const payload = response.data
    const session = payload?.data || {}

    return {
      token: session.token,
      user: session.usuario,
      message: payload?.message || 'Inicio de sesión exitoso.',
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible iniciar sesion.'))
  }
}

export async function registerRequest(payload) {
  try {
    const response = await api.post('/users/register', payload)
    const apiResponse = response.data
    const session = apiResponse?.data || {}

    return {
      token: session.token,
      user: session.usuario,
      message: apiResponse?.message || 'Registro exitoso.',
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible registrar el usuario.'))
  }
}

export async function listPermissionsRequest() {
  try {
    const response = await api.get('/users/manage/permissions')

    return response.data?.data?.permisos || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar los permisos.'))
  }
}

export async function forgotPasswordRequest(correoElectronico) {
  try {
    const response = await api.post('/users/forgot-password', { correo_electronico: correoElectronico })
    return response.data?.message
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible solicitar la recuperación.'))
  }
}

export async function validateResetTokenRequest(token) {
  try {
    const response = await api.get('/users/reset-password/validate', { params: { token } })
    return Boolean(response.data?.data?.valido)
  } catch {
    return false
  }
}

export async function resetPasswordRequest({ token, password }) {
  try {
    const response = await api.post('/users/reset-password', { token, password })
    return response.data?.message
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible restablecer la contraseña.'))
  }
}
