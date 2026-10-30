import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { getActiveProject } from '../auth/projects.service.js'

export function ProtectedRoute({ children, requireProject = false, requiredPermission = null }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-600">Validando sesión segura…</div>

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
