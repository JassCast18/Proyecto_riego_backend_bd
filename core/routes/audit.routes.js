import {Router} from 'express'
import {search} from '../controllers/audit.controller.js'
import {verifyToken} from '../middlewares/jwt.middleware.js'
import {verifyProjectAccess} from '../middlewares/project.middleware.js'
import {requirePermission} from '../middlewares/permission.middleware.js'

const router=Router()
router.use(verifyToken,verifyProjectAccess)
router.get('/',requirePermission('auditoria.view','auditoria_busqueda.view','auditoria_historial.view'),search)
export default router
