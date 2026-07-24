import ResponseModel from "../models/response.model.js";
import * as userProvider from "../providers/user.provider.js";
import { listPermissionsByRole } from "../providers/permissions.provider.js";

export const listMyPermissions = async (req, res) => {
    try {
        let tbRolId = req.user?.tbRolId ?? req.user?.tb_rol_id;

        if (!tbRolId && req.user?.usuario) {
            const currentUser = await userProvider.login(req.user.usuario);
            tbRolId = currentUser?.tbRolId ?? currentUser?.tb_rol_id;
        }

        if (!tbRolId) {
            return res.status(400).json(ResponseModel.fail("No fue posible identificar el rol del usuario.", null, 400));
        }

        const permisos = await listPermissionsByRole(tbRolId);

        return res.status(200).json(
            ResponseModel.ok({ permisos }, "Permisos consultados correctamente.")
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};