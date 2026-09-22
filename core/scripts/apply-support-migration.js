import fs from 'node:fs/promises'
import {db} from '../database/connection.database.js'

try{
 const tableSql=await fs.readFile(new URL('../../Database/Tables/tb_ticket_soporte.sql',import.meta.url),'utf8')
 const catalogSql=await fs.readFile(new URL('../../Database/Migrations/20260921_modulo_soporte.sql',import.meta.url),'utf8')
 const clientPortalSql=await fs.readFile(new URL('../../Database/Migrations/20260922_portal_soporte_cliente.sql',import.meta.url),'utf8')
 const notificationTableSql=await fs.readFile(new URL('../../Database/Tables/tb_notificacion.sql',import.meta.url),'utf8')
 const notificationListSql=await fs.readFile(new URL('../../Database/Functions/fn_listar_notificaciones.sql',import.meta.url),'utf8')
 const notificationSummarySql=await fs.readFile(new URL('../../Database/Functions/fn_resumen_notificaciones.sql',import.meta.url),'utf8')
 await db.query(tableSql)
 await db.query(catalogSql)
 await db.query(clientPortalSql)
 await db.query(notificationTableSql)
 await db.query(notificationListSql)
 await db.query(notificationSummarySql)
 const result=await db.query(`SELECT
  (SELECT count(id) FROM tb_faq_soporte) faq,
  (SELECT count(id) FROM tb_submodulo WHERE codigo_submodulo LIKE 'soporte_%') submodulos,
  (SELECT count(column_name) FROM information_schema.columns WHERE table_name='tb_ticket_soporte') columnas,
  (SELECT count(id) FROM tb_ticket_adjunto) adjuntos`)
 console.log('Migración de soporte aplicada:',result.rows[0])
}finally{await db.end()}
