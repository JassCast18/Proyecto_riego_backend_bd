import * as provider from "../providers/user.provider.js";
import {comparePassword} from "../utils/bcrypt.util.js";
import {generateToken} from "../utils/jwt.util.js";
import ResponseModel from "../models/response.model.js";

export const login=async(req,res)=>{

    try{
        const {correo_electronico,password}=req.body;

        console.log("Usuario recibido:", correo_electronico);
        console.log("Password recibido:", password);

        const user=await provider.login(correo_electronico);
            console.log("Resultado BD:", user);
        if(!user || user.length === 0){
              console.log("No existe usuario");
        return res.status(401).json({
        message:"Usuario no existe"
        });
        }
           console.log("Usuario encontrado:", user);

        const validPassword=await comparePassword(password,user.passwordHash);
           console.log("Password valido:", validPassword);
        if(!validPassword){
            return res.status(401).json(ResponseModel.fail("Credenciales inválidas.", null, 401));
             console.log("Password incorrecto");
        }
  
        const token=generateToken(user);
        delete user.passwordHash; // Eliminar el hash de la contraseña antes de enviar la respuesta
        console.log(token);

        return res.status(200).json(ResponseModel.ok({ usuario: user.toResponse(), token }, "Inicio de sesión exitoso."));
    }catch(error){
        console.log(error);

        return res.status(500).json({message:error.message});

    }

}