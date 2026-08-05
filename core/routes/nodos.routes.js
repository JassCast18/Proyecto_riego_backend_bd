import { Router } from "express";
import { listHardwareState, switchNodeEnergy } from "../controllers/nodos.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";

const router = Router();

router.get("/estado-hardware", verifyToken, listHardwareState);
router.patch("/:id/energia", verifyToken, switchNodeEnergy);

export default router;