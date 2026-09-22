import ResponseModel from '../models/response.model.js'
import {searchUserAudit} from '../providers/audit.provider.js'

export async function search(req,res){try{
 const page=Math.max(1,Number(req.query.pagina)||1),pageSize=Math.min(100,Math.max(5,Number(req.query.tamano)||10));
 const rows=await searchUserAudit({projectId:req.projectId,userId:req.user.id,page,pageSize,search:String(req.query.buscar||'').trim(),category:String(req.query.categoria||'').trim(),actorId:Number(req.query.usuario)||null,from:req.query.desde||null,to:req.query.hasta||null,action:String(req.query.accion||'').trim()});
 return res.json(ResponseModel.ok(rows[0]?.fn_consultar_auditoria_usuario||{},'Auditoría consultada correctamente.'));
}catch(error){return res.status(/acceso/i.test(error.message)?403:500).json(ResponseModel.fail(error.message))}}
