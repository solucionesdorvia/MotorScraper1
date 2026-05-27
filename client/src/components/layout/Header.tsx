import { Link } from 'wouter';
import { FaBars, FaHeart, FaUserCircle, FaCamera, FaHandshake } from 'react-icons/fa';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                src="/logo-clasicar.png"
                alt="ClasicAR"
                className="h-10 w-auto"
              />
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                <FaHandshake className="text-primary" />
                Partner oficial de E-COMEX
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/busqueda">
              <button className="text-neutral-700 hover:text-primary px-3 py-2 text-sm font-medium">
                Buscar
              </button>
            </Link>
            <Link href="/reconocer">
              <button className="text-neutral-700 hover:text-primary px-3 py-2 text-sm font-medium flex items-center gap-1">
                <FaCamera className="text-sm" />
                Reconocer
              </button>
            </Link>
            <Link href="/como-trabajamos">
              <button className="text-neutral-700 hover:text-primary px-3 py-2 text-sm font-medium">
                Cómo trabajamos
              </button>
            </Link>
            <Link href="/guia-importacion">
              <button className="text-neutral-700 hover:text-primary px-3 py-2 text-sm font-medium">
                Guía
              </button>
            </Link>
            <Link href="/favoritos">
              <button className="text-neutral-700 hover:text-primary px-3 py-2 text-sm font-medium flex items-center gap-1">
                <FaHeart className="text-sm" />
                <span>Favoritos</span>
              </button>
            </Link>
            <Link href="/perfil">
              <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
                <FaUserCircle />
                <span>Mi Cuenta</span>
              </button>
            </Link>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden text-neutral-800 hover:text-primary">
                <FaBars className="text-xl" />
              </button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/">
                  <div className="flex items-center gap-2 mb-6">
                    <img
                      src="/logo-clasicar.png"
                      alt="ClasicAR"
                      className="h-10 w-auto"
                    />
                  </div>
                </Link>
                <Link href="/busqueda">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    Buscar Vehículos
                  </button>
                </Link>
                <Link href="/reconocer">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700 flex items-center gap-2">
                    <FaCamera className="text-primary" />
                    <span>Reconocer Vehículo</span>
                  </button>
                </Link>
                <Link href="/como-trabajamos">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    Cómo Trabajamos
                  </button>
                </Link>
                <Link href="/guia-importacion">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    Guía de Importación
                  </button>
                </Link>
                <Link href="/favoritos">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700 flex items-center gap-2">
                    <FaHeart className="text-primary" />
                    <span>Favoritos</span>
                  </button>
                </Link>
                <Link href="/perfil">
                  <button className="w-full mt-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <FaUserCircle />
                    <span>Mi Cuenta</span>
                  </button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
