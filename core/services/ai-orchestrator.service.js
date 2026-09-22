import * as provider from '../providers/ai.provider.js';
import {predictWithModel} from './ai.service.js';

const numericRow=row=>({humedad:Number(row.humedad),temperatura:Number(row.temperatura),hora:Number(row.hora),dias_cultivo:Number(row.dias_cultivo),humedad_minima:Number(row.humedad_minima),humedad_maxima:Number(row.humedad_maxima),salud_foliar:Number(row.salud_foliar??85)});

export async function evaluateAiProject(projectId,userId=null){
 const [stored,configuration,contexts,actuators]=await Promise.all([provider.getAiState(projectId),provider.getAiConfiguration(projectId),provider.getCurrentContexts(projectId),provider.listAiActuators(projectId)]);
 const model=stored.modelo;if(!model?.id||!model?.ruta_pesos_algoritmo)throw new Error('Primero debes entrenar un modelo.');
 if(!contexts.length)throw new Error('No existen lecturas operativas con parametrización para evaluar.');
 const inputs=contexts.map(numericRow),result=await predictWithModel(model.ruta_pesos_algoritmo,inputs),decisions=[];
 for(let index=0;index<contexts.length;index++){
  const context=contexts[index],prediction=result.predictions[index],variables=inputs[index];
  const explanation=prediction.decision==='REGAR'?`La humedad estimada (${variables.humedad.toFixed(1)} %) y la salud foliar reciente (${variables.salud_foliar.toFixed(1)}/100) indican necesidad de riego.`:`La humedad estimada (${variables.humedad.toFixed(1)} %) y la salud foliar reciente (${variables.salud_foliar.toFixed(1)}/100) no requieren riego.`;
  const saved=await provider.saveDecision({projectId,nodeId:context.nodo_id,modelId:model.id,decision:prediction.decision,confidence:prediction.confidence,variables,explanation});
  let resolution='PENDIENTE';
  if(configuration.modo==='AUTOMATICO'){
   const actuator=prediction.decision==='REGAR'?actuators.find(item=>Number(item.nodo_id)===Number(context.nodo_id)):null;
   if(prediction.decision==='NO_REGAR'||actuator){try{await provider.resolveDecision({decisionId:saved.p_decision_id,projectId,userId,action:'ACEPTAR',actuatorId:actuator?.actuador_id||null,durationSeconds:actuator?Math.min(Number(configuration.duracionSegundos),Number(actuator.duracion_maxima)):null,observation:'Confirmada automáticamente según la configuración de IA.'});resolution='ACEPTADA'}catch(error){resolution='PENDIENTE';console.error(`IA automática proyecto ${projectId}, nodo ${context.nodo_id}:`,error.message)}}
  }
  decisions.push({id:Number(saved?.p_decision_id),nodoId:context.nodo_id,nodo:context.nodo,...prediction,estado:resolution,explanation});
 }
 return {decisions,mode:configuration.modo};
}
