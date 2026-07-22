import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#d7f5e5,transparent_35%),radial-gradient(circle_at_80%_0%,#f0f9ef,transparent_30%),linear-gradient(180deg,#fcfefc,#eef7f1)] text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Plataforma de Riego Inteligente
        </p>
        <h1 className="max-w-4xl text-4xl font-black leading-tight text-emerald-950 md:text-6xl">
          Controla tus fincas con telemetria, alertas y decisiones en tiempo real
        </h1>
        <p className="mt-5 max-w-2xl text-base text-emerald-900/80 md:text-lg">
          Conecta sensores, visualiza datos criticos y gestiona usuarios con una interfaz simple para operaciones diarias.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/30 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            Iniciar sesion
          </Link>
          <a
            href="http://localhost:3000/"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-emerald-700/30 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            Ver estado API
          </a>
        </div>
      </section>
    </main>
  )
}
