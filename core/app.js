import express from "express";
import cors from "cors";
import userRoutes from "./routes/auth.routes.js";
import telemetriaRoutes from "./routes/telemetria.route.js";
import masterDataRoutes from "./routes/master-data.routes.js";
import nodosRoutes from "./routes/nodos.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import manualControlRoutes from "./routes/manual-control.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import supportRoutes from "./routes/support.routes.js";
import {auditUserMutation} from "./middlewares/user-action-audit.middleware.js";
import {securityHeaders} from "./middlewares/security.middleware.js";
import { db } from "./database/connection.database.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origen no permitido por CORS."));
    },
    allowedHeaders: ["Content-Type", "Authorization", "X-Project-Id"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(securityHeaders);
app.use(express.json({ limit: "100kb" }));
app.use(auditUserMutation);

app.get("/api/health", async (_req, res) => {
    try {
        await db.query("SELECT 1");
        return res.json({ status: "ok", database: "connected" });
    } catch {
        return res.status(503).json({ status: "error", database: "unavailable" });
    }
});

app.use("/api/users", userRoutes);
app.use("/api/telemetria", telemetriaRoutes);
app.use("/api/masters", masterDataRoutes);
app.use("/api/nodos", nodosRoutes);
app.use("/api/notificaciones", notificationsRoutes);
app.use("/api/proyectos", projectsRoutes);
app.use("/api/reportes", reportsRoutes);
app.use("/api/control-manual", manualControlRoutes);
app.use("/api/ia", aiRoutes);
app.use("/api/auditoria", auditRoutes);
app.use("/api/soporte", supportRoutes);
app.get("/", (req,res)=>{
    res.json({
        message:"API funcionando"
    });
});

export default app;
