import nodemailer from "nodemailer";

function createTransporter() {
    const port = Number(process.env.SMTP_PORT || 587);

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getSenderAddress() {
    const configuredSender = process.env.SMTP_FROM || process.env.SMTP_USER || "";
    const addressMatch = configuredSender.match(/<([^>]+)>/);

    return (addressMatch?.[1] || configuredSender).trim();
}

export function isEmailServiceConfigured() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
    );
}

export async function sendPasswordResetEmail({ recipient, name, resetUrl }) {
    if (!isEmailServiceConfigured()) {
        throw new Error("El servidor SMTP no está configurado.");
    }

    const safeName = escapeHtml(name);
    const safeResetUrl = escapeHtml(resetUrl);

    await createTransporter().sendMail({
        from: {
            name: "Sistema",
            address: getSenderAddress(),
        },
        to: recipient,
        subject: "Cambio de contraseña",
        text: `Hola ${name || ""}. Puedes restablecer tu contraseña usando este enlace personal: ${resetUrl}. El enlace vence en 30 minutos y solo puede utilizarse una vez. Si no solicitaste el cambio, ignora este correo.`,
        html: `
            <!doctype html>
            <html lang="es">
                <body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;color:#111111">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:36px 20px">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff">
                                    <tr>
                                        <td style="padding:0 0 54px;color:#16a34a;font-size:22px;font-weight:bold">
                                            Frutas del Oasis
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <h1 style="margin:0 0 34px;text-align:center;font-size:42px;line-height:1.2;color:#111111">Hola${safeName ? `, ${safeName}` : ""}.</h1>
                                            <p style="margin:0 0 22px;font-size:16px;line-height:1.6">No hay problema. Puedes restablecer la contraseña de tu cuenta presionando el siguiente botón:</p>
                                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0">
                                                <tr>
                                                    <td style="background:#16a34a;border-radius:24px">
                                                        <a href="${safeResetUrl}" style="display:inline-block;padding:13px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold">Restablecer contraseña</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin:0 0 8px;font-size:14px;line-height:1.6">Si no logras ver el botón, presiona el siguiente enlace:</p>
                                            <p style="margin:0 0 24px;word-break:break-all;font-size:14px;line-height:1.5"><a href="${safeResetUrl}" style="color:#15803d">${safeResetUrl}</a></p>
                                            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563">Este enlace es personal, vence en 30 minutos y solo puede utilizarse una vez. Si solicitaste varios correos, utiliza solamente el enlace del mensaje más reciente.</p>
                                            <p style="margin:0;font-size:15px;line-height:1.6">Si no solicitaste el cambio de contraseña, puedes ignorar este correo.</p>
                                            <p style="margin:24px 0 0;font-size:15px;line-height:1.6">Saludos,<br>El equipo de Frutas del Oasis</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>`,
    });
}
