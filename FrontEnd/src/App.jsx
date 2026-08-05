import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import UserManagementPage from './pages/UserManagementPage.jsx'
import DataMastersPage from './pages/DataMastersPage.jsx'
import HardwareStatusPage from './pages/HardwareStatusPage.jsx'
import { ProtectedRoute } from './middlewares/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
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
