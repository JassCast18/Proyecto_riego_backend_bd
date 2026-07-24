import DatabaseExecutor from "../database/database.executor.js";

export const listPermissionsByRole = async (tbRolId) => {
    const rows = await DatabaseExecutor.executeFunction("fn_listar_permisos_rol", [tbRolId]);

    return rows
        .map((row) => row.codigo_permiso)
        .filter((codigoPermiso) => Boolean(codigoPermiso));
};