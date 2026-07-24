// ruta: src/middlewares/apiKey.middleware.js
import ResponseModel from "../models/response.model.js";

export const verifyApiKey = (req, res, next) => {
  
    const apiKey = req.headers['x-api-key'];

    const validKey = process.env.IOT_API_KEY;

    //Validamos
    if (!apiKey) {
        return res.status(401).json(ResponseModel.fail("Acceso denegado. No se proporcionó API Key de hardware."));
    }

    if (apiKey !== validKey) {
        return res.status(403).json(ResponseModel.fail("Acceso denegado. API Key de hardware inválida."));
    }

    // Si la llave es correcta, dejamos que pase al controlador
    next();
};