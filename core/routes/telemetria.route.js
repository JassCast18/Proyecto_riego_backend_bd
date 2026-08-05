import { Router } from "express";
import { insertarTelemetria, listTelemetriaHardware } from "../controllers/telemetria.controller.js";
import { verifyApiKey } from "../middlewares/apiKey.middleware.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";

const router = Router();

router.post("/lecturas", verifyApiKey, insertarTelemetria);
router.get("/listado", verifyToken, listTelemetriaHardware);

export default router;