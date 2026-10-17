const API_TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i

export function parseApiDate(value) {
  if (!value) return null

  const normalized = typeof value === 'string' && !API_TIMEZONE_SUFFIX.test(value)
    ? `${value}Z`
    : value
  const parsed = new Date(normalized)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatGuatemalaDateTime(value, options = {}) {
  const parsed = parseApiDate(value)
  if (!parsed) return 'Sin fecha'

  return parsed.toLocaleString('es-GT', {
    timeZone: 'America/Guatemala',
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  })
}
