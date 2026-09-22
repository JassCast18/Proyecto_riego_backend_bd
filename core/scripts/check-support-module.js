import {db} from '../database/connection.database.js'
import {integrationSummary,listFaq,listTickets} from '../providers/support.provider.js'

try{
 const assignment=(await db.query(`SELECT tb_proyecto_id project_id,tb_usuario_id user_id FROM tb_usuario_rol WHERE sn_activo=TRUE ORDER BY id LIMIT 1`)).rows[0]
 if(!assignment)throw new Error('No existe una asignación activa de usuario y proyecto para la prueba.')
 const [faq,tickets,integration]=await Promise.all([
  listFaq('sensor'),
  listTickets({projectId:assignment.project_id,userId:assignment.user_id,manage:false,page:1,pageSize:5}),
  integrationSummary(),
 ])
 console.log({faqEncontradas:faq.length,ticketsVisibles:tickets.paginacion.total,paginacion:tickets.paginacion.paginas,sincronizacion:integration})
}finally{await db.end()}
