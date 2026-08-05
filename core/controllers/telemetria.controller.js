import * as provider from "../providers/telemetria.provider.js";
import { listHardwareNodes } from "../providers/nodos.provider.js";
import ResponseModel from "../models/response.model.js";

export const insertarTelemetria = async (req, res) => {
    try {
        const { id_nodo, humedad_cruda, temp_suelo } = req.body;

        // Validación de seguridad 
        if (!id_nodo || humedad_cruda === undefined || temp_suelo === undefined) {
            return res.status(400).json(ResponseModel.fail("Faltan parámetros de telemetría."));
        }

        const nodos = await listHardwareNodes();
        const nodo = nodos.find((item) => Number(item.id) === Number(id_nodo));
        const debeSuspender = nodo?.estadoEnergia === "APAGADO";

        if (!debeSuspender) {
            await provider.insertarTelemetria({
                id_nodo,
                humedad: humedad_cruda,
                temperatura: temp_suelo
            });
        }



        return res.status(201).json(
            ResponseModel.ok(
                {
                    accion: debeSuspender ? "SUSPENDER" : "CONTINUAR",
                    estadoEnergia: nodo?.estadoEnergia ?? "ENCENDIDO",
                    nodo: nodo ? {
                        id: nodo.id,
                        tipoNodo: nodo.tipoNodo,
                        estadoGeneral: nodo.estadoGeneral,
                        estadoTemp: nodo.estadoTemp,
                        estadoHum: nodo.estadoHum,
                        ultimaConexion: nodo.ultimaConexion,
                    } : null,
                },
                debeSuspender
                    ? "El nodo está apagado. Telemetría ignorada (no guardada)."
                    : "Datos de telemetría guardados correctamente.",
                201
            )
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const listTelemetriaHardware = async (req, res) => {
    try {
        const idNodoParam = req.query.id_nodo ?? req.query.idNodo ?? null;
        const pageParam = Number(req.query.page ?? 1);
        const limitParam = Number(req.query.limit ?? 15);

        const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 15;
        const idNodo = idNodoParam === null || idNodoParam === "" || String(idNodoParam).toLowerCase() === "all"
            ? null
            : Number(idNodoParam);

        if (idNodoParam !== null && idNodoParam !== "" && String(idNodoParam).toLowerCase() !== "all" && Number.isNaN(idNodo)) {
            return res.status(400).json(ResponseModel.fail("El nodo solicitado no es válido.", null, 400));
        }

        const offset = (page - 1) * limit;
        const rows = await provider.listTelemetriaHardware({
            idNodo: Number.isNaN(idNodo) ? null : idNodo,
            limit,
            offset,
        });

        const telemetrias = rows.map((row) => ({
            id: row.id,
            tbSensorId: row.tb_sensor_id,
            tbNodoId: row.tb_nodo_id,
            tipoComponente: row.tipo_componente,
            valorLectura: row.valor_lectura != null ? Number(row.valor_lectura) : null,
            fechaHora: row.fecha_hora,
        }));

        const totalRegistros = rows.length > 0 ? Number(rows[0].total_registros ?? rows[0].totalRegistros ?? telemetrias.length) : 0;

        return res.status(200).json(
            ResponseModel.ok(
                {
                    telemetrias,
                    pagination: {
                        page,
                        limit,
                        totalRegistros,
                        totalPaginas: totalRegistros === 0 ? 0 : Math.ceil(totalRegistros / limit),
                        idNodo,
                    },
                },
                "Telemetría consultada correctamente."
            )
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};