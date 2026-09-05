import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FolderKanban, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/useAuth.js";
import { listNotificationsRequest, reviewNotificationRequest } from "@/auth/notifications.service.js";
import { getActiveProject } from "@/auth/projects.service.js";

function formatNotificationTime(value) {
  if (!value) return "Ahora";
  return new Date(value).toLocaleString("es-GT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function Topbar({ onMenuClick }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const activeProject = getActiveProject();

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

  const loadNotifications = useCallback(async () => {
    try {
      const result = await listNotificationsRequest({ status: "active", page: 1, pageSize: 3 });
      setNotifications(Array.isArray(result.notificaciones) ? result.notificaciones : []);
    } catch {
      setNotifications([]);
      // El panel sigue disponible si la consulta de notificaciones falla temporalmente.
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const pollingId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(pollingId);
  }, [loadNotifications]);

  const openNotification = async (notification) => {
    if (!notification.revisada) {
      try {
        await reviewNotificationRequest(notification.id);
      } catch {
        // La vista completa permitirá reintentar la acción.
      }
    }
    setOpen(false);
    const testMatch = String(notification.tipo || "").match(/^PRUEBA_CONTROL_MANUAL_(SENSOR|ACTUADOR)_(\d+)$/);
    const testPath = testMatch?.[1] === "ACTUADOR" ? "valvulas" : "pruebas";
    navigate(testMatch ? `/dashboard/control-manual/${testPath}?prueba=${testMatch[2]}&calificar=1` : "/dashboard/notificaciones");
  };

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
        <button type="button" onClick={() => navigate('/proyectos')} title="Cambiar proyecto" className="hidden items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 md:flex">
          <FolderKanban size={17} className="text-green-700" />
          <span className="max-w-36 truncate">{activeProject?.nombre || 'Proyecto'}</span>
        </button>
        {/* Notificaciones */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => {
              setOpen(!open);
              if (!open) loadNotifications();
            }}
            aria-label="Notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
          >
            <Bell size={20} />

            {notifications.some((notification) => !notification.revisada) ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
            ) : null}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <p className="text-sm font-semibold">
                  Notificaciones
                </p>

                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  {notifications.length} activas
                </span>
              </div>

              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="border-b border-gray-200 last:border-0"
                  >
                    <button type="button" onClick={() => openNotification(notification)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50">
                      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.severidad === "ERROR" ? "bg-red-500" : notification.severidad === "WARNING" ? "bg-amber-500" : "bg-sky-500"}`}></span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.titulo}</p>
                        <p className="line-clamp-2 text-xs text-gray-500">{notification.mensaje}</p>
                        <p className="mt-1 text-xs text-gray-400">{formatNotificationTime(notification.fechaActualizacion || notification.fechaCreacion)}</p>
                      </div>
                    </button>
                  </li>
                ))}
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-gray-500">No hay incidencias activas.</li>
                ) : null}
              </ul>

              <div className="px-4 py-3 text-center">
                <button type="button" onClick={() => { setOpen(false); navigate("/dashboard/notificaciones"); }} className="text-xs font-medium text-green-600 hover:underline">
                  Ver historial de notificaciones
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

        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
