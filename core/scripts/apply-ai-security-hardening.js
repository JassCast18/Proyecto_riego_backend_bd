import 'dotenv/config'
import {readFile} from 'node:fs/promises'
import {db} from '../database/connection.database.js'

const files=[
 '../../Database/Tables/tb_limite_solicitud.sql',
 '../../Database/Tables/tb_configuracion_ia.sql',
 '../../Database/Tables/tb_version_modelo_ia.sql',
 '../../Database/Functions/fn_obtener_contextos_ia.sql',
 '../../Database/Functions/fn_obtener_configuracion_ia.sql',
 '../../Database/Functions/fn_listar_proyectos_ia_automatica.sql',
 '../../Database/Stored Procedure/sp_registrar_modelo_ia.sql',
 '../../Database/Stored Procedure/sp_configurar_ia.sql',
 '../../Database/Stored Procedure/sp_resolver_decision_ia.sql',
]

const client=await db.connect()
try{
 await client.query('BEGIN')
 for(const file of files)await client.query(await readFile(new URL(file,import.meta.url),'utf8'))
 await client.query('COMMIT')
 console.log('Endurecimiento de IA y seguridad aplicado.')
}catch(error){await client.query('ROLLBACK');throw error}
finally{client.release();await db.end()}
