import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { loadDatabasePasswordFromSecretsManager } from '../services/database-secret.service.js'

await loadDatabasePasswordFromSecretsManager()
const { db } = await import('../database/connection.database.js')

const files = [
  '../../Database/Functions/fn_listar_notificaciones.sql',
  '../../Database/Functions/fn_resumen_notificaciones.sql',
  '../../Database/Functions/fn_listar_alertas_email_pendientes.sql',
  '../../Database/Functions/fn_listar_historial_operativo.sql',
]

try {
  await db.query('BEGIN')
  for (const file of files) {
    await db.query(await readFile(new URL(file, import.meta.url), 'utf8'))
  }
  await db.query('COMMIT')
  console.log('Visibilidad de notificaciones e historial filtrable instalados correctamente.')
} catch (error) {
  await db.query('ROLLBACK')
  throw error
} finally {
  await db.end()
}
