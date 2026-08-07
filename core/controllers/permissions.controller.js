import ResponseModel from "../models/response.model.js";
import { listPermissionsByRole } from "../providers/permissions.provider.js";

export const listMyPermissions = async (req, res) => {
    try {
        const tbRolId = req.projectRoleId;

        if (!tbRolId) {
            return res.status(400).json(ResponseModel.fail("No fue posible identificar el rol dentro del proyecto.", null, 400));
        }

        const permisos = await listPermissionsByRole(tbRolId);

        return res.status(200).json(
            ResponseModel.ok({ permisos }, "Permisos consultados correctamente.")
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};
