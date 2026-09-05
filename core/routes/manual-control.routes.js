import {Router} from "express";
import {verifyToken} from "../middlewares/jwt.middleware.js";
import {verifyProjectAccess} from "../middlewares/project.middleware.js";
import {verifyApiKey} from "../middlewares/apiKey.middleware.js";
import {catalog,listTests,getTest,startTest,finishTest,takeCommands,confirmCommand,createActuator,calibrateSensor,completeSensorRepair} from "../controllers/manual-control.controller.js";

const router=Router();
router.get("/iot/nodos/:nodeId/comandos",verifyApiKey,takeCommands);
router.post("/iot/comandos/:id/confirmar",verifyApiKey,confirmCommand);
router.get("/catalogo",verifyToken,verifyProjectAccess,catalog);
router.get("/pruebas",verifyToken,verifyProjectAccess,listTests);
router.get("/pruebas/:id",verifyToken,verifyProjectAccess,getTest);
router.post("/pruebas",verifyToken,verifyProjectAccess,startTest);
router.post("/actuadores",verifyToken,verifyProjectAccess,createActuator);
router.post("/sensores/:sensorId/calibracion",verifyToken,verifyProjectAccess,calibrateSensor);
router.patch("/sensores/:sensorId/reparacion-completada",verifyToken,verifyProjectAccess,completeSensorRepair);
router.patch("/pruebas/:id/finalizar",verifyToken,verifyProjectAccess,finishTest);
export default router;
