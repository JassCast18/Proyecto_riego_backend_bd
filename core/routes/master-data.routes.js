import { Router } from "express";
import {
    createMaster,
    listMasters,
    removeMaster,
    updateMaster,
} from "../controllers/master-data.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";

const router = Router();

router.get("/:masterKey", verifyToken, listMasters);
router.post("/:masterKey", verifyToken, createMaster);
router.patch("/:masterKey/:id", verifyToken, updateMaster);
router.delete("/:masterKey/:id", verifyToken, removeMaster);

export default router;