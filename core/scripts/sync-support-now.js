import 'dotenv/config'
import {db} from '../database/connection.database.js'
import {syncSupportTicket} from '../services/support-sync.service.js'

try{
 const tickets=(await db.query(`SELECT id FROM tb_ticket_soporte WHERE jira_issue_key IS NOT NULL ORDER BY id`)).rows
 for(const ticket of tickets){
  try{const result=await syncSupportTicket(ticket.id);console.log(`Ticket ${ticket.id}: ${result.issueKey} sincronizado.`)}catch(error){console.error(`Ticket ${ticket.id}: ${error.message}`)}
 }
 const comments=(await db.query(`SELECT c.tb_ticket_soporte_id,c.origen,coalesce(c.autor_externo,concat_ws(' ',p.nombres,p.apellidos),'Sin autor') autor,c.mensaje FROM tb_ticket_comentario c LEFT JOIN tb_usuario u ON u.id=c.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id ORDER BY c.id`)).rows
 console.table(comments)
}finally{await db.end()}
