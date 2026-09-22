import 'dotenv/config'
import {readFile} from 'node:fs/promises'
import {db} from '../database/connection.database.js'

const files=[
  '../../Database/Functions/fn_puntaje_color_hojas.sql',
  '../../Database/Functions/fn_obtener_resumen_foliar_ia.sql',
  '../../Database/Functions/fn_obtener_dataset_ia.sql',
  '../../Database/Functions/fn_obtener_dataset_ia_corte.sql',
  '../../Database/Functions/fn_obtener_contextos_ia.sql',
  '../../Database/Functions/fn_obtener_feedback_ia.sql',
  '../../Database/Functions/fn_obtener_feedback_ia_corte.sql',
]

try {
  await db.query('BEGIN')
  for(const file of files)await db.query(await readFile(new URL(file,import.meta.url),'utf8'))
  await db.query('COMMIT')
  const project=await db.query('SELECT id FROM tb_proyecto ORDER BY id LIMIT 1')
  if(project.rows[0]){
    const summary=await db.query('SELECT fn_obtener_resumen_foliar_ia($1) AS value',[project.rows[0].id])
    const dataset=await db.query('SELECT * FROM fn_obtener_dataset_ia($1,20) LIMIT 1',[project.rows[0].id])
    console.log('Salud foliar:',summary.rows[0].value)
    console.log('Dataset IA:',dataset.rows.length?`${Object.keys(dataset.rows[0]).join(', ')}`:'sin lecturas')
  }
} catch(error) {
  await db.query('ROLLBACK')
  throw error
} finally {
  await db.end()
}
