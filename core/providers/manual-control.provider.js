import DatabaseExecutor from "../database/database.executor.js";

export const listCatalog = (projectId) => DatabaseExecutor.executeFunction("fn_listar_catalogo_control_manual",[projectId]);
export const listTests = (projectId,type=null,limit=30) => DatabaseExecutor.executeFunction("fn_listar_pruebas_control_manual",[projectId,type,limit]);
export const getTest = async (testId,projectId) => (await DatabaseExecutor.executeFunction("fn_obtener_prueba_control_manual",[testId,projectId]))[0]?.prueba ?? null;
export const startTest = (data) => DatabaseExecutor.executeProcedureWithResult("sp_iniciar_prueba_control_manual",[
  data.projectId,data.userId,data.nodeId,data.type,data.componentId,data.objective,data.intervalSeconds,data.durationSeconds,null,
]);
export const finishTest = (data) => DatabaseExecutor.executeProcedure("sp_finalizar_prueba_control_manual",[
  data.testId,data.projectId,data.userId,data.cancel,data.result,data.conclusion,
]);
export const takeCommands = (nodeId) => DatabaseExecutor.executeFunction("fn_tomar_comandos_iot",[nodeId]);
export const confirmCommand = (commandId,success,message="") => DatabaseExecutor.executeProcedure("sp_confirmar_comando_iot",[commandId,success,message]);
export const registerTestReadings = (testId,nodeId,humidity,temperature) => DatabaseExecutor.executeProcedure("sp_registrar_lecturas_prueba",[testId,nodeId,humidity,temperature]);
export const createActuator = (data) => DatabaseExecutor.executeProcedureWithResult("sp_registrar_actuador",[data.projectId,data.nodeId,data.name,data.pin,data.maxDuration,null]);
