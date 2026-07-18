import jwt from "jsonwebtoken";

export const generateToken=(usuario)=>{

    return jwt.sign(

        {
            id:usuario.id_usuario,
            usuario:usuario.usuario,
            rol:usuario.rol
        },

        process.env.JWT_SECRET,

        {
            expiresIn: process.env.JWT_EXPIRES
        }

    );

}

export const decodeToken=(token)=>{

    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );

};