import {DashboardShell} from '../components/dashboard/dashboard-shell'
import {ManualControlContent} from '../components/dashboard/manual-control-content'
import {SensorCalibrationContent} from '../components/dashboard/sensor-calibration-content'
import {SensorMaintenanceContent} from '../components/dashboard/sensor-maintenance-content'
import {useLocation} from 'react-router-dom'
export default function ManualControlPage(){const location=useLocation();return <DashboardShell>{location.pathname.endsWith('/calibracion')?<SensorCalibrationContent/>:location.pathname.endsWith('/mantenimiento')?<SensorMaintenanceContent/>:<ManualControlContent/>}</DashboardShell>}
