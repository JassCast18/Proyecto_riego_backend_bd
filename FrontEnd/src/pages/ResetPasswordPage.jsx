import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { resetPasswordRequest, validateResetTokenRequest } from '../auth/auth.service'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    validateResetTokenRequest(token).then(setValid).finally(() => setValidating(false))
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirmation) return setError('Las contraseñas no coinciden.')

    setLoading(true)
    try {
      setMessage(await resetPasswordRequest({ token, password }))
      setValid(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <Navigate to="/olvide-password" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Nueva contraseña</h1>
        {validating ? <p className="mt-4 text-sm text-slate-600">Validando enlace...</p> : valid ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} />
            <PasswordField label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} />
            {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
          </form>
        ) : (
          <div className="mt-4">
            <p className={`rounded-lg p-3 text-sm ${message ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{message || 'El enlace es inválido, ya fue utilizado o expiró.'}</p>
            <Link to={message ? '/login' : '/olvide-password'} className="mt-5 block text-center text-sm font-medium text-emerald-700 hover:underline">{message ? 'Iniciar sesión' : 'Solicitar otro enlace'}</Link>
          </div>
        )}
      </section>
    </main>
  )
}

function PasswordField({ label, value, onChange }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type="password" autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
    </label>
  )
}
