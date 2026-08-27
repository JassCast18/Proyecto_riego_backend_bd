import { Router } from "express";
import { acknowledgeIncident, getNotifications, removeNotification, reviewNotification } from "../controllers/notifications.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = Router();

router.get("/", verifyToken, verifyProjectAccess, getNotifications);
router.patch("/:id/revisada", verifyToken, verifyProjectAccess, reviewNotification);
router.patch("/:id/reconocida", verifyToken, verifyProjectAccess, acknowledgeIncident);
router.delete("/:id", verifyToken, verifyProjectAccess, removeNotification);

export default router;
