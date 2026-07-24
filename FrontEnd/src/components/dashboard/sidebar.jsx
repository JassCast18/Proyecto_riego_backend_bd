import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Leaf, LogOut, X } from "lucide-react";
import { navGroups } from "./nav-items";
import { useAuth } from "@/context/useAuth.js";

export function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState({});

  const displayName = user?.nombreCompleto || user?.correoElectronico || "Usuario";

  useEffect(() => {
    const shouldOpenUsers = location.pathname.startsWith("/dashboard/usuarios");

    if (shouldOpenUsers) {
      setExpanded((current) => ({
        ...current,
        "Gestión de usuarios": true,
      }));
    }
  }, [location.pathname]);

  const toggleGroup = (label) => {
    setExpanded((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  const isItemActive = (item) => {
    if (!item.children) {
      return location.pathname === item.href;
    }

    return (
      location.pathname === item.href ||
      item.children.some((child) => location.pathname.startsWith(child.href))
    );
  };

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gray-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
              <Leaf size={20} />
            </span>

            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold">
                Frutas del Oasis
              </span>

              <span className="text-xs text-gray-400">
                Panel de control
              </span>
            </span>
          </Link>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                {group.title}
              </p>

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const isExpanded = Boolean(expanded[item.label]) || Boolean(item.children?.some((child) => location.pathname.startsWith(child.href)));

                  return (
                    <li key={item.label}>
                      {item.children ? (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleGroup(item.label)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                              active
                                ? "bg-green-600 font-medium text-white"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <item.icon size={18} />

                            <span className="flex-1 truncate">
                              {item.label}
                            </span>

                            <ChevronDown
                              size={16}
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>

                          {isExpanded && (
                            <ul className="mt-1 space-y-1 pl-10">
                              {item.children.map((child) => {
                                const childActive = location.pathname.startsWith(child.href);

                                return (
                                  <li key={child.label}>
                                    <Link
                                      to={child.href}
                                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                                        childActive
                                          ? "bg-gray-800 text-white"
                                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                      }`}
                                    >
                                      {child.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                            active
                              ? "bg-green-600 font-medium text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          <item.icon size={18} />

                          <span className="flex-1 truncate">
                            {item.label}
                          </span>

                          {item.badge && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            <LogOut size={18} />
            <span className="flex flex-col leading-tight">
              <span>Cerrar sesión</span>
              <span className="text-xs text-gray-500">{displayName}</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}