import { DashboardShell } from '../components/dashboard/dashboard-shell'
import { DataMastersContent } from '../components/dashboard/data-masters-content'

export default function DataMastersPage() {
  return (
    <DashboardShell>
      <DataMastersContent />
    </DashboardShell>
  )
}