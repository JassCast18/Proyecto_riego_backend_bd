import 'dotenv/config'
import {readFile} from 'node:fs/promises'
import {db} from '../database/connection.database.js'

try {
  const tableSql=await readFile(new URL('../../Database/Tables/tb_version_modelo_ia.sql',import.meta.url),'utf8')
  const procedureSql=await readFile(new URL('../../Database/Stored Procedure/sp_registrar_modelo_ia.sql',import.meta.url),'utf8')
  const sql=await readFile(new URL('../../Database/Functions/fn_obtener_reentrenamiento_ia.sql',import.meta.url),'utf8')
  await db.query(tableSql)
  await db.query(procedureSql)
  await db.query(sql)
  console.log('Función de reentrenamiento actualizada.')
  const projects=await db.query('SELECT id,nombre FROM tb_proyecto ORDER BY id')
  for(const project of projects.rows){
    const result=await db.query('SELECT fn_obtener_reentrenamiento_ia($1) AS estado',[project.id])
    const tree=result.rows[0]?.estado?.arbol||[]
    const latest=tree.at(-1)
    console.log(`Proyecto ${project.id} (${project.nombre}): ${tree.length} decisiones; última=${latest?.id??'ninguna'}; bloqueada=${latest?.es_ultima??false}.`)
  }
} finally {
  await db.end()
}
