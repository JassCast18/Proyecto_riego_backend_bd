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
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/telemetria", telemetriaRoutes);
app.use("/api/masters", masterDataRoutes);
app.use("/api/nodos", nodosRoutes);
app.use("/api/notificaciones", notificationsRoutes);
app.use("/api/proyectos", projectsRoutes);
app.use("/api/reportes", reportsRoutes);
app.use("/api/control-manual", manualControlRoutes);
app.get("/", (req,res)=>{
    res.json({
        message:"API funcionando"
    });
});

export default app;
