import {listPermissionsByRole} from '../providers/permissions.provider.js'

const cache=new Map()
const CACHE_MS=60_000

async function permissionsFor(roleId){
 const key=Number(roleId),now=Date.now(),saved=cache.get(key)
 if(saved&&saved.expires>now)return saved.values
 const values=new Set(await listPermissionsByRole(key))
 cache.set(key,{values,expires:now+CACHE_MS})
 return values
}

export function requirePermission(...required){
 return async(req,res,next)=>{
  try{
   if(Number(req.projectRoleId)===1)return next()
   const granted=await permissionsFor(req.projectRoleId)
   if(required.some(code=>granted.has(code)))return next()
   return res.status(403).json({success:false,message:'No tienes permiso para realizar esta acción en el proyecto.'})
  }catch(error){next(error)}
 }
}
