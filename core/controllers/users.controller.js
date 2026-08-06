import ResponseModel from "../models/response.model.js";
import * as provider from "../providers/user.provider.js";

function getCurrentUserId(req) {
    return req.user?.id ?? 1;
}

function handleUserError(res, error) {
    const constraint = error.constraint || "";
    let message = error.message || "No fue posible procesar el usuario.";

    if (/username/i.test(constraint)) {
        message = "El nombre de usuario ya existe.";
    } else if (/telefono/i.test(constraint)) {
        message = "El número de teléfono ya está registrado.";
    } else if (/correo/i.test(constraint)) {
        message = "El correo electrónico ya está registrado.";
    } else if (error.code === "23503") {
        message = "El rol seleccionado no existe.";
    }

    const isConflict = error.code === "23505" || /ya existe|ya está registrado|ya está en uso/i.test(message);
    const status = isConflict ? 409 : 500;

    return res.status(status).json(ResponseModel.fail(message, null, status));
}

export const listUsers = async (req, res) => {
    try {
        const search = req.query.search || "";
        const users = await provider.listUsers(search);

        return res.status(200).json(
            ResponseModel.ok({ usuarios: users }, "Usuarios consultados correctamente.")
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const listRoles = async (_req, res) => {
    try {
        const roles = await provider.listRoles();

        return res.status(200).json(
            ResponseModel.ok({ roles }, "Roles consultados correctamente.")
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const createUser = async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            correo_electronico,
            username,
            codigo_pais,
            telefono,
            password,
            tb_rol_id,
        } = req.body;

        if (!nombres || !apellidos || !correo_electronico || !password) {
            return res.status(400).json(ResponseModel.fail("Faltan campos obligatorios.", null, 400));
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 72) {
            return res.status(400).json(ResponseModel.fail("La contraseña debe tener entre 8 y 72 caracteres.", null, 400));
        }

        if ((codigo_pais || telefono) && (!/^\+[1-9]\d{0,3}$/.test(codigo_pais || "") || !/^\d{7,15}$/.test(telefono || ""))) {
            return res.status(400).json(ResponseModel.fail("El código de país o el teléfono no tienen un formato válido.", null, 400));
        }

        const user = await provider.createUser({
            nombres,
            apellidos,
            correo_electronico,
            username,
            codigo_pais,
            telefono,
            password,
            tb_rol_id,
            cod_usuario_registro: getCurrentUserId(req),
        });

        return res.status(201).json(
            ResponseModel.ok({ usuario: user.toResponse() }, "Usuario creado correctamente.", 201)
        );
    } catch (error) {
        return handleUserError(res, error);
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombres,
            apellidos,
            correo_electronico,
            codigo_pais,
            telefono,
            tb_rol_id,
            sn_activo,
        } = req.body;

        if (!id || !nombres || !apellidos || !correo_electronico || !tb_rol_id) {
            return res.status(400).json(ResponseModel.fail("Faltan campos obligatorios.", null, 400));
        }

        if (Number(id) === Number(req.user?.id) && sn_activo === false) {
            return res.status(400).json(ResponseModel.fail("No puedes desactivar tu propia sesión.", null, 400));
        }

        if ((codigo_pais || telefono) && (!/^\+[1-9]\d{0,3}$/.test(codigo_pais || "") || !/^\d{7,15}$/.test(telefono || ""))) {
            return res.status(400).json(ResponseModel.fail("El código de país o el teléfono no tienen un formato válido.", null, 400));
        }

        await provider.updateUser({
            id: Number(id),
            nombres,
            apellidos,
            correo_electronico,
            codigo_pais,
            telefono,
            tb_rol_id: Number(tb_rol_id),
            sn_activo: Boolean(sn_activo),
            cod_usuario_modifica: getCurrentUserId(req),
        });

        return res.status(200).json(ResponseModel.ok(null, "Usuario actualizado correctamente."));
    } catch (error) {
        return handleUserError(res, error);
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!id || !password) {
            return res.status(400).json(ResponseModel.fail("Faltan campos obligatorios.", null, 400));
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 72) {
            return res.status(400).json(ResponseModel.fail("La contraseña debe tener entre 8 y 72 caracteres.", null, 400));
        }

        await provider.updatePassword({
            id: Number(id),
            password,
            cod_usuario_modifica: getCurrentUserId(req),
        });

        return res.status(200).json(ResponseModel.ok(null, "Contraseña actualizada correctamente."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { sn_activo } = req.body;

        if (!id || typeof sn_activo !== "boolean") {
            return res.status(400).json(ResponseModel.fail("Faltan campos obligatorios.", null, 400));
        }


        if (Number(id) === Number(req.user?.id) && sn_activo === false) {
            return res.status(400).json(ResponseModel.fail("No puedes desactivar tu propia sesión.", null, 400));
        }

        await provider.updateStatus({
            id: Number(id),
            sn_activo,
            cod_usuario_modifica: getCurrentUserId(req),
        });

        return res.status(200).json(ResponseModel.ok(null, "Estado de usuario actualizado correctamente."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};
