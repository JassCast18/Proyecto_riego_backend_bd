import DatabaseExecutor from "../database/database.executor.js";
import Usuario  from "../models/user.model.js";
import { encryptPassword } from "../utils/bcrypt.util.js";

function getUsername(correoElectronico, username) {
    return (username && username.trim()) || correoElectronico.split("@")[0];
}

export const login = async (correo) => {

    const rows = await DatabaseExecutor.executeFunction(
        "fn_login_usuario",
        [correo]
    );

       if (rows.length === 0) {
        return null;
    }

    return new Usuario(rows[0]);
};

export const register = async ({
    nombres,
    apellidos,
    correo_electronico,
    username,
    password,
    tb_rol_id = 2,
    cod_usuario_registro = 1
}) => {
    const passwordHash = await encryptPassword(password);

    await DatabaseExecutor.executeProcedure(
        "sp_registro_usuario",
        [
            nombres,
            apellidos,
            correo_electronico,
            getUsername(correo_electronico, username),
            passwordHash,
            tb_rol_id,
            cod_usuario_registro
        ]
    );

    return await login(correo_electronico);
};

export const listUsers = async (search = "") => {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_listar_usuarios",
        [search]
    );

    return rows.map((row) => new Usuario(row).toAdminResponse());
};

export const listRoles = async () => {
    return await DatabaseExecutor.executeFunction("fn_listar_roles", []);
};

export const createUser = async (payload) => {
    return await register(payload);
};

export const updateUser = async ({
    id,
    nombres,
    apellidos,
    correo_electronico,
    username,
    tb_rol_id,
    sn_activo,
    cod_usuario_modifica = 1
}) => {
    await DatabaseExecutor.executeProcedure(
        "sp_actualizar_usuario",
        [
            id,
            nombres,
            apellidos,
            correo_electronico,
            getUsername(correo_electronico, username),
            tb_rol_id,
            sn_activo,
            cod_usuario_modifica
        ]
    );
};

export const updatePassword = async ({
    id,
    password,
    cod_usuario_modifica = 1
}) => {
    const passwordHash = await encryptPassword(password);

    await DatabaseExecutor.executeProcedure(
        "sp_actualizar_password_usuario",
        [id, passwordHash, cod_usuario_modifica]
    );
};

export const updateStatus = async ({
    id,
    sn_activo,
    cod_usuario_modifica = 1
}) => {
    await DatabaseExecutor.executeProcedure(
        "sp_actualizar_estado_usuario",
        [id, sn_activo, cod_usuario_modifica]
    );
};