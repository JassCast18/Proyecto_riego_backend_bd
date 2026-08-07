import ResponseModel from "../models/response.model.js";
import {
    createMasterRecord,
    deleteMasterRecord,
    listMasterDefinitions,
    listMasterRecords,
    updateMasterRecord,
} from "../providers/master-data.provider.js";

function getMasterKey(req) {
    return req.params.masterKey ?? req.params.module ?? req.body.masterKey;
}

export const listMasters = async (req, res) => {
    try {
        const masterKey = getMasterKey(req);

        if (!masterKey) {
            return res.status(400).json(ResponseModel.fail("Debe indicar el módulo maestro.", null, 400));
        }

        const registros = await listMasterRecords(masterKey, req.projectId);

        return res.status(200).json(
            ResponseModel.ok({ registros, masters: listMasterDefinitions() }, "Datos maestros consultados correctamente.")
        );
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const createMaster = async (req, res) => {
    try {
        const masterKey = getMasterKey(req);
        const payload = req.body ?? {};

        if (!masterKey) {
            return res.status(400).json(ResponseModel.fail("Debe indicar el módulo maestro.", null, 400));
        }

        await createMasterRecord(masterKey, payload, req.projectId);

        return res.status(201).json(ResponseModel.ok(null, "Registro creado correctamente.", 201));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const updateMaster = async (req, res) => {
    try {
        const masterKey = getMasterKey(req);
        const { id } = req.params;
        const payload = req.body ?? {};

        if (!masterKey || !id) {
            return res.status(400).json(ResponseModel.fail("Debe indicar el módulo maestro y el id del registro.", null, 400));
        }

        await updateMasterRecord(masterKey, id, payload, req.projectId);

        return res.status(200).json(ResponseModel.ok(null, "Registro actualizado correctamente."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};

export const removeMaster = async (req, res) => {
    try {
        const masterKey = getMasterKey(req);
        const { id } = req.params;

        if (!masterKey || !id) {
            return res.status(400).json(ResponseModel.fail("Debe indicar el módulo maestro y el id del registro.", null, 400));
        }

        await deleteMasterRecord(masterKey, id, req.projectId);

        return res.status(200).json(ResponseModel.ok(null, "Registro eliminado correctamente."));
    } catch (error) {
        return res.status(500).json(ResponseModel.fail(error.message));
    }
};
