import {db} from '../database/connection.database.js'

const userName=`concat_ws(' ',p.nombres,p.apellidos)`

export async function listFaq(search=''){
 const term=String(search).trim()
 return (await db.query(`SELECT id,slug,categoria,pregunta,respuesta FROM tb_faq_soporte
  WHERE sn_activo=TRUE AND ($1='' OR pregunta ILIKE '%'||$1||'%' OR respuesta ILIKE '%'||$1||'%' OR coalesce(palabras_clave,'') ILIKE '%'||$1||'%')
  ORDER BY orden,pregunta`,[term])).rows
}

export async function createTicket({projectId,userId,subject,description,category,priority}){
 const client=await db.connect()
 try{await client.query('BEGIN')
  const result=await client.query(`INSERT INTO tb_ticket_soporte(tb_usuario_id,tb_proyecto_id,asunto,descripcion,categoria,prioridad,estado,fecha_creacion,fecha_actualizacion)
   VALUES($1,$2,$3,$4,$5,$6,'NUEVO',NOW(),NOW()) RETURNING *`,[userId,projectId,subject,description,category,priority])
  const ticket=result.rows[0]
  await client.query(`INSERT INTO tb_ticket_evento(tb_ticket_soporte_id,tb_usuario_id,tipo,descripcion,estado_nuevo)
   VALUES($1,$2,'CREACION','Solicitud registrada por el usuario.','NUEVO')`,[ticket.id,userId])
  await client.query('COMMIT');return ticket
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}

export async function getTicketForJira(ticketId){
 return (await db.query(`SELECT t.*, 'SUP-'||lpad(t.id::text,6,'0') codigo,pr.nombre proyecto,u.correo_electronico correo,${userName} solicitante
  FROM tb_ticket_soporte t JOIN tb_proyecto pr ON pr.id=t.tb_proyecto_id JOIN tb_usuario u ON u.id=t.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id WHERE t.id=$1`,[ticketId])).rows[0]||null
}

export async function listTickets({projectId,userId,manage,status='',page=1,pageSize=10}){
 const offset=(page-1)*pageSize,params=[projectId,userId,manage,status,pageSize,offset]
 const where=`t.tb_proyecto_id=$1 AND ($3::boolean OR t.tb_usuario_id=$2) AND ($4='' OR t.estado=$4)`
 const rows=(await db.query(`SELECT t.id,'SUP-'||lpad(t.id::text,6,'0') codigo,t.asunto,t.descripcion,t.categoria,t.prioridad,t.estado,t.jira_issue_key,t.jira_estado,t.estado_sincronizacion,t.ultimo_error_sincronizacion,t.fecha_creacion,t.fecha_actualizacion,
  ${userName} solicitante,u.correo_electronico correo,(SELECT count(*)::int FROM tb_ticket_comentario c WHERE c.tb_ticket_soporte_id=t.id) comentarios
  FROM tb_ticket_soporte t JOIN tb_usuario u ON u.id=t.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id WHERE ${where}
  ORDER BY CASE t.prioridad WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 ELSE 4 END,t.fecha_actualizacion DESC LIMIT $5 OFFSET $6`,params)).rows
 const total=Number((await db.query(`SELECT count(*) total FROM tb_ticket_soporte t WHERE ${where}`,params.slice(0,4))).rows[0].total)
 const summary=(await db.query(`SELECT count(*)::int total,count(*) FILTER(WHERE estado NOT IN('RESUELTO','CERRADO'))::int abiertos,count(*) FILTER(WHERE estado='ESPERANDO_USUARIO')::int esperando,count(*) FILTER(WHERE estado IN('RESUELTO','CERRADO'))::int resueltos FROM tb_ticket_soporte t WHERE t.tb_proyecto_id=$1 AND ($3::boolean OR t.tb_usuario_id=$2)`,[projectId,userId,manage])).rows[0]
 return {tickets:rows,resumen:summary,paginacion:{pagina:page,tamano:pageSize,total,paginas:Math.max(1,Math.ceil(total/pageSize))}}
}

export async function getTicket({ticketId,projectId,userId,manage}){
 const ticket=(await db.query(`SELECT t.*,'SUP-'||lpad(t.id::text,6,'0') codigo,${userName} solicitante,u.correo_electronico correo FROM tb_ticket_soporte t JOIN tb_usuario u ON u.id=t.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id WHERE t.id=$1 AND t.tb_proyecto_id=$2 AND ($4::boolean OR t.tb_usuario_id=$3)`,[ticketId,projectId,userId,manage])).rows[0]
 if(!ticket)return null
 const [comments,events,attachments]=await Promise.all([
  db.query(`SELECT c.id,c.mensaje,c.origen,c.publico,c.estado_sincronizacion,c.fecha_creacion,
    CASE WHEN c.origen='JIRA' THEN coalesce(c.autor_externo,'Equipo de soporte') ELSE coalesce(${userName},'Usuario') END autor
    FROM tb_ticket_comentario c LEFT JOIN tb_usuario u ON u.id=c.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id
    WHERE c.tb_ticket_soporte_id=$1 AND c.publico=TRUE ORDER BY c.fecha_creacion,c.id`,[ticketId]),
  db.query(`SELECT id,tipo,descripcion,estado_anterior,estado_nuevo,fecha_creacion FROM tb_ticket_evento WHERE tb_ticket_soporte_id=$1 ORDER BY fecha_creacion,id`,[ticketId]),
  db.query(`SELECT id,tb_ticket_comentario_id,nombre_original,tipo_mime,tamano_bytes,estado_sincronizacion FROM tb_ticket_adjunto WHERE tb_ticket_soporte_id=$1 ORDER BY fecha_creacion,id`,[ticketId]),
 ])
 const commentsWithFiles=comments.rows.map(comment=>({...comment,adjuntos:attachments.rows.filter(file=>Number(file.tb_ticket_comentario_id)===Number(comment.id))}))
 return {...ticket,comentarios:commentsWithFiles,eventos:events.rows}
}

export async function addComment({ticketId,projectId,userId,manage,message}){
 const access=(await db.query(`SELECT id FROM tb_ticket_soporte WHERE id=$1 AND tb_proyecto_id=$2 AND ($4::boolean OR tb_usuario_id=$3)`,[ticketId,projectId,userId,manage])).rowCount
 if(!access)return null
 const result=await db.query(`INSERT INTO tb_ticket_comentario(tb_ticket_soporte_id,tb_usuario_id,mensaje,origen) VALUES($1,$2,$3,$4) RETURNING *`,[ticketId,userId,message,manage?'SOPORTE':'USUARIO'])
 await db.query(`UPDATE tb_ticket_soporte SET fecha_actualizacion=NOW(),estado_sincronizacion=CASE WHEN jira_issue_key IS NULL THEN estado_sincronizacion ELSE 'PENDIENTE' END WHERE id=$1`,[ticketId])
 return result.rows[0]
}

export async function changeStatus({ticketId,projectId,userId,status}){
 const client=await db.connect()
 try{await client.query('BEGIN')
  const previous=(await client.query(`SELECT estado FROM tb_ticket_soporte WHERE id=$1 AND tb_proyecto_id=$2 FOR UPDATE`,[ticketId,projectId])).rows[0]
  if(!previous){await client.query('ROLLBACK');return null}
  await client.query(`UPDATE tb_ticket_soporte SET estado=$2,fecha_actualizacion=NOW(),fecha_resolucion=CASE WHEN $2 IN('RESUELTO','CERRADO') THEN NOW() ELSE NULL END WHERE id=$1`,[ticketId,status])
  await client.query(`INSERT INTO tb_ticket_evento(tb_ticket_soporte_id,tb_usuario_id,tipo,descripcion,estado_anterior,estado_nuevo) VALUES($1,$2,'CAMBIO_ESTADO',$3,$4,$5)`,[ticketId,userId,`Estado actualizado de ${previous.estado} a ${status}.`,previous.estado,status])
  await client.query('COMMIT');return {id:ticketId,estado:status}
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}

export async function listPendingSync(limit=20){return (await db.query(`SELECT id FROM tb_ticket_soporte WHERE (estado_sincronizacion='PENDIENTE' OR (estado_sincronizacion='ERROR' AND intentos_sincronizacion<8) OR (estado_sincronizacion='SINCRONIZADO' AND estado NOT IN('RESUELTO','CERRADO'))) ORDER BY fecha_ultima_sincronizacion ASC NULLS FIRST LIMIT $1`,[limit])).rows}
export async function markTicketSynced(ticketId,jira){await db.query(`UPDATE tb_ticket_soporte SET jira_issue_id=$2,jira_issue_key=$3,jira_estado=$4,estado_sincronizacion='SINCRONIZADO',ultimo_error_sincronizacion=NULL,fecha_ultima_sincronizacion=NOW(),fecha_actualizacion=NOW() WHERE id=$1`,[ticketId,String(jira.issueId||''),jira.issueKey,jira.currentStatus?.status||jira.jiraEstado||'Creado'])}
export async function markTicketSyncError(ticketId,error){await db.query(`UPDATE tb_ticket_soporte SET estado_sincronizacion='ERROR',intentos_sincronizacion=intentos_sincronizacion+1,ultimo_error_sincronizacion=$2,fecha_ultima_sincronizacion=NOW() WHERE id=$1`,[ticketId,String(error).slice(0,800)])}
export async function setJiraStatus(ticketId,jiraStatus,localStatus){
 const client=await db.connect()
 try{await client.query('BEGIN')
  const ticket=(await client.query(`SELECT id,tb_usuario_id,tb_proyecto_id,asunto,estado,jira_estado FROM tb_ticket_soporte WHERE id=$1 FOR UPDATE`,[ticketId])).rows[0]
  if(!ticket){await client.query('ROLLBACK');return}
  const changed=ticket.jira_estado!==jiraStatus
  const resolved=changed&&['RESUELTO','CERRADO'].includes(localStatus)&&!['RESUELTO','CERRADO'].includes(ticket.estado)
  await client.query(`UPDATE tb_ticket_soporte SET estado=CASE WHEN jira_estado IS DISTINCT FROM $2 THEN $3 ELSE estado END,jira_estado=$2,estado_sincronizacion='SINCRONIZADO',ultimo_error_sincronizacion=NULL,fecha_ultima_sincronizacion=NOW(),fecha_resolucion=CASE WHEN $3 IN('RESUELTO','CERRADO') THEN coalesce(fecha_resolucion,NOW()) ELSE fecha_resolucion END,fecha_actualizacion=CASE WHEN jira_estado IS DISTINCT FROM $2 THEN NOW() ELSE fecha_actualizacion END WHERE id=$1`,[ticketId,jiraStatus,localStatus])
  if(resolved)await client.query(`INSERT INTO tb_notificacion(clave_evento,tb_proyecto_id,tb_usuario_destino_id,categoria,tipo,titulo,mensaje,severidad,estado,descartable)
   VALUES($1,$2,$3,'SOPORTE','TICKET_RESUELTO','Ticket resuelto',$4,'INFO','ACTIVA',TRUE)
   ON CONFLICT(clave_evento) WHERE estado IN('PENDIENTE','ACTIVA','RECONOCIDA') DO NOTHING`,[`SOPORTE:TICKET:${ticketId}:RESUELTO`,ticket.tb_proyecto_id,ticket.tb_usuario_id,`Tu solicitud SUP-${String(ticketId).padStart(6,'0')} (${ticket.asunto}) fue resuelta.`])
  await client.query('COMMIT')
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
export async function listPendingComments(ticketId){return (await db.query(`SELECT c.id,c.mensaje,coalesce(${userName},'Usuario') autor FROM tb_ticket_comentario c LEFT JOIN tb_usuario u ON u.id=c.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id WHERE c.tb_ticket_soporte_id=$1 AND c.estado_sincronizacion IN('PENDIENTE','ERROR') ORDER BY c.id`,[ticketId])).rows}
export async function markCommentSynced(id,jiraId){await db.query(`UPDATE tb_ticket_comentario SET jira_comment_id=$2,estado_sincronizacion='SINCRONIZADO' WHERE id=$1`,[id,String(jiraId)])}
export async function importJiraComment(ticketId,comment){if(!comment?.id||!comment?.body)return;await db.query(`INSERT INTO tb_ticket_comentario(tb_ticket_soporte_id,jira_comment_id,mensaje,origen,autor_externo,estado_sincronizacion,fecha_creacion) VALUES($1,$2,$3,'JIRA',$4,'SINCRONIZADO',coalesce($5::timestamp,NOW())) ON CONFLICT(jira_comment_id) WHERE jira_comment_id IS NOT NULL DO UPDATE SET mensaje=EXCLUDED.mensaje,autor_externo=EXCLUDED.autor_externo`,[ticketId,String(comment.id),String(comment.body),comment.author?.displayName||'Equipo de soporte',comment.created?.iso8601||null])}

export async function saveAttachments({ticketId,commentId,files}){
 await db.query(`INSERT INTO tb_ticket_adjunto(tb_ticket_soporte_id,tb_ticket_comentario_id,nombre_original,nombre_archivo,ruta_archivo,tipo_mime,tamano_bytes)
  SELECT $1,$2,x.nombre_original,x.nombre_archivo,x.ruta_archivo,x.tipo_mime,x.tamano_bytes
  FROM jsonb_to_recordset($3::jsonb) AS x(nombre_original varchar,nombre_archivo varchar,ruta_archivo varchar,tipo_mime varchar,tamano_bytes bigint)`,[ticketId,commentId,JSON.stringify(files.map(file=>({nombre_original:file.nombreOriginal,nombre_archivo:file.nombreArchivo,ruta_archivo:file.rutaArchivo,tipo_mime:file.tipoMime,tamano_bytes:file.tamanoBytes})))])
}
export async function getAttachment({attachmentId,projectId,userId}){return (await db.query(`SELECT a.ruta_archivo,a.nombre_original,a.tipo_mime FROM tb_ticket_adjunto a JOIN tb_ticket_soporte t ON t.id=a.tb_ticket_soporte_id WHERE a.id=$1 AND t.tb_proyecto_id=$2 AND t.tb_usuario_id=$3`,[attachmentId,projectId,userId])).rows[0]||null}
export async function listPendingAttachments(ticketId){return (await db.query(`SELECT id,nombre_original,ruta_archivo,tipo_mime FROM tb_ticket_adjunto WHERE tb_ticket_soporte_id=$1 AND estado_sincronizacion IN('PENDIENTE','ERROR') ORDER BY id`,[ticketId])).rows}
export async function markAttachmentSynced(id,jiraId){await db.query(`UPDATE tb_ticket_adjunto SET jira_attachment_id=$2,estado_sincronizacion='SINCRONIZADO',ultimo_error=NULL WHERE id=$1`,[id,String(jiraId||'')])}
export async function markAttachmentError(id,error){await db.query(`UPDATE tb_ticket_adjunto SET estado_sincronizacion='ERROR',ultimo_error=$2 WHERE id=$1`,[id,String(error).slice(0,500)])}

export async function integrationSummary(){return (await db.query(`SELECT count(*) FILTER(WHERE estado_sincronizacion='PENDIENTE')::int pendientes,count(*) FILTER(WHERE estado_sincronizacion='ERROR')::int errores,max(fecha_ultima_sincronizacion) ultima_sincronizacion FROM tb_ticket_soporte`)).rows[0]}
