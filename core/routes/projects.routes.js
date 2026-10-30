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
import { requireMatchingProject, requireProjectAdministrator, verifyProjectAccess } from "../middlewares/project.middleware.js";
import {requirePermission} from "../middlewares/permission.middleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", listMyProjects);
router.get("/cultivos", listCrops);
router.get("/referencias/plantas", searchPlantReferences);
router.get("/referencias/plantas/:slug", getPlantReferenceDetail);
router.get("/:id/parametrizacion",verifyProjectAccess,requireMatchingProject,requirePermission("cultivo.view"),getCropParameters);
router.get("/:id/parametrizacion/historial",verifyProjectAccess,requireMatchingProject,requirePermission("cultivo.view"),listCropParameterHistory);
router.patch("/:id/estado",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,changeProjectStatus);
router.post("/:id/ciclos/finalizar",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,finishCropCycle);
router.post("/:id/ciclos/iniciar",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,startCropCycle);
router.post("/", createProject);
router.put("/:id/cultivo",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,configureProjectCrop);
router.put("/:id/parametros-iniciales",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,correctInitialParameters);
router.post("/:id/infraestructura",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,createProjectInfrastructure);
router.post("/:id/usuarios",verifyProjectAccess,requireMatchingProject,requireProjectAdministrator,assignProjectUser);

export default router;
