import express from "express";
import cors from "cors";
import userRoutes from "./routes/auth.routes.js";
import telemetriaRoutes from "./routes/telemetria.route.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/telemetria", telemetriaRoutes);
app.get("/", (req,res)=>{
    res.json({
        message:"API funcionando"
    });
});

export default app;