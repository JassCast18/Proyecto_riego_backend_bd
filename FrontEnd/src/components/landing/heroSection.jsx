import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-7rem)] items-end overflow-hidden bg-slate-950 text-white">
      <img
        src="/hero-cultivos.png"
        alt="Cultivos monitoreados por Nodalvia"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-slate-950/70" aria-hidden="true" />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* Contenido */}
        <div className="flex max-w-3xl flex-col gap-5">
          <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/30 bg-black/25 px-3 py-2 text-sm font-medium text-green-100 backdrop-blur-sm sm:px-4">
            <MapPin size={16} />
            Las Cruces, Petén · Guatemala
          </span>

          <h1 className="text-4xl font-bold leading-tight text-white">
            Nodalvia
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-slate-100">
            Monitoreo adaptativo, sensores IoT e inteligencia artificial para tomar decisiones de riego con datos del cultivo en tiempo real.
          </p>

          {/* Botones */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition duration-300 hover:bg-green-700"
            >
              Ingresar a la plataforma
              <ArrowRight size={18} />
            </Link>

            <a
              href="#solucion"
              className="inline-flex items-center justify-center rounded-lg border border-white/60 bg-black/20 px-6 py-3 font-medium text-white transition duration-200 hover:bg-white/10"
            >
              Conocer la solución
            </a>
          </div>

          {/* Estadísticas */}
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-white/25 pt-5 min-[380px]:grid-cols-3 sm:gap-6">
            <div>
              <h3 className="text-2xl font-bold text-green-300">24/7</h3>
              <p className="mt-1 text-sm text-slate-200">
                Monitoreo continuo
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-green-300">IA</h3>
              <p className="mt-1 text-sm text-slate-200">
                Decisiones predictivas
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-green-300">IoT</h3>
              <p className="mt-1 text-sm text-slate-200">
                Sensores ESP32
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
