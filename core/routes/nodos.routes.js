import { Router } from "express";
import { listHardwareState, switchNodeEnergy } from "../controllers/nodos.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = Router();

router.get("/estado-hardware", verifyToken, verifyProjectAccess, requirePermission("hardware.view"), listHardwareState);
router.patch("/:id/energia", verifyToken, verifyProjectAccess, requirePermission("pruebas_unitarias.view","gestion_valvulas.view"), switchNodeEnergy);

export default router;
