import { Router } from "express";
import { listHardwareState, switchNodeEnergy } from "../controllers/nodos.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = Router();

router.get("/estado-hardware", verifyToken, verifyProjectAccess, listHardwareState);
router.patch("/:id/energia", verifyToken, verifyProjectAccess, switchNodeEnergy);

export default router;
