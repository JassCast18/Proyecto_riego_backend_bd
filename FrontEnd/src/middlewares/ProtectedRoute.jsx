import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { getActiveProject } from '../auth/projects.service.js'

export function ProtectedRoute({ children, requireProject = false, requiredPermission = null }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireProject && !getActiveProject()?.id) {
    return <Navigate to="/proyectos" replace />
  }

  if (requiredPermission && !(user?.permisos || []).includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
