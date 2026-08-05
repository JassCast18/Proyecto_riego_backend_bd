import { DashboardShell } from '../components/dashboard/dashboard-shell'
import { HardwareStatusContent } from '../components/dashboard/hardware-status-content'

export default function HardwareStatusPage() {
  return (
    <DashboardShell>
      <HardwareStatusContent />
    </DashboardShell>
  )
}