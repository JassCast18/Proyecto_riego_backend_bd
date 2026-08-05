import ResponseModel from "../models/response.model.js";
import { listHardwareNodes, updateNodeEnergyState } from "../providers/nodos.provider.js";

export const listHardwareState = async (_req, res) => {
    try {
        const nodos = await listHardwareNodes();

        return res.status(200).json(
            ResponseModel.ok({ nodos }, "Estado de hardware consultado correctamente.")
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const switchNodeEnergy = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_energia } = req.body;

        if (!id || !estado_energia) {
            return res.status(400).json(ResponseModel.fail("Faltan campos obligatorios.", null, 400));
        }

        await updateNodeEnergyState({
            id: Number(id),
            estadoEnergia: String(estado_energia).toUpperCase(),
        });

        return res.status(200).json(
            ResponseModel.ok(
                {
                    id: Number(id),
                    estadoEnergia: String(estado_energia).toUpperCase(),
                    accion: String(estado_energia).toUpperCase() === "APAGADO" ? "SUSPENDER" : "REANUDAR",
                },
                "Estado de energía actualizado correctamente."
            )
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};