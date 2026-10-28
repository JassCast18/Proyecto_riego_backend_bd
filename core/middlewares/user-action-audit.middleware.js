import {db} from '../database/connection.database.js'

const verbs={POST:'Creación',PUT:'Actualización',PATCH:'Modificación',DELETE:'Eliminación'}
const categories={masters:'DATOS_MAESTROS',users:'USUARIOS',proyectos:'PROYECTOS',reportes:'REPORTES','control-manual':'CONTROL_MANUAL',ia:'IA',nodos:'INFRAESTRUCTURA',notificaciones:'NOTIFICACIONES',soporte:'SOPORTE'}

const labels={masters:'datos maestros',users:'usuarios',proyectos:'proyectos',reportes:'informes','control-manual':'control manual',ia:'inteligencia artificial',nodos:'infraestructura',notificaciones:'notificaciones',soporte:'soporte'}

function describeMutation(method,path,resource){
 const rules=[
  [/\/control-manual\/pruebas\/\d+\/finalizar$/,'Prueba técnica finalizada','Se guardaron el resultado y la conclusión de la prueba técnica.'],
  [/\/control-manual\/pruebas$/,'Prueba técnica iniciada','Se creó una prueba técnica para verificar un sensor o actuador.'],
  [/\/control-manual\/actuadores$/,'Válvula registrada','Se registró una válvula para las pruebas y el control manual.'],
  [/\/control-manual\/sensores\/\d+\/calibracion$/,'Sensor calibrado','Se guardaron nuevos valores de calibración para el sensor.'],
  [/\/control-manual\/sensores\/\d+\/reparacion$/,'Sensor reactivado','Se completó la reparación y se habilitó nuevamente el sensor.'],
  [/\/nodos\/\d+\/energia$/,'Estado de energía del nodo actualizado','Se cambió el estado de energía de un nodo.'],
  [/\/ia\/motor/,'Configuración de IA actualizada','Se actualizó el motor de decisiones de inteligencia artificial.'],
  [/\/reportes/,'Informe de campo actualizado','Se registró un cambio en los informes de campo.'],
  [/\/soporte/,'Ticket de soporte actualizado','Se registró una acción en un ticket de soporte.'],
 ]
 const match=rules.find(([pattern])=>pattern.test(path))
 if(match)return{action:match[1],detail:match[2]}
 const operation=method==='POST'?'Registro creado':method==='DELETE'?'Registro eliminado':'Información actualizada'
 return{action:`${operation} en ${labels[resource]||'el sistema'}`,detail:`Se completó una acción de usuario en ${labels[resource]||'el sistema'}.`}
}

export function auditUserMutation(req,res,next){
 res.on('finish',()=>{
  if(!verbs[req.method]||res.statusCode<200||res.statusCode>=400||!req.user?.id)return
  const projectId=Number(req.projectId||req.get('X-Project-Id'))
  if(!Number.isInteger(projectId)||projectId<=0)return
  const path=String(req.originalUrl||req.url).split('?')[0]
  if(path.startsWith('/api/telemetria'))return
  const resource=path.split('/').filter(Boolean)[1]||'sistema'
  const category=categories[resource]||'USUARIO'
  const {action,detail}=describeMutation(req.method,path,resource)
  db.query(`INSERT INTO tb_bitacora_auditoria(tb_proyecto_id,categoria,origen,entidad,detalle,accion_realizada,tb_usuario_id,fecha_hora)
    SELECT $1,$2,'USUARIO',$3,$4,$5,$6,NOW()
    WHERE NOT EXISTS(SELECT 1 FROM tb_bitacora_auditoria WHERE tb_proyecto_id=$1 AND tb_usuario_id=$6 AND origen='USUARIO' AND fecha_hora >= NOW()-INTERVAL '2 seconds')`,
    [projectId,category,resource,detail,action,req.user.id]).catch(error=>console.error('No fue posible registrar la auditoría HTTP:',error.message))
 })
 next()
}
