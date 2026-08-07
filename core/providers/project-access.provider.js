import DatabaseExecutor from "../database/database.executor.js";

export async function getProjectAccess(userId, projectId) {
    const rows = await DatabaseExecutor.executeFunction("fn_validar_acceso_proyecto", [userId, projectId]);
    return rows[0] ?? null;
}
