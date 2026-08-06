import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPasswordRequest } from '../auth/auth.service'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setLoading(true)
    try {
      setMessage(await forgotPasswordRequest(email.trim().toLowerCase()))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-600">Escribe el correo asociado a tu cuenta.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </label>
          {message ? (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              {message} Si solicitaste más de un correo, utiliza solamente el enlace del mensaje más reciente.
            </p>
          ) : null}
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={loading || Boolean(message)} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Enviando...' : message ? 'Enlace enviado' : 'Enviar enlace'}
          </button>
        </form>
        <Link to="/login" className="mt-5 block text-center text-sm font-medium text-emerald-700 hover:underline">Volver al inicio de sesión</Link>
      </section>
    </main>
  )
}
