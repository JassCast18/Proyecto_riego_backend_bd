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
                message: node.usuarioCambioEnergia
                    ? `${nodeName} fue apagado por ${node.usuarioCambioEnergia}.`
                    : `${nodeName} se encuentra apagado.`,
                severity: "INFO",
                dismissible: true,
                persistenceSeconds: 0,
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
                severity: "CRITICAL",
                dismissible: false,
                persistenceSeconds: 10,
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
                severity: status === "WARNING" ? "WARNING" : "CRITICAL",
                dismissible: false,
                persistenceSeconds: status === "WARNING" ? 20 : 10,
            });
        }
    }

    return incidents;
}

function humidityPercentage(rawValue) {
    const raw = Number(rawValue);
    if (!Number.isFinite(raw)) return null;
    return Math.max(0, Math.min(100, ((1023 - raw) / 1023) * 100));
}

function optionalNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function buildCropIncidents(nodes, rules) {
    if (!rules) return [];
    const incidents = [];
    const cropName = rules.cultivo || "el cultivo";

    for (const node of nodes) {
        if (String(node.estadoEnergia).toUpperCase() === "APAGADO") continue;
        for (const component of node.componentes || []) {
            if (String(component.estado).toUpperCase() !== "OK") continue;
            const type = String(component.tipoComponente || "");
            let value = Number(component.ultimaLectura);
            let minimum = null;
            let maximum = null;
            let unit = "";
            let metric = null;

            if (/term/i.test(type)) {
                metric = "TEMPERATURA";
                minimum = optionalNumber(rules.temperatura_minima);
                maximum = optionalNumber(rules.temperatura_maxima);
                unit = " °C";
            } else if (/(higr|hum)/i.test(type)) {
                metric = "HUMEDAD";
                value = humidityPercentage(value);
                minimum = optionalNumber(rules.humedad_minima);
                maximum = optionalNumber(rules.humedad_maxima);
                unit = " %";
            }

            if (!metric || !Number.isFinite(value)) continue;
            const below = Number.isFinite(minimum) && value < minimum;
            const above = Number.isFinite(maximum) && value > maximum;
            if (!below && !above) continue;

            const limit = below ? minimum : maximum;
            const deviation = Math.abs(value - limit);
            const criticalMargin = metric === "TEMPERATURA" ? 5 : 10;
            const severity = deviation >= criticalMargin ? "CRITICAL" : "WARNING";
            const direction = below ? "debajo" : "encima";

            incidents.push({
                key: `CULTIVO:NODO:${node.id}:SENSOR:${component.id}:${metric}`,
                nodeId: node.id,
                category: "CULTIVO",
                type: `${metric}_FUERA_RANGO`,
                title: `${metric === "TEMPERATURA" ? "Temperatura" : "Humedad"} fuera del rango`,
                message: `${cropName}: ${value.toFixed(1)}${unit}, ${direction} del límite de ${limit}${unit} en nodo #${node.id}.`,
                severity,
                dismissible: false,
                persistenceSeconds: severity === "CRITICAL" ? 30 : 60,
            });
        }
    }
    return incidents;
}

export async function syncHardwareNotifications(projectId) {
    const [nodes, ruleRows] = await Promise.all([
        listHardwareNodes(projectId),
        DatabaseExecutor.executeFunction("fn_obtener_reglas_cultivo_alertas", [projectId]),
    ]);
    const incidents = [
        ...buildHardwareIncidents(nodes),
        ...buildCropIncidents(nodes, ruleRows[0] ?? null),
    ];

    await DatabaseExecutor.executeProcedure(
        "sp_sincronizar_notificaciones_hardware",
        [projectId, JSON.stringify(incidents)],
    );
}

export async function listMonitoredProjectIds() {
    const rows = await DatabaseExecutor.executeFunction("fn_listar_proyectos_monitoreo", []);
    return rows.map((row) => Number(row.proyecto_id)).filter(Number.isFinite);
}

export async function listPendingAlertEmails(projectId) {
    return DatabaseExecutor.executeFunction("fn_listar_alertas_email_pendientes", [projectId]);
}

export async function registerAlertEmailDelivery({ notificationId, userId, status, error = "" }) {
    await DatabaseExecutor.executeProcedure("sp_registrar_entrega_alerta", [notificationId, userId, status, error]);
}

export async function listNotifications({ userId, roleId, projectId, status = "active", reviewer = "all", page = 1, pageSize = 10 }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_listar_notificaciones",
        [userId, roleId, projectId, status, reviewer, Math.max(Number(page) || 1, 1), Math.min(Math.max(Number(pageSize) || 10, 1), 50)],
    );

    return rows.map((row) => new Notification(row).toResponse());
}

export async function getNotificationSummary({ userId, roleId, projectId }) {
    const rows = await DatabaseExecutor.executeFunction("fn_resumen_notificaciones", [userId, roleId, projectId]);
    const row = rows[0] ?? {};
    return {
        active: Number(row.activas ?? 0),acknowledged: Number(row.reconocidas ?? 0),
        critical: Number(row.criticas ?? 0),resolved: Number(row.resueltas ?? 0),
    };
}

export async function listNotificationReviewers(projectId) {
    return DatabaseExecutor.executeFunction("fn_listar_revisores_notificaciones", [projectId]);
}

export async function markNotificationReviewed({ notificationId, userId, roleId, projectId }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_marcar_notificacion_revisada",
        [notificationId, userId, roleId, projectId],
    );

    return Boolean(rows[0]?.fn_marcar_notificacion_revisada);
}

export async function acknowledgeNotification({ notificationId, userId, roleId, projectId }) {
    const rows = await DatabaseExecutor.executeFunction("fn_reconocer_incidente", [
        notificationId,userId,roleId,projectId,
    ]);
    return Boolean(rows[0]?.fn_reconocer_incidente);
}

export async function dismissNotification({ notificationId, userId, roleId, projectId }) {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_descartar_notificacion",
        [notificationId, userId, roleId, projectId],
    );

    return Boolean(rows[0]?.fn_descartar_notificacion);
}
