import DatabaseExecutor from '../database/database.executor.js'

export const searchUserAudit=(data)=>DatabaseExecutor.executeFunction('fn_consultar_auditoria_usuario',[
 data.projectId,data.userId,data.page,data.pageSize,data.search||null,data.category||null,data.actorId||null,data.from||null,data.to||null,data.action||null,
])
