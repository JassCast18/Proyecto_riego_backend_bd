import {db} from '../database/connection.database.js'

const fallbackAttempts = new Map();

function getClientKey(req, scope) {
    return `${scope}:${req.ip || req.socket?.remoteAddress || "unknown"}`;
}

export function securityHeaders(_req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    res.setHeader("Cache-Control", "no-store");
    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
}

export function createRateLimit({ scope, limit, windowMs, resetOnSuccess = false }) {
    return async (req, res, next) => {
        const now = Date.now();
        const key = getClientKey(req, scope);
        let entry;
        try{
            const result=await db.query(`INSERT INTO tb_limite_solicitud(clave,cantidad,reinicia_en)
              VALUES($1,1,NOW()+($2::text||' milliseconds')::interval)
              ON CONFLICT(clave) DO UPDATE SET
                cantidad=CASE WHEN tb_limite_solicitud.reinicia_en<=NOW() THEN 1 ELSE tb_limite_solicitud.cantidad+1 END,
                reinicia_en=CASE WHEN tb_limite_solicitud.reinicia_en<=NOW() THEN NOW()+($2::text||' milliseconds')::interval ELSE tb_limite_solicitud.reinicia_en END,
                actualizado_en=NOW()
              RETURNING cantidad,EXTRACT(EPOCH FROM reinicia_en)*1000 AS reset_at`,[key,windowMs]);
            entry={count:Number(result.rows[0].cantidad),resetAt:Number(result.rows[0].reset_at)};
            if(Math.random()<.01)db.query('DELETE FROM tb_limite_solicitud WHERE reinicia_en<NOW()-INTERVAL \'1 day\'').catch(()=>{});
        }catch{
            const current=fallbackAttempts.get(key);
            entry=!current||current.resetAt<=now?{count:1,resetAt:now+windowMs}:{count:current.count+1,resetAt:current.resetAt};
            fallbackAttempts.set(key,entry);
        }

        res.setHeader("RateLimit-Limit", String(limit));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
        res.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

        if (entry.count > limit) {
            res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(429).json({
                success: false,
                message: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
            });
        }

        if (fallbackAttempts.size > 10000) {
            for (const [attemptKey, value] of fallbackAttempts.entries()) {
                if (value.resetAt <= now) fallbackAttempts.delete(attemptKey);
            }
        }

        if (resetOnSuccess) {
            res.on("finish", () => {
                if (res.statusCode < 400){fallbackAttempts.delete(key);db.query('DELETE FROM tb_limite_solicitud WHERE clave=$1',[key]).catch(()=>{});}
            });
        }

        next();
    };
}

