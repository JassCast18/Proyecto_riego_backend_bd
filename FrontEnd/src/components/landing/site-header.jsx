import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
            <img src="/nodalvia-logo.png" alt="" className="size-9 object-contain" />
          </span>

          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-base font-bold text-gray-900">
              Nodalvia
            </span>
            <span className="hidden text-xs text-gray-500 sm:block">
              Monitoreo Adaptativo
            </span>
          </span>
        </Link>
    
        {/* Menú */}
        <nav className="hidden items-rigth gap-8 md:flex">
          <a
            href="#solucion"
            className="text-sm font-medium text-gray-600 transition hover:text-green-600"
          >
            Solución
          </a>

          <a
            href="#modulos"
            className="text-sm font-medium text-gray-600 transition hover:text-green-600"
          >
            Módulos
          </a>

          <a
            href="#tecnologia"
            className="text-sm font-medium text-gray-600 transition hover:text-green-600"
          >
            Tecnología
          </a>
        </nav>

        {/* Botones */}
        <div className="flex items-center gap-3">


          <Link
            to="/login"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-green-700 px-3 text-sm font-semibold text-white transition duration-200 hover:bg-green-800 sm:px-5"
          >
            <LogIn size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Acceder a la plataforma</span>
            <span className="sm:hidden">Acceder</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
