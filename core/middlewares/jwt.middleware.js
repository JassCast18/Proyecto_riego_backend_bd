import jwt from "jsonwebtoken";

export const verifyToken=(req,res,next)=>{

    const authHeader=req.headers.authorization;
    const cookieToken=String(req.headers.cookie||'').split(';').map(value=>value.trim()).find(value=>value.startsWith('nodalvia_session='))?.slice('nodalvia_session='.length);
    if(!authHeader&&!cookieToken){
        return res.status(401).json({message:"Token requerido"});
    }
    const token=authHeader?.split(" ")[1]||decodeURIComponent(cookieToken);
    try{
        const decoded=jwt.verify(token, process.env.JWT_SECRET,{issuer:process.env.JWT_ISSUER||'nodalvia-api',audience:process.env.JWT_AUDIENCE||'nodalvia-web'});
        req.user=decoded;
        next();
    }catch{
        return res.status(401).json({message:"Token inválido"});
    }

}
