import { Router } from "express";
import { acknowledgeIncident, getNotifications, removeNotification, reviewNotification } from "../controllers/notifications.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyToken, verifyProjectAccess, requirePermission("alertas.view"));
router.get("/", getNotifications);
router.patch("/:id/revisada", reviewNotification);
router.patch("/:id/reconocida", acknowledgeIncident);
router.delete("/:id", removeNotification);

export default router;
