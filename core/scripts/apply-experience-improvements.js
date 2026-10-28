import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { db } from '../database/connection.database.js'

const files = [
  '../../Database/Tables/tb_ticket_soporte.sql',
  '../../Database/Stored Procedure/sp_depurar_notificaciones.sql',
  '../../Database/Functions/fn_listar_notificaciones.sql',
  '../../Database/Functions/fn_listar_pruebas_control_manual.sql',
  '../../Database/Functions/fn_obtener_prueba_control_manual.sql',
  '../../Database/Stored Procedure/sp_iniciar_prueba_control_manual.sql',
  '../../Database/Stored Procedure/sp_finalizar_prueba_control_manual.sql',
]

try {
  await db.query('BEGIN')
  for (const file of files) {
    await db.query(await readFile(new URL(file, import.meta.url), 'utf8'))
  }
  await db.query(`UPDATE tb_bitacora_auditoria
    SET detalle='El usuario completó una operación en '||lower(replace(categoria,'_',' '))||'.'
    WHERE detalle ~ '^(POST|PUT|PATCH|DELETE) /api/'`)
  await db.query(`UPDATE tb_bitacora_auditoria
    SET accion_realizada='Cambio registrado en '||lower(replace(categoria,'_',' '))
    WHERE accion_realizada ~ '^(Creación|Actualización|Modificación|Eliminación) realizada en'`)
  await db.query('COMMIT')
  console.log('Mejoras de experiencia y retención instaladas correctamente.')
} catch (error) {
  await db.query('ROLLBACK')
  throw error
} finally {
  await db.end()
}
