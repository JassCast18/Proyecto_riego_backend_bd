import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Droplets,
  Sprout,
  Thermometer,
} from "lucide-react";

const stats = [
  {
    label: "Humedad del suelo",
    value: "62%",
    trend: "+4%",
    up: true,
    icon: Droplets,
  },
  {
    label: "Temperatura promedio",
    value: "28.4°C",
    trend: "-1.2°C",
    up: false,
    icon: Thermometer,
  },
  {
    label: "Nodos activos",
    value: "11 / 12",
    trend: "1 sin señal",
    up: false,
    icon: Cpu,
  },
  {
    label: "Cultivos monitoreados",
    value: "6",
    trend: "En óptimo",
    up: true,
    icon: Sprout,
  },
];

const alerts = [
  {
    title: "Estrés hídrico · Sector B-2",
    level: "Crítico",
    urgent: true,
  },
  {
    title: "Nodo N-07 sin señal",
    level: "Alto",
    urgent: true,
  },
  {
    title: "Válvula V-03 requiere revisión",
    level: "Medio",
    urgent: false,
  },
];

const activity = [
  {
    text: "Riego automático ejecutado en Sector A-1",
    time: "Hace 15 min",
  },
  {
    text: "Modelo predictivo reentrenado",
    time: "Hace 2 h",
  },
  {
    text: "Parámetros fenológicos actualizados",
    time: "Hace 5 h",
  },
  {
    text: "Operador confirmó control manual en B-4",
    time: "Ayer",
  },
];

export function SummaryContent() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Resumen general
        </h1>

        <p className="text-sm text-gray-500">
          Estado en tiempo real del monitoreo de cultivos de Frutas del Oasis.
        </p>
      </div>

      {/* Tarjetas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                {stat.label}
              </h3>

              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <stat.icon size={18} />
              </span>
            </div>

            <p className="text-2xl font-bold text-gray-900">
              {stat.value}
            </p>

            <p
              className={`mt-2 flex items-center gap-1 text-xs ${
                stat.up
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {stat.up ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}

              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alertas */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="font-semibold">
              Alertas activas
            </h2>

            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
              {alerts.filter((a) => a.urgent).length} urgentes
            </span>
          </div>

          <div className="space-y-3 p-5">
            {alerts.map((alert) => (
              <div
                key={alert.title}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
              >
                <AlertTriangle
                  size={18}
                  className={
                    alert.urgent
                      ? "text-red-500"
                      : "text-gray-500"
                  }
                />

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {alert.title}
                  </p>

                  <p className="text-xs text-gray-500">
                    Nivel: {alert.level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Telemetría de las últimas 24 h
            </h2>
          </div>

          <div className="p-5">
            <div className="flex h-56 items-end gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
              {[40, 55, 48, 62, 70, 58, 65, 72, 60, 68, 75, 63].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-green-500"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Datos de muestra. La visualización se conectará a la
              telemetría real más adelante.
            </p>
          </div>
        </div>
      </div>

      {/* Actividad */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Actividad reciente
          </h2>
        </div>

        <div className="space-y-4 p-5">
          {activity.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3"
            >
              <CheckCircle2
                size={18}
                className="text-green-600"
              />

              <p className="flex-1 text-sm text-gray-900">
                {item.text}
              </p>

              <span className="text-xs text-gray-500">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}