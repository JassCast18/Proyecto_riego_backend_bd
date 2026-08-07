import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import UserManagementPage from './pages/UserManagementPage.jsx'
import DataMastersPage from './pages/DataMastersPage.jsx'
import HardwareStatusPage from './pages/HardwareStatusPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import CropParametersPage from './pages/CropParametersPage.jsx'
import { ProtectedRoute } from './middlewares/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/olvide-password" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-password" element={<ResetPasswordPage />} />
      <Route path="/proyectos" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
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
  )
}
