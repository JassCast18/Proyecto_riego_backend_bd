import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()

  const token = localStorage.getItem('authToken')
  const userRaw = localStorage.getItem('authUser')

  const user = useMemo(() => {
    try {
      return userRaw ? JSON.parse(userRaw) : null
    } catch {
      return null
    }
  }, [userRaw])

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [navigate, token])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    navigate('/login')
  }

  if (!token) return null

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,#edf8f2,#f7fcf9_40%,#ebf5ef)] px-4 py-8">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Sesion activa</p>
            <h1 className="mt-2 text-3xl font-black text-emerald-950">Dashboard</h1>
            <p className="mt-2 text-sm text-emerald-900/70">
              Bienvenido {user?.nombreCompleto || user?.correoElectronico || 'usuario'}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            Cerrar sesion
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-sm font-bold text-emerald-900">Estado API</h2>
            <p className="mt-2 text-sm text-emerald-900/75">Conectado al backend core y autenticado con JWT.</p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-sm font-bold text-emerald-900">Rol</h2>
            <p className="mt-2 text-sm text-emerald-900/75">{user?.rol || 'No especificado'}</p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h2 className="text-sm font-bold text-emerald-900">Correo</h2>
            <p className="mt-2 text-sm text-emerald-900/75">{user?.correoElectronico || 'No disponible'}</p>
          </article>
        </div>

        <div className="mt-8 text-sm text-emerald-900/70">
          <Link to="/login" className="font-semibold text-emerald-800 underline-offset-4 hover:underline">
            Ir al formulario de login
          </Link>
        </div>
      </section>
    </main>
  )
}
