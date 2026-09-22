import ResponseModel from '../models/response.model.js'
import * as provider from '../providers/support.provider.js'
import {isJiraConfigured} from '../services/jira-support.service.js'
import {syncSupportTicket} from '../services/support-sync.service.js'
import {SUPPORT_UPLOAD_ROOT} from '../middlewares/support-upload.middleware.js'
import fs from 'node:fs/promises'
import path from 'node:path'

const categories=new Set(['HARDWARE','TELEMETRIA','RIEGO','IA','USUARIOS','REPORTES','OTRO'])
const priorities=new Set(['BAJA','MEDIA','ALTA','CRITICA'])
const statuses=new Set(['NUEVO','EN_REVISION','EN_PROGRESO','ESPERANDO_USUARIO','RESUELTO','CERRADO'])
const fail=(res,error)=>res.status(/no existe|no tienes/i.test(error.message)?404:500).json(ResponseModel.fail(error.message))

export async function faq(req,res){try{return res.json(ResponseModel.ok({articulos:await provider.listFaq(req.query.buscar||'')},'Centro de ayuda consultado.'))}catch(error){return fail(res,error)}}

export async function list(req,res){try{
 const page=Math.max(1,Number(req.query.pagina)||1),pageSize=Math.min(25,Math.max(5,Number(req.query.tamano)||10))
 const status=statuses.has(String(req.query.estado||'').toUpperCase())?String(req.query.estado).toUpperCase():''
 const data=await provider.listTickets({projectId:req.projectId,userId:req.user.id,manage:false,status,page,pageSize})
 return res.json(ResponseModel.ok(data,'Tickets consultados.'))
}catch(error){return fail(res,error)}}

export async function detail(req,res){try{
 let ticket=await provider.getTicket({ticketId:Number(req.params.id),projectId:req.projectId,userId:req.user.id,manage:false})
 if(!ticket)return res.status(404).json(ResponseModel.fail('El ticket no existe o no tienes acceso.',null,404))
 if(isJiraConfigured()){try{await syncSupportTicket(ticket.id);ticket=await provider.getTicket({ticketId:ticket.id,projectId:req.projectId,userId:req.user.id,manage:false})}catch(error){console.error('No fue posible actualizar el ticket desde Jira:',error.message)}}
 return res.json(ResponseModel.ok({ticket},'Ticket consultado.'))
}catch(error){return fail(res,error)}}

export async function create(req,res){try{
 const subject=String(req.body?.asunto||'').trim(),description=String(req.body?.descripcion||'').trim()
 const category=String(req.body?.categoria||'OTRO').toUpperCase(),priority=String(req.body?.prioridad||'MEDIA').toUpperCase()
 if(subject.length<6||subject.length>150)return res.status(400).json(ResponseModel.fail('El asunto debe contener entre 6 y 150 caracteres.',null,400))
 if(description.length<20||description.length>5000)return res.status(400).json(ResponseModel.fail('La descripción debe contener entre 20 y 5000 caracteres.',null,400))
 if(!categories.has(category)||!priorities.has(priority))return res.status(400).json(ResponseModel.fail('La categoría o prioridad no es válida.',null,400))
 const ticket=await provider.createTicket({projectId:req.projectId,userId:req.user.id,subject,description,category,priority})
 let jira=null,jiraError=null
 if(isJiraConfigured()){try{jira=await syncSupportTicket(ticket.id)}catch(error){jiraError=error.message}}
 return res.status(201).json(ResponseModel.ok({ticketId:ticket.id,codigo:`SUP-${String(ticket.id).padStart(6,'0')}`,estadoSincronizacion:jira?'SINCRONIZADO':jiraError?'ERROR':'PENDIENTE'},'Solicitud enviada a soporte.',201))
}catch(error){return fail(res,error)}}

export async function comment(req,res){try{
 const message=String(req.body?.mensaje||'').trim(),files=req.files||[]
 if((message.length<2&&!files.length)||message.length>4000)return res.status(400).json(ResponseModel.fail('Escribe un comentario o adjunta al menos un archivo.',null,400))
 const saved=await provider.addComment({ticketId:Number(req.params.id),projectId:req.projectId,userId:req.user.id,manage:false,message:message||'Archivos adjuntos enviados.'})
 if(!saved)return res.status(404).json(ResponseModel.fail('El ticket no existe o no tienes acceso.',null,404))
 if(files.length)await provider.saveAttachments({ticketId:Number(req.params.id),commentId:saved.id,files:files.map(file=>({nombreOriginal:file.originalname,nombreArchivo:file.filename,rutaArchivo:path.relative(process.cwd(),file.path).replaceAll('\\','/'),tipoMime:file.mimetype,tamanoBytes:file.size}))})
 try{if(isJiraConfigured())await syncSupportTicket(Number(req.params.id))}catch(error){console.error('Información pendiente de Jira:',error.message)}
 return res.status(201).json(ResponseModel.ok({comentarioId:saved.id,adjuntos:files.length},'Información enviada a soporte.',201))
}catch(error){await Promise.allSettled((req.files||[]).map(file=>fs.unlink(file.path)));return fail(res,error)}}

export async function downloadAttachment(req,res){try{
 const attachment=await provider.getAttachment({attachmentId:Number(req.params.id),projectId:req.projectId,userId:req.user.id})
 if(!attachment)return res.status(404).json(ResponseModel.fail('El archivo no existe o no tienes acceso.',null,404))
 const absolute=path.resolve(attachment.ruta_archivo)
 if(!absolute.startsWith(SUPPORT_UPLOAD_ROOT+path.sep))return res.status(400).json(ResponseModel.fail('La ruta del archivo no es válida.',null,400))
 await fs.access(absolute)
 res.type(attachment.tipo_mime);res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(attachment.nombre_original)}`)
 return res.sendFile(absolute)
}catch(error){return fail(res,error)}}
