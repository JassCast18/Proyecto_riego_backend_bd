import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  try {
    const project = JSON.parse(localStorage.getItem('activeProject'))
    if (project?.id) config.headers['X-Project-Id'] = project.id
  } catch {
    localStorage.removeItem('activeProject')
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      localStorage.removeItem('activeProject')
      window.dispatchEvent(new Event('auth:session-changed'))
    }

    if (error?.response?.status === 403 && error?.response?.data?.message === 'No tienes acceso al proyecto seleccionado.') {
      localStorage.removeItem('activeProject')
      if (window.location.pathname !== '/proyectos') window.location.assign('/proyectos')
    }

    return Promise.reject(error)
  },
)

export default api
