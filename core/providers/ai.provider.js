import DatabaseExecutor from "../database/database.executor.js";

export const getAiState = async (projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_estado_ia", [projectId]))[0] || {};
export const getTrainingDataset = (projectId, limit = 5000) => DatabaseExecutor.executeFunction("fn_obtener_dataset_ia", [projectId, limit]);
export const getCurrentContexts = (projectId) => DatabaseExecutor.executeFunction("fn_obtener_contextos_ia", [projectId]);
export const listAiActuators = (projectId) => DatabaseExecutor.executeFunction("fn_listar_actuadores_ia", [projectId]);
export const getAiConfiguration = async (projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_configuracion_ia", [projectId]))[0]?.fn_obtener_configuracion_ia || {};
export const listAutomaticAiProjects = () => DatabaseExecutor.executeFunction("fn_listar_proyectos_ia_automatica", []);
export const saveAiConfiguration = (data) => DatabaseExecutor.executeProcedure("sp_configurar_ia", [data.projectId,data.userId,data.strategy,data.mode,data.intervalMinutes,data.durationSeconds,data.minimumAccuracy,data.minimumConfirmations]);
export const saveModel = (data) => DatabaseExecutor.executeProcedureWithResult("sp_registrar_modelo_ia", [
  data.projectId, data.userId, data.modelPath, data.version, data.algorithm, data.samples,
  data.accuracy, data.precision, data.recall, JSON.stringify(data.featureImportance), null,
]);
export const saveDecision = (data) => DatabaseExecutor.executeProcedureWithResult("sp_registrar_decision_ia", [
  data.projectId, data.nodeId, data.modelId, data.decision, data.confidence,
  JSON.stringify(data.variables), data.explanation, null,
]);
export const resolveDecision = (data) => DatabaseExecutor.executeProcedure("sp_resolver_decision_ia", [
  data.decisionId,data.projectId,data.userId,data.action,data.actuatorId||null,data.durationSeconds||null,data.observation||null,
]);
