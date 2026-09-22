import 'dotenv/config'
import {checkJiraConnection,getJiraRequestTypeFields} from '../services/jira-support.service.js'

const result=await checkJiraConnection()
console.log(JSON.stringify(result,null,2))
if(!result.connected)process.exitCode=1
else{
 const result=await getJiraRequestTypeFields()
 const fields=(result.requestTypeFields||[]).map(field=>({id:field.fieldId,name:field.name,required:field.required}))
 console.log(JSON.stringify({requestTypeAccessible:true,fields},null,2))
 const ids=new Set(fields.map(field=>field.id))
 if(!ids.has('summary')||!ids.has('description'))process.exitCode=1
}
