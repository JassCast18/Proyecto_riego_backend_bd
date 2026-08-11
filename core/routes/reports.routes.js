import { Router } from "express";
import { createFieldReport,listFieldReports,listOperationalHistory,listCycleComparison,viewReportAttachment } from "../controllers/reports.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";
import { handleReportUpload } from "../middlewares/report-upload.middleware.js";

const router=Router();
router.use(verifyToken,verifyProjectAccess);
router.get("/informes",listFieldReports);
router.post("/informes",handleReportUpload,createFieldReport);
router.get("/adjuntos/:id",viewReportAttachment);
router.get("/historial",listOperationalHistory);
router.get("/comparacion-ciclos",listCycleComparison);
export default router;
