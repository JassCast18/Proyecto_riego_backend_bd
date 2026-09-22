import api from './api'
const message=(e,f)=>e?.response?.data?.message||e?.message||f
export async function getAiStateRequest(){try{return (await api.get('/ia/estado')).data?.data||{}}catch(e){throw new Error(message(e,'No fue posible consultar el estado de la IA.'))}}
export async function trainAiRequest(payload={}){try{return (await api.post('/ia/entrenar',payload)).data}catch(e){throw new Error(message(e,'No fue posible entrenar el modelo.'))}}
export async function evaluateAiRequest(){try{return (await api.post('/ia/evaluar')).data}catch(e){throw new Error(message(e,'No fue posible evaluar los nodos.'))}}
export async function resolveAiDecisionRequest(id,payload){try{return (await api.patch(`/ia/decisiones/${id}/resolver`,payload)).data}catch(e){throw new Error(message(e,'No fue posible resolver la recomendación.'))}}
export async function saveAiConfigurationRequest(payload){try{return (await api.put('/ia/configuracion',payload)).data}catch(e){throw new Error(message(e,'No fue posible guardar la configuración de IA.'))}}
export async function getAiRetrainingRequest(){try{return (await api.get('/ia/reentrenamiento')).data?.data||{}}catch(e){throw new Error(message(e,'No fue posible consultar el reentrenamiento.'))}}
export async function restoreAiModelRequest(id,payload){try{return (await api.post(`/ia/versiones/${id}/restaurar`,payload)).data}catch(e){throw new Error(message(e,'No fue posible restaurar la versión.'))}}
