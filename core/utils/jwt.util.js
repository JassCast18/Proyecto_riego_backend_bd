import jwt from "jsonwebtoken";

export const generateToken=(usuario)=>{
    const expiresIn = process.env.JWT_EXPIRES?.trim() || "1h";

    return jwt.sign(

        {
            id:usuario.id_usuario,
            usuario:usuario.usuario,
            rol:usuario.rol
        },

        process.env.JWT_SECRET,

        {
            expiresIn
        }

    );

}

export const decodeToken=(token)=>{

    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );

};