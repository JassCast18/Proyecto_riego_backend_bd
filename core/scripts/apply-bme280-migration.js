import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { db } from '../database/connection.database.js'

const files = [
  '../../Database/Stored Procedure/sp_registrar_lectura_prueba_ambiental.sql',
  '../../Database/Stored Procedure/sp_guardar_telemetria_gateway.sql',
  '../../Database/Functions/fn_listar_telemetria_hardware.sql',
  '../../Database/Functions/fn_evaluar_estado_nodo.sql',
  '../../Database/Functions/fn_obtener_prueba_control_manual.sql',
  '../../Database/Stored Procedure/sp_actualizar_estado_energia_nodo.sql',
  '../../Database/Stored Procedure/sp_evaluar_riego_automatico.sql',
  '../../Database/Functions/fn_obtener_dataset_ia.sql',
  '../../Database/Functions/fn_obtener_dataset_ia_corte.sql',
  '../../Database/Functions/fn_obtener_contextos_ia.sql',
  '../../Database/Functions/fn_obtener_feedback_ia.sql',
  '../../Database/Functions/fn_obtener_feedback_ia_corte.sql',
  '../../Database/Functions/fn_obtener_reentrenamiento_ia.sql',
]

try {
  await db.query('BEGIN')
  for (const file of files) {
    await db.query(await readFile(new URL(file, import.meta.url), 'utf8'))
  }
  await db.query('COMMIT')
  console.log('Integracion BME280 instalada correctamente.')
} catch (error) {
  await db.query('ROLLBACK')
  throw error
} finally {
  await db.end()
}
