import api from './api'
const message=(error,fallback)=>error?.response?.data?.message||error?.message||fallback
export async function searchAuditRequest(filters={}){try{const params=new URLSearchParams();Object.entries(filters).forEach(([key,value])=>{if(value!==''&&value!==null&&value!==undefined)params.set(key,value)});return (await api.get(`/auditoria?${params}`)).data?.data||{}}catch(error){throw new Error(message(error,'No fue posible consultar la auditoría.'))}}
