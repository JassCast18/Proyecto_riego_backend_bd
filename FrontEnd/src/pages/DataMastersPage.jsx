import { DashboardShell } from '../components/dashboard/dashboard-shell'
import { DataMastersContent } from '../components/dashboard/data-masters-content'
import { InitialParametersContent } from '../components/dashboard/initial-parameters-content'
import {useLocation} from 'react-router-dom'

export default function DataMastersPage() {
  const location=useLocation()
  return (
    <DashboardShell>
      {location.pathname.endsWith('/parametros-iniciales')?<InitialParametersContent/>:<DataMastersContent />}
    </DashboardShell>
  )
}
