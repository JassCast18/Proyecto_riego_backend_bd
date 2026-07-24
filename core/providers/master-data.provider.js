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

async function executeMasterAction(masterKey, action, id, payload) {
    const { tableName } = getMasterDefinition(masterKey);
    const cleanedPayload = normalizePayload(payload);

    await DatabaseExecutor.executeProcedure(
        "sp_abm_catalogo",
        [
            tableName,
            action,
            id ?? null,
            JSON.stringify(cleanedPayload),
        ]
    );
}

export async function listMasterRecords(masterKey) {
    const { tableName } = getMasterDefinition(masterKey);
    const rows = await DatabaseExecutor.executeFunction("fn_listar_catalogo_abm", [tableName]);

    return rows.map((row) => row.registro ?? row);
}

export async function createMasterRecord(masterKey, payload) {
    await executeMasterAction(masterKey, "insertar", null, payload);
}

export async function updateMasterRecord(masterKey, id, payload) {
    await executeMasterAction(masterKey, "actualizar", Number(id), payload);
}

export async function deleteMasterRecord(masterKey, id) {
    await executeMasterAction(masterKey, "eliminar", Number(id), {});
}

export function listMasterDefinitions() {
    return Object.entries(MASTER_TABLES).map(([key, value]) => ({
        key,
        tableName: value.tableName,
    }));
}