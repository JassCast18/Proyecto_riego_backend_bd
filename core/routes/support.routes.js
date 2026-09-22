import {Router} from 'express'
import {verifyToken} from '../middlewares/jwt.middleware.js'
import {verifyProjectAccess} from '../middlewares/project.middleware.js'
import {comment,create,detail,downloadAttachment,faq,list} from '../controllers/support.controller.js'
import {handleSupportUpload} from '../middlewares/support-upload.middleware.js'

const router=Router()
router.use(verifyToken,verifyProjectAccess)
router.get('/faq',faq)
router.get('/tickets',list)
router.post('/tickets',create)
router.get('/tickets/:id',detail)
router.post('/tickets/:id/comentarios',handleSupportUpload,comment)
router.get('/adjuntos/:id',downloadAttachment)
export default router
