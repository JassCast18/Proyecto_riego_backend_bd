export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 72

export const PASSWORD_RULES = [
  { id: 'length', label: `${PASSWORD_MIN_LENGTH} caracteres como mínimo y ${PASSWORD_MAX_LENGTH} bytes como máximo`, test: (value) => value.length >= PASSWORD_MIN_LENGTH && new TextEncoder().encode(value).length <= PASSWORD_MAX_LENGTH },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (value) => /\p{Lu}/u.test(value) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (value) => /\p{Ll}/u.test(value) },
  { id: 'number', label: 'Un número', test: (value) => /\d/u.test(value) },
  { id: 'symbol', label: 'Un símbolo', test: (value) => /[^\p{L}\p{N}\s]/u.test(value) },
  { id: 'spaces', label: 'Sin espacios', test: (value) => !/\s/u.test(value) },
  { id: 'common', label: 'Sin palabras o secuencias comunes', test: (value) => !/(password|contrasena|contraseña|qwerty|admin|123456|nodalvia)/i.test(value) },
]

export function getPasswordChecks(password = '') {
  return PASSWORD_RULES.map((rule) => ({ ...rule, valid: Boolean(password) && rule.test(password) }))
}

export function validatePassword(password = '') {
  const failed = getPasswordChecks(password).find((rule) => !rule.valid)
  return failed ? `La contraseña no cumple el requisito: ${failed.label.toLowerCase()}.` : ''
}

