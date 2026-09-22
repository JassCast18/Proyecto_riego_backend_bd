import DatabaseExecutor from "../database/database.executor.js";

export const getAiState = async (projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_estado_ia", [projectId]))[0] || {};
export const getLeafHealthSummary = async (projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_resumen_foliar_ia", [projectId]))[0]?.fn_obtener_resumen_foliar_ia || {};
export const getTrainingDataset = (projectId, limit = 5000, decisionId = null) => DatabaseExecutor.executeFunction(decisionId?"fn_obtener_dataset_ia_corte":"fn_obtener_dataset_ia", decisionId?[projectId,limit,decisionId]:[projectId,limit]);
export const getTrainingFeedback = (projectId, limit = 500, decisionId = null) => DatabaseExecutor.executeFunction(decisionId?"fn_obtener_feedback_ia_corte":"fn_obtener_feedback_ia", decisionId?[projectId,limit,decisionId]:[projectId,limit]);
export const getRetrainingState = async (projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_reentrenamiento_ia", [projectId]))[0]?.fn_obtener_reentrenamiento_ia || {};
export const getCurrentContexts = (projectId) => DatabaseExecutor.executeFunction("fn_obtener_contextos_ia", [projectId]);
export const listAiActuators = (projectId) => DatabaseExecutor.executeFunction("fn_listar_actuadores_ia", [projectId]);
export const getAiConfiguration = async (projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_configuracion_ia", [projectId]))[0]?.fn_obtener_configuracion_ia || {};
export const listAutomaticAiProjects = () => DatabaseExecutor.executeFunction("fn_listar_proyectos_ia_automatica", []);
export const saveAiConfiguration = (data) => DatabaseExecutor.executeProcedure("sp_configurar_ia", [data.projectId,data.userId,data.strategy,data.mode,data.intervalMinutes,data.durationSeconds,data.minimumAccuracy,data.minimumConfirmations]);
export const saveModel = (data) => DatabaseExecutor.executeProcedureWithResult("sp_registrar_modelo_ia", [
  data.projectId, data.userId, data.modelPath, data.version, data.algorithm, data.samples,
  data.accuracy, data.precision, data.recall, JSON.stringify(data.featureImportance), data.decisionId||null, null,
]);
export const saveDecision = (data) => DatabaseExecutor.executeProcedureWithResult("sp_registrar_decision_ia", [
  data.projectId, data.nodeId, data.modelId, data.decision, data.confidence,
  JSON.stringify(data.variables), data.explanation, null,
]);
export const resolveDecision = (data) => DatabaseExecutor.executeProcedure("sp_resolver_decision_ia", [
  data.decisionId,data.projectId,data.userId,data.action,data.actuatorId||null,data.durationSeconds||null,data.observation||null,
]);
export const restoreModel = (data) => DatabaseExecutor.executeProcedure("sp_restaurar_modelo_ia", [data.projectId,data.modelId,data.userId,data.reason]);
