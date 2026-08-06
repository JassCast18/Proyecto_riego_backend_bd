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

        const tempStatus = String(node.estadoTemp).toUpperCase();
        const humStatus = String(node.estadoHum).toUpperCase();

        if (tempStatus === "OFFLINE" && humStatus === "OFFLINE") {
            incidents.push({
                key: `${prefix}:SIN_COMUNICACION`,
                nodeId: node.id,
                type: "NODO_SIN_COMUNICACION",
                title: "Nodo sin comunicación",
                message: `${nodeName}: ${node.mensajeTemp || "no reporta telemetría"}`,
                severity: "ERROR",
                dismissible: false,
            });
            continue;
        }

        if (tempStatus !== "OK") {
            incidents.push({
                key: `${prefix}:TEMPERATURA`,
                nodeId: node.id,
                type: "SENSOR_TEMPERATURA",
                title: "Sensor de temperatura no disponible",
                message: `${nodeName}: ${node.mensajeTemp}`,
                severity: tempStatus === "WARNING" ? "WARNING" : "ERROR",
                dismissible: false,
            });
        }

        if (humStatus !== "OK") {
            incidents.push({
                key: `${prefix}:HUMEDAD`,
                nodeId: node.id,
                type: "SENSOR_HUMEDAD",
                title: "Sensor de humedad no disponible",
                message: `${nodeName}: ${node.mensajeHum}`,
                severity: humStatus === "WARNING" ? "WARNING" : "ERROR",
                dismissible: false,
            });
        }
    }

    return incidents;
}

export async function syncHardwareNotifications() {
    const incidents = buildHardwareIncidents(await listHardwareNodes());

    await DatabaseExecutor.executeProcedure(
        "sp_sincronizar_notificaciones_hardware",
        [JSON.stringify(incidents)],
    );
}

export async function listNotifications({ userId, roleId, status = "all", limit = 50 }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_listar_notificaciones",
        [userId, roleId, status, Math.min(Math.max(Number(limit) || 50, 1), 100)],
    );

    return rows.map((row) => new Notification(row).toResponse());
}

export async function markNotificationReviewed({ notificationId, userId, roleId }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_marcar_notificacion_revisada",
        [notificationId, userId, roleId],
    );

    return Boolean(rows[0]?.fn_marcar_notificacion_revisada);
}

export async function dismissNotification({ notificationId, userId, roleId }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_descartar_notificacion",
        [notificationId, userId, roleId],
    );

    return Boolean(rows[0]?.fn_descartar_notificacion);
}
