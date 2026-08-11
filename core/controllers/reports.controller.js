import ResponseModel from "../models/response.model.js";
import * as provider from "../providers/reports.provider.js";
import { sendNewReportEmail,isEmailServiceConfigured } from "../services/email.service.js";
import { REPORT_UPLOAD_ROOT } from "../middlewares/report-upload.middleware.js";
import fs from "node:fs/promises";
import path from "node:path";

const fail = (res,error) => res.status(/no tienes acceso/i.test(error.message) ? 403 : 500).json(ResponseModel.fail(error.message));

export async function createFieldReport(req,res) {
    try {
        const title=String(req.body?.titulo||"").trim(); const observations=String(req.body?.observaciones||"").trim();
        if (!title || !observations) return res.status(400).json(ResponseModel.fail("El título y las observaciones son obligatorios.",null,400));
        const result=await provider.createFieldReport({
            projectId:req.projectId,userId:req.user.id,title,observations,subject:req.body.asunto,
            generalState:req.body.estadoGeneral,leafColor:req.body.colorHojas,
            leafCount:req.body.cantidadHojas===""?null:Number(req.body.cantidadHojas),
            heightCm:req.body.alturaCm===""?null:Number(req.body.alturaCm),
            stemWidthCm:req.body.grosorCm===""?null:Number(req.body.grosorCm),
            hasPests:String(req.body.presenciaPlagas).toLowerCase()==="true",pestDescription:req.body.descripcionPlagas,
            actions:req.body.accionesRealizadas,observationDate:req.body.fechaObservacion,
        });
        const reportId=Number(result?.p_informe_id);
        const attachments=(req.files||[]).map(file=>({
            nombre_original:file.originalname,nombre_archivo:file.filename,
            ruta_archivo:path.relative(process.cwd(),file.path).replaceAll("\\","/"),tipo_mime:file.mimetype,tamano_bytes:file.size,
        }));
        if (attachments.length) await provider.saveReportAttachments(reportId,req.projectId,attachments);

        let emailSent=true;
        try {
            if (!isEmailServiceConfigured()) emailSent=false;
            else {
                const [admins,context]=await Promise.all([provider.listProjectAdministrators(req.projectId),provider.getReportEmailContext(req.projectId,req.user.id)]);
                const results=await Promise.allSettled(admins.map(admin=>sendNewReportEmail({
                    recipient:admin.correo,name:admin.nombre,projectName:context?.proyecto||`Proyecto #${req.projectId}`,
                    reportTitle:title,author:req.user.username||`Usuario #${req.user.id}`,
                    observationDate:req.body.fechaObservacion||new Date().toISOString().slice(0,10),
                })));
                emailSent=results.every(item=>item.status==="fulfilled");
            }
        } catch(emailError) { emailSent=false; console.error("No fue posible notificar el nuevo informe:",emailError.message); }
        return res.status(201).json(ResponseModel.ok({informeId:reportId,adjuntos:attachments.length,correoEnviado:emailSent},emailSent?"Informe registrado y administradores notificados.":"Informe registrado. No fue posible enviar todas las notificaciones por correo.",201));
    } catch(error) {
        await Promise.allSettled((req.files||[]).map(file=>fs.unlink(file.path)));
        return fail(res,error);
    }
}

export async function listFieldReports(req,res) { try { const rows=await provider.listFieldReports(req.projectId,req.user.id); return res.json(ResponseModel.ok({informes:rows},"Informes consultados correctamente.")); } catch(error){return fail(res,error);} }
export async function listOperationalHistory(req,res) { try { const rows=await provider.listOperationalHistory(req.projectId,req.user.id); return res.json(ResponseModel.ok({historial:rows},"Historial consultado correctamente.")); } catch(error){return fail(res,error);} }
export async function listCycleComparison(req,res) { try { const rows=await provider.listCycleComparison(req.projectId,req.user.id); return res.json(ResponseModel.ok({ciclos:rows},"Ciclos consultados correctamente.")); } catch(error){return fail(res,error);} }

export async function viewReportAttachment(req,res) {
    try {
        const attachment=await provider.getReportAttachment(Number(req.params.id),req.projectId,req.user.id);
        if (!attachment) return res.status(404).json(ResponseModel.fail("El archivo adjunto no existe.",null,404));
        const absolute=path.resolve(attachment.ruta_archivo);
        if (!absolute.startsWith(REPORT_UPLOAD_ROOT+path.sep)) return res.status(400).json(ResponseModel.fail("La ruta del archivo no es válida.",null,400));
        await fs.access(absolute);
        res.type(attachment.tipo_mime); res.setHeader("Content-Disposition",`inline; filename*=UTF-8''${encodeURIComponent(attachment.nombre_original)}`);
        return res.sendFile(absolute);
    } catch(error) { return fail(res,error); }
}
