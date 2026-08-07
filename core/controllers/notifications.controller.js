import ResponseModel from "../models/response.model.js";
import {
    dismissNotification,
    listNotifications,
    markNotificationReviewed,
    syncHardwareNotifications,
} from "../providers/notifications.provider.js";

export async function getNotifications(req, res) {
    try {
        await syncHardwareNotifications(req.projectId);
        const notifications = await listNotifications({
            userId: req.user.id,
            roleId: req.projectRoleId,
            projectId: req.projectId,
            status: req.query.status || "all",
            limit: req.query.limit,
        });

        return res.status(200).json(ResponseModel.ok({ notificaciones: notifications }, "Notificaciones consultadas correctamente."));
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
