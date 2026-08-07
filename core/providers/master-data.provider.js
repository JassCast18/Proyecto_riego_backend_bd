import DatabaseExecutor from "../database/database.executor.js";

const MASTER_TABLES = {
    finca: {
        tableName: "tb_finca",
    },
    sector: {
        tableName: "tb_sector",
    },
    cliente: {
        tableName: "tb_cliente",
    },
    roles: {
        tableName: "tb_rol",
    },
    nodos: {
        tableName: "tb_nodo_iot",
    },
    sensores: {
        tableName: "tb_sensor_actuador",
    },
};

function getMasterDefinition(masterKey) {
    const definition = MASTER_TABLES[masterKey];

    if (!definition) {
        throw new Error("El módulo maestro solicitado no existe.");
    }

    return definition;
}

function normalizePayload(payload = {}) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    );
}

async function executeMasterAction(masterKey, action, id, payload, projectId) {
    const { tableName } = getMasterDefinition(masterKey);
    const cleanedPayload = normalizePayload(payload);

    await DatabaseExecutor.executeProcedure(
        "sp_abm_catalogo",
        [
            tableName,
            action,
            id ?? null,
            JSON.stringify(cleanedPayload),
            projectId,
        ]
    );
}

export async function listMasterRecords(masterKey, projectId) {
    const { tableName } = getMasterDefinition(masterKey);
    const rows = await DatabaseExecutor.executeFunction("fn_listar_catalogo_abm", [tableName, projectId]);

    return rows.map((row) => row.registro ?? row);
}

export async function createMasterRecord(masterKey, payload, projectId) {
    await executeMasterAction(masterKey, "insertar", null, payload, projectId);
}

export async function updateMasterRecord(masterKey, id, payload, projectId) {
    await executeMasterAction(masterKey, "actualizar", Number(id), payload, projectId);
}

export async function deleteMasterRecord(masterKey, id, projectId) {
    await executeMasterAction(masterKey, "eliminar", Number(id), {}, projectId);
}

export function listMasterDefinitions() {
    return Object.entries(MASTER_TABLES).map(([key, value]) => ({
        key,
        tableName: value.tableName,
    }));
}

export async function getRoleAccess(roleId = null) {
    const rows = await DatabaseExecutor.executeFunction("fn_obtener_accesos_rol", [roleId]);
    return rows[0]?.fn_obtener_accesos_rol || [];
}

export async function saveRoleAccess({ roleId, name, moduleIds, submoduleIds }) {
    return DatabaseExecutor.executeProcedureWithResult("sp_guardar_rol_permisos", [
        roleId || null,
        name,
        moduleIds || [],
        submoduleIds || [],
        null,
    ]);
}
