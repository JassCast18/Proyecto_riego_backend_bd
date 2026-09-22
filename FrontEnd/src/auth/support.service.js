import api from './api'

const message=(error,fallback)=>error?.response?.data?.message||error?.message||fallback

export async function getFaqRequest(search=''){try{return (await api.get('/soporte/faq',{params:{buscar:search}})).data?.data||{articulos:[]}}catch(error){throw new Error(message(error,'No fue posible consultar el centro de ayuda.'))}}
export async function getSupportTicketsRequest(params={}){try{return (await api.get('/soporte/tickets',{params})).data?.data||{}}catch(error){throw new Error(message(error,'No fue posible consultar los tickets.'))}}
export async function getSupportTicketRequest(id){try{return (await api.get(`/soporte/tickets/${id}`)).data?.data||{}}catch(error){throw new Error(message(error,'No fue posible consultar el ticket.'))}}
export async function createSupportTicketRequest(payload){try{return (await api.post('/soporte/tickets',payload)).data}catch(error){throw new Error(message(error,'No fue posible crear el ticket.'))}}
export async function addSupportCommentRequest(id,payload,files=[]){try{const form=new FormData();form.append('mensaje',payload.mensaje||'');files.forEach(file=>form.append('archivos',file));return (await api.post(`/soporte/tickets/${id}/comentarios`,form)).data}catch(error){throw new Error(message(error,'No fue posible enviar la información.'))}}
export async function openSupportAttachmentRequest(file){try{const response=await api.get(`/soporte/adjuntos/${file.id}`,{responseType:'blob'});const url=URL.createObjectURL(response.data);window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(error){throw new Error(message(error,'No fue posible abrir el archivo.'))}}
