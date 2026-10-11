const attempts = new Map();

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
    return (req, res, next) => {
        const now = Date.now();
        const key = getClientKey(req, scope);
        const current = attempts.get(key);
        const entry = !current || current.resetAt <= now
            ? { count: 0, resetAt: now + windowMs }
            : current;

        entry.count += 1;
        attempts.set(key, entry);

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

        if (attempts.size > 10000) {
            for (const [attemptKey, value] of attempts.entries()) {
                if (value.resetAt <= now) attempts.delete(attemptKey);
            }
        }

        if (resetOnSuccess) {
            res.on("finish", () => {
                if (res.statusCode < 400) attempts.delete(key);
            });
        }

        next();
    };
}

