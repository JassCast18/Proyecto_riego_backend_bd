import {Router} from 'express'
import {search} from '../controllers/audit.controller.js'
import {verifyToken} from '../middlewares/jwt.middleware.js'
import {verifyProjectAccess} from '../middlewares/project.middleware.js'

const router=Router()
router.use(verifyToken,verifyProjectAccess)
router.get('/',(req,res,next)=>Number(req.projectRoleId)===1||Number(req.projectRoleId)===2?next():res.status(403).json({success:false,message:'No tienes permiso para consultar la auditoría.'}),search)
export default router
