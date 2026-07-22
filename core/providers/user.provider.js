import DatabaseExecutor from "../database/database.executor.js";
import Usuario  from "../models/user.model.js";
import { encryptPassword } from "../utils/bcrypt.util.js";

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
            passwordHash,
            tb_rol_id,
            cod_usuario_registro
        ]
    );

    return await login(correo_electronico);
};