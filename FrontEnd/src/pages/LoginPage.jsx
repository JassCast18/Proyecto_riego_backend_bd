import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [form, setForm] = useState({
    correo_electronico: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.correo_electronico || !form.password) {
      setError('Completa correo y contrasena.')
      return
    }

    setLoading(true)

    try {
      await login({
        ...form,
        correo_electronico: form.correo_electronico.trim().toLowerCase(),
      })
      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">Ingresa tus credenciales.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-emerald-950">usuario o correo electronico</span>
            <input
              name="correo_electronico"
              type="text"
              autoComplete="text"
              value={form.correo_electronico}
              onChange={updateField}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Escriba su usuario o correo electronico"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-emerald-950">Contrasena</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="********"
            />
          </label>

          <div className="text-right">
            <Link to="/olvide-password" className="text-sm font-medium text-emerald-700 hover:underline">Olvidé mi contraseña</Link>
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-emerald-900/70">
          <Link to="/" className="font-semibold text-emerald-800 underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
