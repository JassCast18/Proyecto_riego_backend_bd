import { Router } from "express";
import { getNotifications, removeNotification, reviewNotification } from "../controllers/notifications.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";

const router = Router();

router.get("/", verifyToken, getNotifications);
router.patch("/:id/revisada", verifyToken, reviewNotification);
router.delete("/:id", verifyToken, removeNotification);

export default router;
