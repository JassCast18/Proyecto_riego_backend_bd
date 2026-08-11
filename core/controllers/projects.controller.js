import ResponseModel from "../models/response.model.js";
import * as provider from "../providers/projects.provider.js";
import { getPlantReference, searchPlantVarieties } from "../services/plant-reference.service.js";

function projectError(res, error) {
    const conflict = error.code === "23505" || /ya tienes|ya existe/i.test(error.message);
    const forbidden = /no tienes (?:permiso|acceso)|solo un administrador/i.test(error.message);
    const status = conflict ? 409 : forbidden ? 403 : 500;
    return res.status(status).json(ResponseModel.fail(error.message, null, status));
}

export const listMyProjects = async (req, res) => {
    try {
        const inactive = req.query.estado === "inactivos";
        const projects = await provider.listUserProjects(req.user.id, inactive);
        const mayCreateProjects = await provider.canCreateProjects(req.user.id);
        return res.status(200).json(ResponseModel.ok({
            proyectos: projects,
            puedeCrearProyectos: mayCreateProjects,
        }, "Proyectos consultados correctamente."));
    } catch (error) {
        return projectError(res, error);
    }
};

export const getCropParameters = async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        if (!projectId) return res.status(400).json(ResponseModel.fail("El proyecto es obligatorio.", null, 400));
        const parameters = await provider.getCropParameters(projectId, req.user.id);
        if (!parameters) return res.status(404).json(ResponseModel.fail("No se encontró la parametrización del proyecto.", null, 404));
        return res.status(200).json(ResponseModel.ok({ parametrizacion: parameters }, "Parametrización consultada correctamente."));
    } catch (error) { return projectError(res, error); }
};

export const listCropParameterHistory = async (req, res) => {
    try {
        const history = await provider.listCropParameterHistory(Number(req.params.id), req.user.id);
        return res.status(200).json(ResponseModel.ok({ historial: history }, "Historial consultado correctamente."));
    } catch (error) { return projectError(res, error); }
};

export const changeProjectStatus = async (req, res) => {
    try {
        const active = req.body?.activo;
        if (typeof active !== "boolean") return res.status(400).json(ResponseModel.fail("El estado del proyecto es obligatorio.", null, 400));
        await provider.changeProjectStatus({ projectId: Number(req.params.id), userId: req.user.id, active });
        return res.status(200).json(ResponseModel.ok(null, active ? "Proyecto reactivado correctamente." : "Proyecto desactivado correctamente."));
    } catch (error) { return projectError(res, error); }
};

export const listCrops = async (_req, res) => {
    try {
        const crops = await provider.listCrops();
        return res.status(200).json(ResponseModel.ok({ cultivos: crops }, "Cultivos consultados correctamente."));
    } catch (error) {
        return projectError(res, error);
    }
};

export const searchPlantReferences = async (req, res) => {
    try {
        const query = String(req.query.q || "").trim();
        if (query.length < 2) return res.status(200).json(ResponseModel.ok({ variedades: [] }, "Escribe al menos dos caracteres."));
        const varieties = await searchPlantVarieties(query);
        return res.status(200).json(ResponseModel.ok({ variedades: varieties }, "Referencias consultadas en FAO EcoCrop."));
    } catch (error) {
        return res.status(503).json(ResponseModel.fail(error.message, null, 503));
    }
};

export const getPlantReferenceDetail = async (req, res) => {
    try {
        const reference = await getPlantReference(req.params.slug);
        return res.status(200).json(ResponseModel.ok({ referencia: reference }, "Parámetros consultados en FAO EcoCrop."));
    } catch (error) {
        return res.status(503).json(ResponseModel.fail(error.message, null, 503));
    }
};

export const createProject = async (req, res) => {
    try {
        if (!await provider.canCreateProjects(req.user.id)) {
            return res.status(403).json(ResponseModel.fail("Solo los usuarios con rol de sistema Propietario pueden crear proyectos.", null, 403));
        }

        const name = req.body?.nombre;
        if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json(ResponseModel.fail("El nombre debe contener entre 3 y 100 caracteres.", null, 400));
        }

        const projectId = await provider.createProject({
            name,
            description: req.body?.descripcion,
            userId: req.user.id,
        });

        return res.status(201).json(ResponseModel.ok({ proyectoId: projectId }, "Proyecto creado correctamente.", 201));
    } catch (error) {
        return projectError(res, error);
    }
};

export const configureProjectCrop = async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        const cropId = Number(req.body?.cultivoId);
        if (!projectId || !cropId) {
            return res.status(400).json(ResponseModel.fail("El proyecto y el cultivo son obligatorios.", null, 400));
        }

        await provider.configureCrop({
            projectId,
            userId: req.user.id,
            cropId,
            variety: req.body.variedad,
            plantingDate: req.body.fechaSiembra,
            harvestDays: req.body.tiempoCosechaDias ? Number(req.body.tiempoCosechaDias) : null,
            minimumHumidity: req.body.humedadMinima === "" ? null : req.body.humedadMinima,
            maximumHumidity: req.body.humedadMaxima === "" ? null : req.body.humedadMaxima,
            minimumTemperature: req.body.temperaturaMinima === "" ? null : req.body.temperaturaMinima,
            maximumTemperature: req.body.temperaturaMaxima === "" ? null : req.body.temperaturaMaxima,
            observations: req.body.observaciones,
        });

        return res.status(200).json(ResponseModel.ok(null, "Cultivo configurado correctamente."));
    } catch (error) {
        return projectError(res, error);
    }
};

export const createProjectInfrastructure = async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        if (!projectId || !req.body?.finca?.trim()) {
            return res.status(400).json(ResponseModel.fail("La finca es obligatoria.", null, 400));
        }

        await provider.createInfrastructure({
            projectId,
            userId: req.user.id,
            farm: req.body.finca,
            sector: req.body.sector,
            nodeType: req.body.tipoNodo,
            macAddress: req.body.direccionMac,
        });
        return res.status(201).json(ResponseModel.ok(null, "Infraestructura creada correctamente.", 201));
    } catch (error) {
        return projectError(res, error);
    }
};

export const assignProjectUser = async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        const assignedUserId = Number(req.body?.usuarioId);
        const roleId = Number(req.body?.rolId);
        if (!projectId || !assignedUserId || !roleId) {
            return res.status(400).json(ResponseModel.fail("Usuario y rol son obligatorios.", null, 400));
        }

        await provider.assignUser({ projectId, assignedUserId, roleId, administratorId: req.user.id });
        return res.status(200).json(ResponseModel.ok(null, "Usuario asignado correctamente."));
    } catch (error) {
        return projectError(res, error);
    }
};

export const finishCropCycle = async (req,res) => {
    try {
        if (!req.body?.fechaFin || !req.body?.resultado) return res.status(400).json(ResponseModel.fail("La fecha y el resultado son obligatorios.",null,400));
        await provider.finishCropCycle({projectId:Number(req.params.id),userId:req.user.id,endDate:req.body.fechaFin,result:req.body.resultado,quantity:req.body.cantidad===""?null:Number(req.body.cantidad),unit:req.body.unidad,quality:req.body.calidad,observations:req.body.observaciones,sproutDate:req.body.fechaPrimerBrote,sproutPercentage:req.body.porcentajeBrote===""?null:Number(req.body.porcentajeBrote)});
        return res.json(ResponseModel.ok(null,"Plantación finalizada. El proyecto quedó listo para iniciar un nuevo ciclo."));
    } catch(error){return projectError(res,error);}
};

export const startCropCycle = async (req,res) => {
    try {
        const cropId=Number(req.body?.cultivoId);
        if(!cropId||!req.body?.fechaInicio)return res.status(400).json(ResponseModel.fail("El cultivo y la fecha de siembra son obligatorios.",null,400));
        await provider.startCropCycle({projectId:Number(req.params.id),userId:req.user.id,cropId,variety:req.body.variedad,startDate:req.body.fechaInicio,harvestDays:req.body.tiempoCosechaDias===""?null:Number(req.body.tiempoCosechaDias)});
        return res.status(201).json(ResponseModel.ok(null,"Nueva plantación iniciada correctamente.",201));
    } catch(error){return projectError(res,error);}
};
