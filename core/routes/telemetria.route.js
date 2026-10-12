import { Router } from "express";
import { insertarTelemetria, insertarTelemetriaGateway, listTelemetriaHardware } from "../controllers/telemetria.controller.js";
import { verifyApiKey } from "../middlewares/apiKey.middleware.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = Router();

router.post("/lecturas", verifyApiKey, insertarTelemetria);
router.post("/gateway", verifyApiKey, insertarTelemetriaGateway);
router.get("/listado", verifyToken, verifyProjectAccess, listTelemetriaHardware);

export default router;
