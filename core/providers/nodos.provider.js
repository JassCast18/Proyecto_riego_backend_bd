import DatabaseExecutor from "../database/database.executor.js";

function normalizeEvaluation(row = {}) {
    return {
        estadoGeneral: row.p_estado_general ?? row.estado_general ?? "OK",
        estadoTemp: row.p_estado_temp ?? row.estado_temp ?? "OK",
        mensajeTemp: row.p_mensaje_temp ?? row.mensaje_temp ?? "Operando con normalidad",
        estadoHum: row.p_estado_hum ?? row.estado_hum ?? "OK",
        mensajeHum: row.p_mensaje_hum ?? row.mensaje_hum ?? "Operando con normalidad",
        ultimaConexion: row.p_ultima_conexion ?? row.ultima_conexion ?? null,
    };
}

export const listHardwareNodes = async (projectId = null) => {
    const rows = await DatabaseExecutor.executeFunction("fn_listar_nodos_hardware", [projectId]);

    const evaluations = await Promise.all(
        rows.map(async (node) => {
            const evaluationRows = await DatabaseExecutor.executeFunction(
                "fn_evaluar_estado_nodo",
                [Number(node.id)],
            );

            const evaluation = normalizeEvaluation(evaluationRows[0] ?? {});

            return {
                id: node.id,
                tbSectorId: node.tb_sector_id,
                tipoNodo: node.tipo_nodo,
                direccionMac: node.direccion_mac,
                estadoEnergia: node.estado_energia,
                ...evaluation,
            };
        })
    );

    return evaluations;
};

export const updateNodeEnergyState = async ({ id, estadoEnergia, projectId, userId }) => {
    await DatabaseExecutor.executeProcedure("sp_actualizar_estado_energia_nodo", [id, estadoEnergia, projectId, userId]);
};
