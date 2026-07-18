import DatabaseExecutor from "../database/database.executor.js";
import Usuario  from "../models/user.model.js";

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