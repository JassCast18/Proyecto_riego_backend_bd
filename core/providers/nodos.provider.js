import DatabaseExecutor from "../database/database.executor.js";

function normalizeEvaluation(row = {}) {
    const componentes = Array.isArray(row.p_componentes ?? row.componentes)
        ? (row.p_componentes ?? row.componentes)
        : [];
    const temperatura = componentes.find((item) => /term/i.test(item.tipoComponente ?? item.tipo_componente ?? ""));
    const humedad = componentes.find((item) => /(higr|hum)/i.test(item.tipoComponente ?? item.tipo_componente ?? ""));

    return {
        estadoGeneral: row.p_estado_general ?? row.estado_general ?? "OK",
        componentes,
        // Compatibilidad con clientes y firmware que todavia consumen estos campos.
        estadoTemp: temperatura?.estado ?? "NO_CONFIGURADO",
        mensajeTemp: temperatura?.mensaje ?? "Sensor no asociado al nodo",
        estadoHum: humedad?.estado ?? "NO_CONFIGURADO",
        mensajeHum: humedad?.mensaje ?? "Sensor no asociado al nodo",
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
                usuarioCambioEnergia: node.usuario_cambio_energia || "",
                fechaCambioEnergia: node.fecha_cambio_energia || null,
                ...evaluation,
            };
        })
    );

    return evaluations;
};

export const updateNodeEnergyState = async ({ id, estadoEnergia, projectId, userId }) => {
    await DatabaseExecutor.executeProcedure("sp_actualizar_estado_energia_nodo", [id, estadoEnergia, projectId, userId]);
};
