import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { ProtectedRoute } from './middlewares/ProtectedRoute.jsx'

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const UserManagementPage = lazy(() => import('./pages/UserManagementPage.jsx'))
const DataMastersPage = lazy(() => import('./pages/DataMastersPage.jsx'))
const HardwareStatusPage = lazy(() => import('./pages/HardwareStatusPage.jsx'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.jsx'))
const CropParametersPage = lazy(() => import('./pages/CropParametersPage.jsx'))
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'))
const ManualControlPage = lazy(() => import('./pages/ManualControlPage.jsx'))
const AIPage = lazy(() => import('./pages/AIPage.jsx'))
const AIRetrainingPage = lazy(() => import('./pages/AIRetrainingPage.jsx'))
const AuditPage = lazy(() => import('./pages/AuditPage.jsx'))
const SupportPage = lazy(() => import('./pages/SupportPage.jsx'))

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/olvide-password" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-password" element={<ResetPasswordPage />} />
      <Route path="/proyectos" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route
        path="/dashboard/control-manual/*"
        element={<ProtectedRoute requireProject requiredPermission="control_manual.view"><ManualControlPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/auditoria/*"
        element={<ProtectedRoute requireProject requiredPermission="auditoria.view"><AuditPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/soporte/*"
        element={<ProtectedRoute requireProject requiredPermission="soporte.view"><SupportPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/ia/reentrenamiento"
        element={<ProtectedRoute requireProject requiredPermission="ia.view"><AIRetrainingPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/ia"
        element={<ProtectedRoute requireProject requiredPermission="ia.view"><AIPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/reportes/*"
        element={<ProtectedRoute requireProject requiredPermission="reportes.view"><ReportsPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/parametrizacion-cultivo"
        element={<ProtectedRoute requireProject requiredPermission="cultivo.view"><CropParametersPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireProject>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/usuarios/*"
        element={
          <ProtectedRoute requireProject requiredPermission="usuarios.view">
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/maestros/*"
        element={
          <ProtectedRoute requireProject requiredPermission="datos_maestros.view">
            <DataMastersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notificaciones"
        element={
          <ProtectedRoute requireProject>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/hardware"
        element={
          <ProtectedRoute requireProject>
            <HardwareStatusPage />
          </ProtectedRoute>
        }
      />
      </Routes>
    </Suspense>
  )
}

function RouteLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" aria-hidden="true" />
        Cargando módulo...
      </div>
    </div>
  )
}
