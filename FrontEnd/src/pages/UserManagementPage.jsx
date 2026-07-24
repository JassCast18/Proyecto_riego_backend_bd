import { DashboardShell } from '../components/dashboard/dashboard-shell'
import { UserManagementContent } from '../components/dashboard/user-management-content'

export default function UserManagementPage() {
  return (
    <DashboardShell>
      <UserManagementContent />
    </DashboardShell>
  )
}