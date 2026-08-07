import ResponseModel from "../models/response.model.js";
import {
    createMasterRecord,
    deleteMasterRecord,
    listMasterDefinitions,
    listMasterRecords,
    updateMasterRecord,
    getRoleAccess,
    saveRoleAccess,
} from "../providers/master-data.provider.js";

export const getRoleAccessConfiguration = async (req, res) => {
    try {
        const roleId = req.query.rolId ? Number(req.query.rolId) : null;
        const modules = await getRoleAccess(roleId);
        return res.status(200).json(ResponseModel.ok({ modulos: modules }, "Accesos del rol consultados correctamente."));
    } catch (error) { return res.status(500).json(ResponseModel.fail(error.message)); }
};

export const saveRoleWithAccess = async (req, res) => {
    try {
        const roleId = req.params.id ? Number(req.params.id) : null;
        const name = String(req.body?.nombre_rol || "").trim();
        const moduleIds = Array.isArray(req.body?.modulos) ? req.body.modulos.map(Number).filter(Number.isInteger) : [];
        const submoduleIds = Array.isArray(req.body?.submodulos) ? req.body.submodulos.map(Number).filter(Number.isInteger) : [];
        if (!name) return res.status(400).json(ResponseModel.fail("El nombre del rol es obligatorio.", null, 400));
        const result = await saveRoleAccess({ roleId, name, moduleIds, submoduleIds });
        return res.status(roleId ? 200 : 201).json(ResponseModel.ok({ rolId: result?.p_rol_guardado_id }, roleId ? "Rol actualizado correctamente." : "Rol creado correctamente.", roleId ? 200 : 201));
    } catch (error) {
        const conflict = /ya existe/i.test(error.message);
        return res.status(conflict ? 409 : 500).json(ResponseModel.fail(error.message, null, conflict ? 409 : 500));
    }
};

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
