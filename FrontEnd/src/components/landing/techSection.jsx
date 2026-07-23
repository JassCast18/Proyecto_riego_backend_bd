import { Link } from "react-router-dom";
import {
  ArrowRight,
  Radio,
  ServerCog,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

const stack = [
  {
    icon: Radio,
    title: "Redes de sensores inalámbricos",
    description:
      "Microcontroladores ESP32 comunicándose con el protocolo de bajo consumo ESP-NOW.",
  },
  {
    icon: ServerCog,
    title: "Backend con Node.js",
    description:
      "Arquitectura cliente-servidor con almacenamiento y consultas en SQL.",
  },
  {
    icon: Waypoints,
    title: "Frontend en React",
    description:
      "Interfaz intuitiva construida con React y Tailwind CSS para el personal de campo.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad de la información",
    description:
      "Cifrado de datos, autenticación de usuarios y transmisión IoT segura.",
  },
];

export const TechSection = () => {
  return (
    <section id="tecnologia" className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Texto */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-green-600">
              Tecnología
            </span>

            <h2 className="mt-3 text-4xl font-bold text-gray-900">
              Una arquitectura robusta de campo a la nube
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              Integramos hardware IoT, un backend eficiente y modelos de
              aprendizaje automático para transformar los datos del campo en
              decisiones agronómicas precisas.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition duration-300 hover:bg-green-700"
            >
              Empezar ahora
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Tarjetas */}
          <div className="grid gap-6 sm:grid-cols-2">
            {stack.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <item.icon size={22} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const SiteFooter = () => {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold">Frutas del Oasis</h3>

          <p className="mt-1 text-sm text-gray-400">
            Optimización del rendimiento agrícola mediante inteligencia
            artificial.
          </p>
        </div>

        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Frutas del Oasis · Las Cruces, Petén
        </p>
      </div>
    </footer>
  );
};