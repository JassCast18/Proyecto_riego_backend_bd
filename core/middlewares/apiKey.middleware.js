// ruta: src/middlewares/apiKey.middleware.js
import ResponseModel from "../models/response.model.js";
import crypto from "node:crypto";

export const verifyApiKey = (req, res, next) => {
  
    const apiKey = req.headers['x-api-key'];

    const validKey = process.env.IOT_API_KEY;

    //Validamos
    if (!validKey) {
        return res.status(503).json(ResponseModel.fail("El acceso de hardware no está configurado en el servidor."));
    }

    if (!apiKey) {
        return res.status(401).json(ResponseModel.fail("Acceso denegado. No se proporcionó API Key de hardware."));
    }

    const provided = Buffer.from(String(apiKey));
    const expected = Buffer.from(String(validKey));
    const matches = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

    if (!matches) {
        return res.status(403).json(ResponseModel.fail("Acceso denegado. API Key de hardware inválida."));
    }

    // Si la llave es correcta, dejamos que pase al controlador
    next();
};
