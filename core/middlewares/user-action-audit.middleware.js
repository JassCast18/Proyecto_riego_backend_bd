import {db} from '../database/connection.database.js'

const verbs={POST:'Creación',PUT:'Actualización',PATCH:'Modificación',DELETE:'Eliminación'}
const categories={masters:'DATOS_MAESTROS',users:'USUARIOS',proyectos:'PROYECTOS',reportes:'REPORTES','control-manual':'CONTROL_MANUAL',ia:'IA',nodos:'INFRAESTRUCTURA',notificaciones:'NOTIFICACIONES',soporte:'SOPORTE'}

export function auditUserMutation(req,res,next){
 res.on('finish',()=>{
  if(!verbs[req.method]||res.statusCode<200||res.statusCode>=400||!req.user?.id)return
  const projectId=Number(req.projectId||req.get('X-Project-Id'))
  if(!Number.isInteger(projectId)||projectId<=0)return
  const path=String(req.originalUrl||req.url).split('?')[0]
  if(path.startsWith('/api/telemetria'))return
  const resource=path.split('/').filter(Boolean)[1]||'sistema'
  const category=categories[resource]||'USUARIO'
  const action=`${verbs[req.method]} realizada en ${resource.replaceAll('-',' ')}`
  const detail=`${req.method} ${path} completada correctamente (HTTP ${res.statusCode}).`
  db.query(`INSERT INTO tb_bitacora_auditoria(tb_proyecto_id,categoria,origen,entidad,detalle,accion_realizada,tb_usuario_id,fecha_hora)
    SELECT $1,$2,'USUARIO',$3,$4,$5,$6,NOW()
    WHERE NOT EXISTS(SELECT 1 FROM tb_bitacora_auditoria WHERE tb_proyecto_id=$1 AND tb_usuario_id=$6 AND origen='USUARIO' AND fecha_hora >= NOW()-INTERVAL '2 seconds')`,
    [projectId,category,resource,detail,action,req.user.id]).catch(error=>console.error('No fue posible registrar la auditoría HTTP:',error.message))
 })
 next()
}
