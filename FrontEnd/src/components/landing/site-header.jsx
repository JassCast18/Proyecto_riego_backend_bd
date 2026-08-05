import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
            <Leaf size={20} />
          </span>

          <span className="flex flex-col leading-none">
            <span className="text-base font-bold text-gray-900">
              Frutas del Oasis
            </span>
            <span className="text-xs text-gray-500">
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
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition duration-300 hover:bg-green-700"
          >
            Acceder a la plataforma
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;