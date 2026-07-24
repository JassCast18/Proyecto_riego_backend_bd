import { Router } from "express";
import { insertarTelemetria } from "../controllers/telemetria.controller.js";
import { verifyApiKey } from "../middlewares/apiKey.middleware.js";

const router = Router();

router.post("/lecturas", verifyApiKey, insertarTelemetria);

export default router;