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
import { ProtectedRoute } from './middlewares/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/olvide-password" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/usuarios/*"
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/maestros/*"
        element={
          <ProtectedRoute>
            <DataMastersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notificaciones"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/hardware"
        element={
          <ProtectedRoute>
            <HardwareStatusPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
