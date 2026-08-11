import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

export const REPORT_UPLOAD_ROOT = path.resolve("uploads","reports");
fs.mkdirSync(REPORT_UPLOAD_ROOT,{recursive:true});

const allowed=new Set([
    "image/jpeg","image/png","image/webp","application/pdf","text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const storage=multer.diskStorage({
    destination:(_req,_file,callback)=>callback(null,REPORT_UPLOAD_ROOT),
    filename:(_req,file,callback)=>callback(null,`${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase().slice(0,10)}`),
});

export const uploadReportFiles=multer({
    storage,limits:{files:5,fileSize:10*1024*1024},
    fileFilter:(_req,file,callback)=>allowed.has(file.mimetype)?callback(null,true):callback(new Error(`El tipo de archivo ${file.mimetype} no está permitido.`)),
}).array("archivos",5);

export function handleReportUpload(req,res,next) {
    uploadReportFiles(req,res,(error)=>{
        if (!error) return next();
        const message=error.code==="LIMIT_FILE_SIZE"?"Cada archivo debe pesar como máximo 10 MB.":error.code==="LIMIT_FILE_COUNT"?"Puedes adjuntar como máximo 5 archivos.":error.message;
        return res.status(400).json({success:false,message});
    });
}
