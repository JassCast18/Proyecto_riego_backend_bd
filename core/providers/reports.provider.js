import DatabaseExecutor from "../database/database.executor.js";

export const createFieldReport = async (payload) => DatabaseExecutor.executeProcedureWithResult("sp_registrar_informe_campo", [
    payload.projectId,payload.userId,payload.title,payload.subject || null,payload.observations,
    payload.generalState || null,payload.leafColor || null,payload.leafCount ?? null,
    payload.heightCm ?? null,payload.stemWidthCm ?? null,payload.hasPests ?? false,
    payload.pestDescription || null,payload.actions || null,payload.observationDate || null,null,
]);

export const listFieldReports = async (projectId,userId) => DatabaseExecutor.executeFunction("fn_listar_informes_campo",[projectId,userId]);
export const listOperationalHistory = async (projectId,userId) => DatabaseExecutor.executeFunction("fn_listar_historial_operativo",[projectId,userId]);
export const listCycleComparison = async (projectId,userId) => DatabaseExecutor.executeFunction("fn_listar_comparacion_ciclos",[projectId,userId]);
export const saveReportAttachments = async (reportId,projectId,attachments) => DatabaseExecutor.executeProcedure("sp_registrar_adjuntos_informe",[reportId,projectId,JSON.stringify(attachments)]);
export const getReportAttachment = async (attachmentId,projectId,userId) => (await DatabaseExecutor.executeFunction("fn_obtener_adjunto_informe",[attachmentId,projectId,userId]))[0]||null;
export const listProjectAdministrators = async (projectId) => DatabaseExecutor.executeFunction("fn_listar_administradores_proyecto",[projectId]);
export const getReportEmailContext = async (projectId,userId) => (await DatabaseExecutor.executeFunction("fn_obtener_parametrizacion_cultivo",[projectId,userId]))[0]||null;
