import DatabaseExecutor from "../database/database.executor.js";
import Telemetria  from "../models/telemetria.model.js";

export const insertarTelemetria = async ({
    id_nodo,
    humedad,
    temperatura,
}) => {
    var result = await DatabaseExecutor.executeProcedure(
        "sp_guardar_telemetria_nodo",
        [
          id_nodo,
          humedad,
          temperatura,
        ]
    );
    return  result;
};

export const listTelemetriaHardware = async ({
    idNodo = null,
    limit = 15,
    offset = 0,
}) => {
    return await DatabaseExecutor.executeFunction("fn_listar_telemetria_hardware", [
        idNodo,
        limit,
        offset,
    ]);
};
