import DatabaseExecutor from "../database/database.executor.js";
import Notification from "../models/notification.model.js";
import { listHardwareNodes } from "./nodos.provider.js";

function buildHardwareIncidents(nodes) {
    const incidents = [];

    for (const node of nodes) {
        const prefix = `HARDWARE:NODO:${node.id}`;
        const nodeName = `Nodo #${node.id} (${node.tipoNodo})`;
        const poweredOff = String(node.estadoEnergia).toUpperCase() === "APAGADO";

        if (poweredOff) {
            incidents.push({
                key: `${prefix}:ENERGIA`,
                nodeId: node.id,
                type: "NODO_APAGADO",
                title: "Nodo apagado",
                message: `${nodeName} se encuentra apagado.`,
                severity: "INFO",
                dismissible: true,
            });
            continue;
        }

        const components = node.componentes || [];
        const allOffline = components.length > 0
            && components.every((component) => String(component.estado).toUpperCase() === "OFFLINE");

        if (allOffline) {
            incidents.push({
                key: `${prefix}:SIN_COMUNICACION`,
                nodeId: node.id,
                type: "NODO_SIN_COMUNICACION",
                title: "Nodo sin comunicación",
                message: `${nodeName}: no reporta telemetría en ninguno de sus sensores.`,
                severity: "ERROR",
                dismissible: false,
            });
            continue;
        }

        for (const component of components) {
            const status = String(component.estado).toUpperCase();
            if (status === "OK") continue;

            incidents.push({
                key: `${prefix}:SENSOR:${component.id}`,
                nodeId: node.id,
                type: "SENSOR_NO_DISPONIBLE",
                title: `${component.tipoComponente} requiere atención`,
                message: `${nodeName}: ${component.mensaje}`,
                severity: status === "WARNING" ? "WARNING" : "ERROR",
                dismissible: false,
            });
        }
    }

    return incidents;
}

export async function syncHardwareNotifications(projectId) {
    const incidents = buildHardwareIncidents(await listHardwareNodes(projectId));

    await DatabaseExecutor.executeProcedure(
        "sp_sincronizar_notificaciones_hardware",
        [projectId, JSON.stringify(incidents)],
    );
}

export async function listNotifications({ userId, roleId, projectId, status = "all", limit = 50 }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_listar_notificaciones",
        [userId, roleId, projectId, status, Math.min(Math.max(Number(limit) || 50, 1), 100)],
    );

    return rows.map((row) => new Notification(row).toResponse());
}

export async function markNotificationReviewed({ notificationId, userId, roleId, projectId }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_marcar_notificacion_revisada",
        [notificationId, userId, roleId, projectId],
    );

    return Boolean(rows[0]?.fn_marcar_notificacion_revisada);
}

export async function dismissNotification({ notificationId, userId, roleId, projectId }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_descartar_notificacion",
        [notificationId, userId, roleId, projectId],
    );

    return Boolean(rows[0]?.fn_descartar_notificacion);
}
