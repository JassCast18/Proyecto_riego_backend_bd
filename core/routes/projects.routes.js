import { Router } from "express";
import {
    configureProjectCrop,
    createProject,
    listCrops,
    listMyProjects,
    createProjectInfrastructure,
    assignProjectUser,
    searchPlantReferences,
    getPlantReferenceDetail,
    getCropParameters,
    listCropParameterHistory,
    changeProjectStatus,
    finishCropCycle,
    startCropCycle,
    correctInitialParameters,
} from "../controllers/projects.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { requireProjectAdministrator, verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", listMyProjects);
router.get("/cultivos", listCrops);
router.get("/referencias/plantas", searchPlantReferences);
router.get("/referencias/plantas/:slug", getPlantReferenceDetail);
router.get("/:id/parametrizacion", getCropParameters);
router.get("/:id/parametrizacion/historial", listCropParameterHistory);
router.patch("/:id/estado", changeProjectStatus);
router.post("/:id/ciclos/finalizar", finishCropCycle);
router.post("/:id/ciclos/iniciar", startCropCycle);
router.post("/", createProject);
router.put("/:id/cultivo", configureProjectCrop);
router.put("/:id/parametros-iniciales",verifyProjectAccess,requireProjectAdministrator,correctInitialParameters);
router.post("/:id/infraestructura", createProjectInfrastructure);
router.post("/:id/usuarios", assignProjectUser);

export default router;
