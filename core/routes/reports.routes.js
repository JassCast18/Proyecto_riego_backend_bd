import { Router } from "express";
import { createFieldReport,listFieldReports,listOperationalHistory,listCycleComparison,viewReportAttachment } from "../controllers/reports.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";
import { handleReportUpload } from "../middlewares/report-upload.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router=Router();
router.use(verifyToken,verifyProjectAccess);
router.get("/informes",requirePermission("informes.view","listado_informes.view"),listFieldReports);
router.post("/informes",requirePermission("informes.view"),handleReportUpload,createFieldReport);
router.get("/adjuntos/:id",requirePermission("informes.view","listado_informes.view"),viewReportAttachment);
router.get("/historial",requirePermission("historial_operativo.view"),listOperationalHistory);
router.get("/comparacion-ciclos",requirePermission("comparacion_ciclos.view"),listCycleComparison);
export default router;
