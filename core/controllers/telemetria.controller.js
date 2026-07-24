import * as provider from "../providers/telemetria.provider.js";
import ResponseModel from "../models/response.model.js";

export const insertarTelemetria = async (req, res) => {
    try {
        const { id_nodo, humedad_cruda, temp_suelo } = req.body;

        // Validación de seguridad 
        if (!id_nodo || humedad_cruda === undefined || temp_suelo === undefined) {
            return res.status(400).json(ResponseModel.fail("Faltan parámetros de telemetría."));
        }

        await provider.insertarTelemetria({
            id_nodo,
            humedad: humedad_cruda,
            temperatura: temp_suelo
        });

        return res.status(201).json(
            ResponseModel.ok(null, "Datos de telemetría guardados correctamente.", 201)
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
}