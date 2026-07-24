import * as provider from "../providers/user.provider.js";
import { listPermissionsByRole } from "../providers/permissions.provider.js";
import {comparePassword} from "../utils/bcrypt.util.js";
import {generateToken} from "../utils/jwt.util.js";
import ResponseModel from "../models/response.model.js";

async function attachPermissions(user) {
    const permisos = await listPermissionsByRole(user.tbRolId);
    user.permisos = permisos;

    return user;
}

export const login=async(req,res)=>{

    try{
        const {correo_electronico,password}=req.body;

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
        await attachPermissions(user);

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
            password,
            tb_rol_id,
            cod_usuario_registro
        } = req.body;

        if (!nombres || !apellidos || !correo_electronico || !password) {
            return res.status(400).json(
                ResponseModel.fail("Faltan campos obligatorios.", null, 400)
            );
        }

        const user = await provider.register({
            nombres,
            apellidos,
            correo_electronico,
            password,
            tb_rol_id,
            cod_usuario_registro
        });

        if (!user) {
            return res.status(500).json(
                ResponseModel.fail("No fue posible crear el usuario.", null, 500)
            );
        }

        await attachPermissions(user);
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