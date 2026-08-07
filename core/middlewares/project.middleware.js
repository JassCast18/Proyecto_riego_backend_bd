import ResponseModel from "../models/response.model.js";
import { getProjectAccess } from "../providers/project-access.provider.js";

export async function verifyProjectAccess(req, res, next) {
    const projectId = Number(req.get("X-Project-Id"));

    if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json(ResponseModel.fail("Debes seleccionar un proyecto.", null, 400));
    }

    try {
        const access = await getProjectAccess(req.user.id, projectId);
        if (!access) {
            return res.status(403).json(ResponseModel.fail("No tienes acceso al proyecto seleccionado.", null, 403));
        }

        req.projectId = projectId;
        req.projectRoleId = access.rol_id;
        req.projectRole = access.rol;
        req.isProjectOwner = access.es_propietario;
        return next();
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
}

export function requireProjectAdministrator(req, res, next) {
    if (Number(req.projectRoleId) !== 1) {
        return res.status(403).json(ResponseModel.fail("Solo el propietario o un administrador del proyecto puede acceder a este módulo.", null, 403));
    }
    return next();
}
