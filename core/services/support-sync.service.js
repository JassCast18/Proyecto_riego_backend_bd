import * as provider from '../providers/support.provider.js'
import {addJiraAttachment,addJiraComment,createJiraRequest,getJiraComments,getJiraRequest,isJiraConfigured,mapJiraStatus} from './jira-support.service.js'

let timer=null,running=false

export async function syncSupportTicket(ticketId){
 const ticket=await provider.getTicketForJira(ticketId)
 if(!ticket)throw new Error('El ticket no existe.')
 try{
  let issueKey=ticket.jira_issue_key
  if(!issueKey){const created=await createJiraRequest(ticket);issueKey=created.issueKey;await provider.markTicketSynced(ticketId,created)}
  for(const comment of await provider.listPendingComments(ticketId)){
   const created=await addJiraComment(issueKey,`Comentario de ${comment.autor}:\n\n${comment.mensaje}`);await provider.markCommentSynced(comment.id,created.id)
  }
  for(const attachment of await provider.listPendingAttachments(ticketId)){
   try{const created=await addJiraAttachment(issueKey,attachment);await provider.markAttachmentSynced(attachment.id,created?.id)}catch(error){await provider.markAttachmentError(attachment.id,error.message);throw error}
  }
  const [request,comments]=await Promise.all([getJiraRequest(issueKey),getJiraComments(issueKey)])
  const jiraStatus=request.currentStatus?.status||'Sin estado'
  await provider.setJiraStatus(ticketId,jiraStatus,mapJiraStatus(jiraStatus))
  for(const comment of comments.values||[])await provider.importJiraComment(ticketId,comment)
  return {ticketId,issueKey,jiraStatus}
 }catch(error){await provider.markTicketSyncError(ticketId,error.message);throw error}
}

export async function runSupportSync(){
 if(running||!isJiraConfigured())return
 running=true
 try{const pending=await provider.listPendingSync();await Promise.allSettled(pending.map(item=>syncSupportTicket(item.id)))}finally{running=false}
}

export function startSupportSync(){
 if(timer||!isJiraConfigured())return timer
 const seconds=Math.max(30,Number(process.env.JIRA_SYNC_INTERVAL_SECONDS)||120)
 runSupportSync().catch(error=>console.error('Sincronización Jira:',error.message))
 timer=setInterval(()=>runSupportSync().catch(error=>console.error('Sincronización Jira:',error.message)),seconds*1000);timer.unref();return timer
}
