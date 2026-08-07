import { Router } from "express";
import {
    createMaster,
    listMasters,
    removeMaster,
    updateMaster,
} from "../controllers/master-data.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { requireProjectAdministrator, verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = Router();

router.get("/:masterKey", verifyToken, verifyProjectAccess, requireProjectAdministrator, listMasters);
router.post("/:masterKey", verifyToken, verifyProjectAccess, requireProjectAdministrator, createMaster);
router.patch("/:masterKey/:id", verifyToken, verifyProjectAccess, requireProjectAdministrator, updateMaster);
router.delete("/:masterKey/:id", verifyToken, verifyProjectAccess, requireProjectAdministrator, removeMaster);

export default router;
