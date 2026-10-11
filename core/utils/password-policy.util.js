export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

const COMMON_PASSWORD_PATTERN = /(password|contrasena|contraseña|qwerty|admin|123456|nodalvia)/i;

export function validatePasswordPolicy(password) {
    const errors = [];

    if (typeof password !== "string") {
        return { valid: false, errors: ["La contraseña es obligatoria."] };
    }

    if (password.length < PASSWORD_MIN_LENGTH) errors.push(`Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
    if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_LENGTH) errors.push(`No puede superar los ${PASSWORD_MAX_LENGTH} bytes.`);
    if (!/\p{Lu}/u.test(password)) errors.push("Debe incluir una letra mayúscula.");
    if (!/\p{Ll}/u.test(password)) errors.push("Debe incluir una letra minúscula.");
    if (!/\d/u.test(password)) errors.push("Debe incluir un número.");
    if (!/[^\p{L}\p{N}\s]/u.test(password)) errors.push("Debe incluir un símbolo.");
    if (/\s/u.test(password)) errors.push("No debe contener espacios.");
    if (COMMON_PASSWORD_PATTERN.test(password)) errors.push("No debe contener palabras o secuencias comunes.");

    return { valid: errors.length === 0, errors };
}

