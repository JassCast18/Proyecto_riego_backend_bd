import { Router } from "express";
import { login, register, requestPasswordReset, resetPassword, validatePasswordReset } from "../controllers/auth.controller.js";
import {
	createUser,
	listRoles,
	listUsers,
	updatePassword,
	updateStatus,
	updateUser,
	changeProjectMembership,
} from "../controllers/users.controller.js";
import { listMyPermissions as listMyRolePermissions } from "../controllers/permissions.controller.js";
import { verifyToken } from "../middlewares/jwt.middleware.js";
import { requireProjectAdministrator, verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = Router();

router.post("/login",login);
router.post("/forgot-password", requestPasswordReset);
router.get("/reset-password/validate", validatePasswordReset);
router.post("/reset-password", resetPassword);
router.post("/register", verifyToken, register);
router.get("/manage", verifyToken, verifyProjectAccess, requireProjectAdministrator, listUsers);
router.get("/manage/roles", verifyToken, verifyProjectAccess, requireProjectAdministrator, listRoles);
router.get("/manage/permissions", verifyToken, verifyProjectAccess, listMyRolePermissions);
router.post("/manage", verifyToken, verifyProjectAccess, requireProjectAdministrator, createUser);
router.patch("/manage/:id", verifyToken, verifyProjectAccess, requireProjectAdministrator, updateUser);
router.patch("/manage/:id/password", verifyToken, verifyProjectAccess, requireProjectAdministrator, updatePassword);
router.patch("/manage/:id/status", verifyToken, verifyProjectAccess, requireProjectAdministrator, updateStatus);
router.patch("/manage/:id/project", verifyToken, verifyProjectAccess, requireProjectAdministrator, changeProjectMembership);


export default router;
