import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        {/* Contenido */}
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <MapPin size={16} />
            Las Cruces, Petén · Guatemala
          </span>

          <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
            Optimización del rendimiento agrícola con inteligencia artificial
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-gray-600">
            Un ecosistema de agricultura de precisión que combina sensores IoT,
            estaciones meteorológicas y modelos predictivos para monitorear y
            automatizar el desarrollo de tus cultivos en tiempo real.
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
              className="inline-flex items-center justify-center rounded-lg border border-green-600 px-6 py-3 font-medium text-green-600 transition duration-300 hover:bg-green-50"
            >
              Conocer la solución
            </a>
          </div>

          {/* Estadísticas */}
          <div className="mt-6 grid grid-cols-3 gap-6 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-3xl font-bold text-green-600">24/7</h3>
              <p className="mt-1 text-sm text-gray-600">
                Monitoreo continuo
              </p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-green-600">IA</h3>
              <p className="mt-1 text-sm text-gray-600">
                Decisiones predictivas
              </p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-green-600">IoT</h3>
              <p className="mt-1 text-sm text-gray-600">
                Sensores ESP32
              </p>
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
            <img
              src="/hero-cultivos.png"
              alt="Vista aérea de cultivos verdes monitoreados con sensores IoT"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;