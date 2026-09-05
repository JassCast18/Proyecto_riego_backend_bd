import * as provider from '../providers/ai.provider.js';
import {evaluateAiProject} from './ai-orchestrator.service.js';
let timer=null,running=false;
async function run(){if(running)return;running=true;try{const projects=await provider.listAutomaticAiProjects();await Promise.allSettled(projects.map(item=>evaluateAiProject(item.proyecto_id,null)))}finally{running=false}}
export function startAiMonitor(){if(timer)return timer;run().catch(error=>console.error('Monitor IA:',error.message));timer=setInterval(()=>run().catch(error=>console.error('Monitor IA:',error.message)),30000);timer.unref();return timer}
