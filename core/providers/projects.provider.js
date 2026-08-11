import DatabaseExecutor from "../database/database.executor.js";

export const listUserProjects = async (userId, inactive = false) => (
    DatabaseExecutor.executeFunction("fn_listar_proyectos_usuario", [userId, inactive])
);

export const getCropParameters = async (projectId, userId) => {
    const rows = await DatabaseExecutor.executeFunction("fn_obtener_parametrizacion_cultivo", [projectId, userId]);
    return rows[0] || null;
};

export const listCropParameterHistory = async (projectId, userId) => (
    DatabaseExecutor.executeFunction("fn_listar_historial_parametrizacion", [projectId, userId])
);

export const changeProjectStatus = async ({ projectId, userId, active }) => (
    DatabaseExecutor.executeProcedure("sp_cambiar_estado_proyecto", [projectId, userId, active])
);

export const listCrops = async () => (
    DatabaseExecutor.executeFunction("fn_listar_cultivos", [])
);

export const canCreateProjects = async (userId) => {
    const rows = await DatabaseExecutor.executeFunction("fn_es_propietario", [userId]);
    return Boolean(rows[0]?.fn_es_propietario);
};

export const createProject = async ({ name, description, userId }) => {
    const result = await DatabaseExecutor.executeProcedureWithResult(
        "sp_crear_proyecto",
        [name, description || null, userId, null],
    );

    return result?.p_proyecto_id ?? null;
};

export const configureCrop = async ({
    projectId,
    userId,
    cropId,
    variety,
    plantingDate,
    harvestDays,
    minimumHumidity,
    maximumHumidity,
    minimumTemperature,
    maximumTemperature,
    observations,
}) => DatabaseExecutor.executeProcedure(
    "sp_configurar_cultivo_proyecto",
    [
        projectId,
        userId,
        cropId,
        variety || null,
        plantingDate || null,
        harvestDays || null,
        minimumHumidity ?? null,
        maximumHumidity ?? null,
        minimumTemperature ?? null,
        maximumTemperature ?? null,
        observations || null,
    ],
);

export const createInfrastructure = async ({ projectId, userId, farm, sector, nodeType, macAddress }) => (
    DatabaseExecutor.executeProcedure("sp_crear_infraestructura_proyecto", [
        projectId, userId, farm, sector || null, nodeType || null, macAddress || null,
    ])
);

export const assignUser = async ({ projectId, assignedUserId, roleId, administratorId }) => (
    DatabaseExecutor.executeProcedure("sp_asignar_usuario_proyecto", [
        projectId, assignedUserId, roleId, administratorId,
    ])
);

export const finishCropCycle = async (payload) => DatabaseExecutor.executeProcedure("sp_finalizar_ciclo_cultivo",[
    payload.projectId,payload.userId,payload.endDate,payload.result,payload.quantity ?? null,
    payload.unit || null,payload.quality || null,payload.observations || null,
    payload.sproutDate || null,payload.sproutPercentage ?? null,
]);

export const startCropCycle = async (payload) => DatabaseExecutor.executeProcedure("sp_iniciar_ciclo_cultivo",[
    payload.projectId,payload.userId,payload.cropId,payload.variety || null,payload.startDate,payload.harvestDays ?? null,
]);
