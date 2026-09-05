import ResponseModel from "../models/response.model.js";
import * as provider from "../providers/ai.provider.js";
import { checkAiHealth, trainRandomForest } from "../services/ai.service.js";
import { evaluateAiProject } from "../services/ai-orchestrator.service.js";

const numericRow = row => ({
  humedad:Number(row.humedad), temperatura:Number(row.temperatura), hora:Number(row.hora),
  dias_cultivo:Number(row.dias_cultivo), humedad_minima:Number(row.humedad_minima), humedad_maxima:Number(row.humedad_maxima),
});
const fail=(res,error,status=500)=>res.status(status).json(ResponseModel.fail(error.message,null,status));

function referenceRows(rows) {
  if (!rows.length) return [];
  const base=rows[0], result=[];
  for(let humidity=0;humidity<=100;humidity+=2) {
    result.push({...numericRow(base),humedad:humidity,decision:humidity<Number(base.humedad_minima)?"REGAR":"NO_REGAR"});
  }
  return result;
}

export async function state(req,res) {
  try {
    const [stored,health,actuators,configuration]=await Promise.all([provider.getAiState(req.projectId),checkAiHealth().catch(error=>({status:"offline",detail:error.message})),provider.listAiActuators(req.projectId),provider.getAiConfiguration(req.projectId)]);
    return res.json(ResponseModel.ok({...stored,actuadores:actuators,configuracion:configuration,servicio:health,modo:configuration.modo},"Estado de IA consultado."));
  } catch(error){return fail(res,error);}
}

export async function train(req,res) {
  try {
    const historic=(await provider.getTrainingDataset(req.projectId)).map(row=>({...numericRow(row),decision:row.decision}));
    if(!historic.length) return fail(res,new Error("Configura el cultivo y recibe al menos una lectura de humedad antes de entrenar."),422);
    const rows=[...historic,...referenceRows(historic)];
    const model=await trainRandomForest(req.projectId,rows);
    const saved=await provider.saveModel({projectId:req.projectId,userId:req.user.id,modelPath:model.model_path,version:model.version,algorithm:model.algorithm,samples:model.samples,accuracy:model.accuracy,precision:model.precision,recall:model.recall,featureImportance:model.feature_importance});
    return res.status(201).json(ResponseModel.ok({modeloId:Number(saved?.p_modelo_id),...model,muestrasHistoricas:historic.length,muestrasReferencia:rows.length-historic.length},"Modelo Random Forest entrenado y activado.",201));
  } catch(error){return fail(res,error,/al menos|historial|Configura/i.test(error.message)?422:503);}
}

export async function evaluate(req,res) {
  try {
    const result=await evaluateAiProject(req.projectId,req.user.id);
    return res.json(ResponseModel.ok({decisiones:result.decisions,modo:result.mode},result.mode==="AUTOMATICO"?`${result.decisions.length} nodo(s) evaluados con resolución automática.`:`${result.decisions.length} nodo(s) evaluados. Las recomendaciones de riego esperan confirmación.`));
  } catch(error){return fail(res,error,/Primero|No existen/i.test(error.message)?422:503);}
}

export async function configure(req,res){try{
 const strategy=String(req.body?.estrategia||'').toUpperCase(),mode=String(req.body?.modo||'').toUpperCase();const intervalMinutes=Number(req.body?.intervaloMinutos),durationSeconds=Number(req.body?.duracionSegundos),minimumAccuracy=Number(req.body?.exactitudMinima),minimumConfirmations=Number(req.body?.confirmacionesMinimas);
 if(!['UMBRAL','IA'].includes(strategy))return fail(res,new Error('Selecciona un motor de decisión válido.'),400);
 if(!['SUPERVISADO','AUTOMATICO'].includes(mode))return fail(res,new Error('Selecciona un modo válido.'),400);
 await provider.saveAiConfiguration({projectId:req.projectId,userId:req.user.id,strategy,mode,intervalMinutes,durationSeconds,minimumAccuracy,minimumConfirmations});
 return res.json(ResponseModel.ok(null,`Motor ${strategy==='IA'?'de inteligencia artificial':'por umbrales'} configurado correctamente.`));
}catch(error){return fail(res,error,/condiciones|configuración|Modo/i.test(error.message)?422:500)}}

export async function resolve(req,res) {
  try {
    const action=String(req.body?.accion||"").toUpperCase(), observation=String(req.body?.observacion||"").trim();
    const actuatorId=Number(req.body?.actuadorId)||null, durationSeconds=Number(req.body?.duracionSegundos)||null;
    if(!["ACEPTAR","RECHAZAR"].includes(action)) return fail(res,new Error("Selecciona aceptar o rechazar."),400);
    if(action==="RECHAZAR"&&observation.length<5) return fail(res,new Error("Explica por qué rechazas la recomendación."),400);
    await provider.resolveDecision({decisionId:Number(req.params.id),projectId:req.projectId,userId:req.user.id,action,actuatorId,durationSeconds,observation});
    return res.json(ResponseModel.ok(null,"Decisión registrada correctamente."));
  } catch(error){return fail(res,error,/no existe|resuelta|duración|actuador|sensor|riego activo|Explica|Acción|Solo/i.test(error.message)?400:500);}
}
