import fs from 'node:fs/promises'
import path from 'node:path'

const enabled=()=>String(process.env.JIRA_ENABLED||'').toLowerCase()==='true'
const baseUrl=()=>String(process.env.JIRA_BASE_URL||'').replace(/\/$/,'')

export function isJiraConfigured(){
 return enabled()&&Boolean(baseUrl()&&process.env.JIRA_EMAIL&&process.env.JIRA_API_TOKEN&&process.env.JIRA_SERVICE_DESK_ID&&process.env.JIRA_REQUEST_TYPE_ID)
}

function headers(){
 const token=Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')
 return {Authorization:`Basic ${token}`,Accept:'application/json','Content-Type':'application/json'}
}

async function jiraRequest(path,{method='GET',body,retries=2}={}){
 if(!isJiraConfigured())throw new Error('La integración con Jira no está configurada.')
 let attempt=0
 while(true){
  const response=await fetch(`${baseUrl()}${path}`,{method,headers:headers(),body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)})
  if(response.ok)return response.status===204?null:response.json()
  const detail=await response.text()
  if(response.status===429&&attempt<retries){
   const seconds=Math.max(1,Number(response.headers.get('retry-after'))||2**attempt)
   await new Promise(resolve=>setTimeout(resolve,seconds*1000));attempt+=1;continue
  }
  throw new Error(`Jira respondió ${response.status}: ${detail.slice(0,500)}`)
 }
}

export async function checkJiraConnection(){
 if(!isJiraConfigured())return {configured:false,connected:false,message:'Jira está deshabilitado o incompleto.'}
 try{
  const desk=await jiraRequest(`/rest/servicedeskapi/servicedesk/${process.env.JIRA_SERVICE_DESK_ID}`)
  return {configured:true,connected:true,serviceDesk:desk.projectName,projectKey:desk.projectKey}
 }catch(error){return {configured:true,connected:false,message:error.message}}
}

export async function createJiraRequest(ticket){
 return jiraRequest('/rest/servicedeskapi/request',{method:'POST',body:{
  serviceDeskId:String(process.env.JIRA_SERVICE_DESK_ID),requestTypeId:String(process.env.JIRA_REQUEST_TYPE_ID),
  requestFieldValues:{summary:`[${ticket.codigo}] ${ticket.asunto}`,description:`${ticket.descripcion}\n\nCategoría: ${ticket.categoria}\nPrioridad local: ${ticket.prioridad}\nProyecto local: ${ticket.proyecto}\nSolicitante: ${ticket.solicitante} (${ticket.correo})`},
 }})
}

export async function validateJiraRequest(){
 return jiraRequest('/rest/servicedeskapi/request/validate',{method:'POST',body:{
  serviceDeskId:String(process.env.JIRA_SERVICE_DESK_ID),requestTypeId:String(process.env.JIRA_REQUEST_TYPE_ID),
  requestFieldValues:{summary:'Validación de integración del sistema de riego',description:'Solicitud de validación. Este proceso no crea un ticket.'},
 }})
}

export async function getJiraRequestTypeFields(){
 return jiraRequest(`/rest/servicedeskapi/servicedesk/${process.env.JIRA_SERVICE_DESK_ID}/requesttype/${process.env.JIRA_REQUEST_TYPE_ID}/field`)
}

export async function addJiraComment(issueKey,message){
 return jiraRequest(`/rest/servicedeskapi/request/${encodeURIComponent(issueKey)}/comment`,{method:'POST',body:{body:message,public:true}})
}

export async function addJiraAttachment(issueKey,attachment){
 if(!isJiraConfigured())throw new Error('La integración con Jira no está configurada.')
 const bytes=await fs.readFile(path.resolve(attachment.ruta_archivo)),form=new FormData()
 form.append('file',new Blob([bytes],{type:attachment.tipo_mime}),attachment.nombre_original)
 const token=Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')
 const response=await fetch(`${baseUrl()}/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`,{method:'POST',headers:{Authorization:`Basic ${token}`,Accept:'application/json','X-Atlassian-Token':'no-check'},body:form,signal:AbortSignal.timeout(30000)})
 if(!response.ok)throw new Error(`Jira rechazó el archivo (${response.status}): ${(await response.text()).slice(0,500)}`)
 return (await response.json())[0]
}

export async function getJiraRequest(issueKey){
 return jiraRequest(`/rest/servicedeskapi/request/${encodeURIComponent(issueKey)}?expand=status`)
}

export async function getJiraComments(issueKey){
 return jiraRequest(`/rest/servicedeskapi/request/${encodeURIComponent(issueKey)}/comment?limit=100`)
}

export function mapJiraStatus(value){
 const status=String(value||'').toLowerCase()
 if(/closed|cerrad/.test(status))return 'CERRADO'
 if(/resolved|resuelt|done|complet/.test(status))return 'RESUELTO'
 if(/waiting.*customer|esperando.*usuario|customer pending/.test(status))return 'ESPERANDO_USUARIO'
 if(/progress|progreso|working/.test(status))return 'EN_PROGRESO'
 if(/review|revisi/.test(status))return 'EN_REVISION'
 return 'NUEVO'
}
