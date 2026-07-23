import { useEffect, useRef, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/useAuth.js";

const notifications = [
  {
    title: "Estrés hídrico detectado",
    detail: "Sector B-2 · humedad del suelo bajo el umbral",
    time: "Hace 8 min",
    urgent: true,
  },
  {
    title: "Nodo ESP32 sin señal",
    detail: "Nodo N-07 dejó de reportar telemetría",
    time: "Hace 42 min",
    urgent: true,
  },
  {
    title: "Reentrenamiento completado",
    detail: "El modelo predictivo se actualizó correctamente",
    time: "Hace 2 h",
    urgent: false,
  },
];

export function Topbar({ onMenuClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { user } = useAuth();

  const displayName = user?.nombreCompleto || user?.correoElectronico || "Rudy Castellanos";
  const displayRole = user?.rol || "Supervisor";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
      {/* Botón menú */}
      <button
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="text-gray-500 transition hover:text-gray-900 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Buscador */}
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Buscar en el panel..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notificaciones */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <p className="text-sm font-semibold">
                  Notificaciones
                </p>

                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  {notifications.length} nuevas
                </span>
              </div>

              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <li
                    key={n.title}
                    className="flex gap-3 border-b border-gray-200 px-4 py-3 last:border-0 hover:bg-gray-50"
                  >
                    <span
                      className={`mt-2 h-2 w-2 rounded-full ${
                        n.urgent
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    ></span>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {n.title}
                      </p>

                      <p className="text-xs text-gray-500">
                        {n.detail}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {n.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="px-4 py-3 text-center">
                <button className="text-xs font-medium text-green-600 hover:underline">
                  Ver todas las alertas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white">
            {initials || "U"}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {displayName}
            </p>

            <p className="text-xs text-gray-500">
              {displayRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}