import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function LoginPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    correo_electronico: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'No fue posible iniciar sesion.')
      }

      const token = payload?.data?.token || payload?.token
      const usuario = payload?.data?.usuario || payload?.usuario

      if (!token) {
        throw new Error('La API no devolvio token de acceso.')
      }

      localStorage.setItem('authToken', token)
      localStorage.setItem('authUser', JSON.stringify(usuario || null))

      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#daf7e8,transparent_35%),linear-gradient(180deg,#fcfffd,#edf6f1)] px-4">
      <section className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white/95 p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Acceso seguro</p>
        <h1 className="mt-2 text-3xl font-black text-emerald-950">Iniciar sesion</h1>
        <p className="mt-2 text-sm text-emerald-900/70">Ingresa tus credenciales para entrar a la plataforma.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-emerald-950">Correo electronico</span>
            <input
              name="correo_electronico"
              type="email"
              autoComplete="email"
              value={form.correo_electronico}
              onChange={updateField}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="usuario@correo.com"
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
