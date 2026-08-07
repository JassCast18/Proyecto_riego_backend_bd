import {
  Activity,
  Bell,
  BrainCircuit,
  Cpu,
  FileBarChart,
  Sprout,
  SlidersHorizontal,
  Users,
} from "lucide-react";

const modules = [
  {
    icon: Activity,
    title: "Dashboard en tiempo real",
    description:
      "Supervisa humedad, temperatura y variables del campo con telemetría continua de la red de sensores.",
  },
  {
    icon: BrainCircuit,
    title: "Modelo predictivo con IA",
    description:
      "Anticipa las necesidades hídricas y nutricionales del cultivo frente a las fluctuaciones climáticas.",
  },
  {
    icon: Cpu,
    title: "Gestión de hardware IoT",
    description:
      "Estado de nodos ESP32, válvulas de riego y estación meteorológica desde un solo panel.",
  },
  {
    icon: Bell,
    title: "Alertas y notificaciones",
    description:
      "Recibe avisos de estrés hídrico y eventos críticos para actuar de forma ágil e informada.",
  },
  {
    icon: Sprout,
    title: "Parametrización de cultivo",
    description:
      "Parametriza las etapas fenológicas y deja que el sistema se calibre de forma autónoma.",
  },
  {
    icon: SlidersHorizontal,
    title: "Control manual",
    description:
      "Ejecuta y confirma acciones de riego directamente sobre el terreno cuando sea necesario.",
  },
  {
    icon: FileBarChart,
    title: "Historial y reportes",
    description:
      "Trazabilidad estricta de insumos aplicados correlacionada con las variables ambientales.",
  },
  {
    icon: Users,
    title: "Gestión de usuarios",
    description:
      "Perfiles de administrador, supervisor y operador de campo con roles y permisos definidos.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="modulos" className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-20">
        {/* Encabezado */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-green-600">
            Módulos principales
          </span>

          <h2 className="mt-3 text-4xl font-bold text-gray-900">
            Un centro de mando para toda la producción
          </h2>

          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Cada módulo trabaja en conjunto para gestionar el ciclo agrícola
            completo, desde la siembra hasta la cosecha.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <div
              key={module.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <module.icon size={24} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {module.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {module.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
