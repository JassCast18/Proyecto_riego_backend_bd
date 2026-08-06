import DatabaseExecutor from "../database/database.executor.js";
import Usuario  from "../models/user.model.js";
import { encryptPassword } from "../utils/bcrypt.util.js";
import crypto from "node:crypto";

function getUsername(correoElectronico, username) {
    return ((username && username.trim()) || correoElectronico.split("@")[0]).toLowerCase();
}

export const login = async (correo) => {
    const identifier = correo?.trim().toLowerCase();

    const rows = await DatabaseExecutor.executeFunction(
        "fn_login_usuario",
        [identifier]
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
    codigo_pais,
    telefono,
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
            correo_electronico.trim().toLowerCase(),
            getUsername(correo_electronico, username),
            codigo_pais || null,
            telefono || null,
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
    codigo_pais,
    telefono,
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
            correo_electronico.trim().toLowerCase(),
            codigo_pais || null,
            telefono || null,
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

function hashResetToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export const createPasswordReset = async (correoElectronico) => {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_buscar_usuario_recuperacion",
        [correoElectronico.trim().toLowerCase()],
    );

    if (rows.length === 0) return null;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await DatabaseExecutor.executeProcedure(
        "sp_crear_token_recuperacion",
        [rows[0].id, hashResetToken(token), expiresAt],
    );

    return {
        token,
        correoElectronico: rows[0].correo_electronico,
        nombreCompleto: rows[0].nombre_completo,
    };
};

export const validatePasswordResetToken = async (token) => {
    const rows = await DatabaseExecutor.executeFunction(
        "fn_validar_token_recuperacion",
        [hashResetToken(token)],
    );

    return Boolean(rows[0]?.fn_validar_token_recuperacion);
};

export const resetPassword = async ({ token, password }) => {
    const passwordHash = await encryptPassword(password);

    await DatabaseExecutor.executeProcedure(
        "sp_restablecer_password",
        [hashResetToken(token), passwordHash],
    );
};
