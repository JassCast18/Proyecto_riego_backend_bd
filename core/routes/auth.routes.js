import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import {
	createUser,
	listRoles,
	listUsers,
	updatePassword,
	updateStatus,
	updateUser,
} from "../controllers/users.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";

const router = Router();

router.post("/login",login);
router.post("/register", register);
router.get("/manage", verifyToken, listUsers);
router.get("/manage/roles", verifyToken, listRoles);
router.post("/manage", verifyToken, createUser);
router.patch("/manage/:id", verifyToken, updateUser);
router.patch("/manage/:id/password", verifyToken, updatePassword);
router.patch("/manage/:id/status", verifyToken, updateStatus);


export default router;