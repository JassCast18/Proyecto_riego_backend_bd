import ResponseModel from "../models/response.model.js";
import * as provider from "../providers/manual-control.provider.js";

const fail=(res,error)=>res.status(/no existe|no pertenece|debe estar|duración|intervalo|ya tiene|solo el/i.test(error.message)?400:500).json(ResponseModel.fail(error.message));

export async function catalog(req,res){try{return res.json(ResponseModel.ok({nodos:await provider.listCatalog(req.projectId)}));}catch(e){return fail(res,e);}}
export async function listTests(req,res){try{return res.json(ResponseModel.ok({pruebas:await provider.listTests(req.projectId,req.query.tipo||null,req.query.limite)}));}catch(e){return fail(res,e);}}
export async function getTest(req,res){try{const test=await provider.getTest(Number(req.params.id),req.projectId);if(!test)return res.status(404).json(ResponseModel.fail("La prueba no existe.",null,404));return res.json(ResponseModel.ok({prueba:test}));}catch(e){return fail(res,e);}}
export async function startTest(req,res){try{
  const type=String(req.body?.tipo||"").toUpperCase();const nodeId=Number(req.body?.nodoId);const componentId=Number(req.body?.componenteId);
  const intervalSeconds=Number(req.body?.intervaloSegundos||10);const durationSeconds=Number(req.body?.duracionSegundos||120);
  if(!nodeId||!componentId||!["SENSOR","ACTUADOR"].includes(type))return res.status(400).json(ResponseModel.fail("Nodo, componente y tipo son obligatorios.",null,400));
  const result=await provider.startTest({projectId:req.projectId,userId:req.user.id,nodeId,type,componentId,objective:String(req.body?.objetivo||""),intervalSeconds,durationSeconds});
  return res.status(201).json(ResponseModel.ok({pruebaId:Number(result?.p_prueba_id)},"Prueba creada; esperando confirmación del nodo.",201));
}catch(e){return fail(res,e);}}
export async function finishTest(req,res){try{await provider.finishTest({testId:Number(req.params.id),projectId:req.projectId,userId:req.user.id,cancel:Boolean(req.body?.cancelar),result:req.body?.resultado||null,conclusion:req.body?.conclusion||null});return res.json(ResponseModel.ok(null,req.body?.cancelar?"Prueba detenida.":"Prueba finalizada."));}catch(e){return fail(res,e);}}
export async function takeCommands(req,res){try{return res.json(ResponseModel.ok({comandos:await provider.takeCommands(Number(req.params.nodeId))}));}catch(e){return fail(res,e);}}
export async function confirmCommand(req,res){try{await provider.confirmCommand(Number(req.params.id),req.body?.exitoso!==false,String(req.body?.mensaje||""));return res.json(ResponseModel.ok());}catch(e){return fail(res,e);}}
export async function createActuator(req,res){try{const nodeId=Number(req.body?.nodoId);const name=String(req.body?.nombre||"").trim();if(!nodeId||!name)return res.status(400).json(ResponseModel.fail("Nodo y nombre son obligatorios.",null,400));const result=await provider.createActuator({projectId:req.projectId,nodeId,name,pin:Number(req.body?.pin??5),maxDuration:Number(req.body?.duracionMaxima??60)});return res.status(201).json(ResponseModel.ok({actuadorId:Number(result?.p_actuador_id)},"Válvula registrada.",201));}catch(e){return fail(res,e);}}
