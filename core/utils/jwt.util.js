import jwt from "jsonwebtoken";

export const generateToken=(usuario)=>{
    const expiresIn = process.env.JWT_EXPIRES?.trim() || "1h";
    const usuarioToken = usuario.username || usuario.correoElectronico || usuario.usuario || "";

    return jwt.sign(

        {
            id:usuario.id,
            usuario:usuarioToken,
            snPropietario: usuario.snPropietario ?? 0
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
