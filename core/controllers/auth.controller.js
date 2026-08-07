import * as provider from "../providers/user.provider.js";
import {comparePassword} from "../utils/bcrypt.util.js";
import {generateToken} from "../utils/jwt.util.js";
import ResponseModel from "../models/response.model.js";
import { isEmailServiceConfigured, sendPasswordResetEmail } from "../services/email.service.js";

export const login=async(req,res)=>{

    try{
        const {correo_electronico,password}=req.body;

        if (typeof correo_electronico !== "string" || !correo_electronico.trim() || !password) {
            return res.status(400).json(ResponseModel.fail("Usuario y contraseña son obligatorios.", null, 400));
        }

        const user=await provider.login(correo_electronico);
        if(!user){
            return res.status(401).json(ResponseModel.fail("Usuario no existe.", null, 401));
        }

        const validPassword=await comparePassword(password,user.passwordHash);
        if(!validPassword){
            return res.status(401).json(ResponseModel.fail("Credenciales inválidas.", null, 401));
        }
  
        const token=generateToken(user);
        delete user.passwordHash; // Eliminar el hash de la contraseña antes de enviar la respuesta

        return res.status(200).json(ResponseModel.ok({ usuario: user.toResponse(), token }, "Inicio de sesión exitoso."));
    }catch(error){
        return res.status(500).json(ResponseModel.fail(error.message));
    }

}

export const register = async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            correo_electronico,
            codigo_pais,
            telefono,
            password,
            tb_rol_id,
            cod_usuario_registro
        } = req.body;

        if (!nombres || !apellidos || !correo_electronico || !password) {
            return res.status(400).json(
                ResponseModel.fail("Faltan campos obligatorios.", null, 400)
            );
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 72) {
            return res.status(400).json(
                ResponseModel.fail("La contraseña debe tener entre 8 y 72 caracteres.", null, 400)
            );
        }

        if ((codigo_pais || telefono) && (!/^\+[1-9]\d{0,3}$/.test(codigo_pais || "") || !/^\d{7,15}$/.test(telefono || ""))) {
            return res.status(400).json(ResponseModel.fail("El código de país o el teléfono no tienen un formato válido.", null, 400));
        }

        const user = await provider.register({
            nombres,
            apellidos,
            correo_electronico,
            codigo_pais,
            telefono,
            password,
            tb_rol_id,
            cod_usuario_registro
        });

        if (!user) {
            return res.status(500).json(
                ResponseModel.fail("No fue posible crear el usuario.", null, 500)
            );
        }

        const token = generateToken(user);

        return res.status(201).json(
            ResponseModel.ok(
                { usuario: user.toResponse(), token },
                "Registro exitoso.",
                201
            )
        );

    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }

}

export const requestPasswordReset = async (req, res) => {
    try {
        const correoElectronico = req.body?.correo_electronico;

        if (typeof correoElectronico !== "string" || !correoElectronico.trim()) {
            return res.status(400).json(ResponseModel.fail("El correo electrónico es obligatorio.", null, 400));
        }

        if (!isEmailServiceConfigured()) {
            return res.status(503).json(ResponseModel.fail("El servicio de correo no está configurado. Contacta al administrador.", null, 503));
        }

        const reset = await provider.createPasswordReset(correoElectronico);

        if (reset) {
            const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
            try {
                await sendPasswordResetEmail({
                    recipient: reset.correoElectronico,
                    name: reset.nombreCompleto,
                    resetUrl: `${frontendUrl}/restablecer-password?token=${encodeURIComponent(reset.token)}`,
                });
            } catch (emailError) {
                console.error("No fue posible enviar el correo de recuperación:", emailError.message);
            }
        }

        return res.status(200).json(ResponseModel.ok(null, "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const validatePasswordReset = async (req, res) => {
    try {
        const valid = typeof req.query.token === "string" && await provider.validatePasswordResetToken(req.query.token);
        return res.status(200).json(ResponseModel.ok({ valido: valid }, valid ? "Enlace válido." : "El enlace es inválido o expiró."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body ?? {};

        if (!token || typeof password !== "string" || password.length < 8 || password.length > 72) {
            return res.status(400).json(ResponseModel.fail("El enlace y una contraseña de entre 8 y 72 caracteres son obligatorios.", null, 400));
        }

        await provider.resetPassword({ token, password });
        return res.status(200).json(ResponseModel.ok(null, "Contraseña restablecida correctamente."));
    } catch (error) {
        return res.status(400).json(ResponseModel.fail(error.message, null, 400));
    }
};
