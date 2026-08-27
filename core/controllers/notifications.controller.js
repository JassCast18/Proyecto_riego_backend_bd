import ResponseModel from "../models/response.model.js";
import {
    dismissNotification,
    acknowledgeNotification,
    listNotifications,
    getNotificationSummary,
    listNotificationReviewers,
    markNotificationReviewed,
    syncHardwareNotifications,
} from "../providers/notifications.provider.js";

export async function getNotifications(req, res) {
    try {
        await syncHardwareNotifications(req.projectId);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50);
        const [notifications, summary, reviewers] = await Promise.all([listNotifications({
            userId: req.user.id,
            roleId: req.projectRoleId,
            projectId: req.projectId,
            status: req.query.status || "active",
            reviewer: req.query.reviewer || "all",
            page,pageSize,
        }),getNotificationSummary({userId:req.user.id,roleId:req.projectRoleId,projectId:req.projectId}),
        Number(req.projectRoleId)===1 ? listNotificationReviewers(req.projectId) : Promise.resolve([])]);
        const total = notifications[0]?.totalRegistros ?? 0;

        return res.status(200).json(ResponseModel.ok({
            notificaciones:notifications,resumen:summary,revisores:reviewers,
            paginacion:{pagina:page,tamanoPagina:pageSize,total,totalPaginas:Math.ceil(total/pageSize)},
            esAdministrador:Number(req.projectRoleId)===1,
        }, "Notificaciones consultadas correctamente."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
}

export async function acknowledgeIncident(req, res) {
    try {
        const acknowledged = await acknowledgeNotification({
            notificationId:Number(req.params.id),userId:req.user.id,
            roleId:req.projectRoleId,projectId:req.projectId,
        });
        if (!acknowledged) return res.status(409).json(ResponseModel.fail("El incidente ya fue reconocido, resuelto o no existe.",null,409));
        return res.status(200).json(ResponseModel.ok(null,"Incidente reconocido correctamente."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
}

export async function reviewNotification(req, res) {
    try {
        const updated = await markNotificationReviewed({
            notificationId: Number(req.params.id),
            userId: req.user.id,
            roleId: req.projectRoleId,
            projectId: req.projectId,
        });

        if (!updated) return res.status(404).json(ResponseModel.fail("La notificación no existe.", null, 404));
        return res.status(200).json(ResponseModel.ok(null, "Notificación marcada como revisada."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
}

export async function removeNotification(req, res) {
    try {
        const dismissed = await dismissNotification({
            notificationId: Number(req.params.id),
            userId: req.user.id,
            roleId: req.projectRoleId,
            projectId: req.projectId,
        });

        if (!dismissed) return res.status(400).json(ResponseModel.fail("Esta notificación no se puede eliminar mientras requiera atención.", null, 400));
        return res.status(200).json(ResponseModel.ok(null, "Notificación eliminada de tu lista."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
}
