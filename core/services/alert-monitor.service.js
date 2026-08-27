import {
    listMonitoredProjectIds,
    listPendingAlertEmails,
    registerAlertEmailDelivery,
    syncHardwareNotifications,
} from "../providers/notifications.provider.js";
import { isEmailServiceConfigured, sendAlertEmail } from "./email.service.js";

const runningProjects = new Set();
let monitorTimer = null;

async function deliverPendingEmails(projectId) {
    if (!isEmailServiceConfigured()) return;
    const deliveries = await listPendingAlertEmails(projectId);

    for (const delivery of deliveries) {
        try {
            await sendAlertEmail({
                recipient: delivery.correo,
                name: delivery.nombre,
                projectName: delivery.proyecto,
                title: delivery.titulo,
                message: delivery.mensaje,
                severity: delivery.severidad,
                category: delivery.categoria,
                detectedAt: delivery.fecha_primera_deteccion,
            });
            await registerAlertEmailDelivery({
                notificationId: delivery.notificacion_id,
                userId: delivery.usuario_id,
                status: "ENVIADO",
            });
        } catch (error) {
            await registerAlertEmailDelivery({
                notificationId: delivery.notificacion_id,
                userId: delivery.usuario_id,
                status: "FALLIDO",
                error: error.message,
            });
        }
    }
}

export async function evaluateProjectAlerts(projectId) {
    if (!projectId || runningProjects.has(projectId)) return;
    runningProjects.add(projectId);
    try {
        await syncHardwareNotifications(projectId);
        await deliverPendingEmails(projectId);
    } finally {
        runningProjects.delete(projectId);
    }
}

export async function runAlertMonitor() {
    const projectIds = await listMonitoredProjectIds();
    await Promise.allSettled(projectIds.map(evaluateProjectAlerts));
}

export function startAlertMonitor() {
    if (monitorTimer) return monitorTimer;
    const configured = Number(process.env.ALERT_MONITOR_INTERVAL_MS || 15000);
    const interval = Number.isFinite(configured) ? Math.max(configured, 5000) : 15000;

    runAlertMonitor().catch((error) => console.error("Error inicial del monitor de alertas:", error.message));
    monitorTimer = setInterval(() => {
        runAlertMonitor().catch((error) => console.error("Error del monitor de alertas:", error.message));
    }, interval);
    monitorTimer.unref();
    return monitorTimer;
}
