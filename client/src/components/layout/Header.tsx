import { useState } from 'react';
import { Link } from 'wouter';
import { FaCarSide, FaBars, FaHeart, FaUserCircle } from 'react-icons/fa';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <FaCarSide className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-neutral-800">ClasicAR</h1>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/busqueda">
              <button className="text-neutral-700 hover:text-secondary px-3 py-2 text-sm font-medium">
                Buscar Vehículos
              </button>
            </Link>
            <Link href="/guia-importacion">
              <button className="text-neutral-700 hover:text-secondary px-3 py-2 text-sm font-medium">
                Guía de Importación
              </button>
            </Link>
            <Link href="/favoritos">
              <button className="text-neutral-700 hover:text-secondary px-3 py-2 text-sm font-medium flex items-center gap-1">
                <FaHeart className="text-sm" />
                <span>Favoritos</span>
              </button>
            </Link>
            <Link href="/perfil">
              <button className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-1">
                <FaUserCircle />
                <span>Mi Cuenta</span>
              </button>
            </Link>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden text-neutral-800 hover:text-secondary">
                <FaBars className="text-xl" />
              </button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/">
                  <div className="flex items-center gap-2 mb-6">
                    <FaCarSide className="text-secondary text-2xl" />
                    <h1 className="text-xl font-bold text-neutral-800">ClasicAR</h1>
                  </div>
                </Link>
                <Link href="/busqueda">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    Buscar Vehículos
                  </button>
                </Link>
                <Link href="/guia-importacion">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    Guía de Importación
                  </button>
                </Link>
                <Link href="/favoritos">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700 flex items-center gap-2">
                    <FaHeart className="text-secondary" />
                    <span>Favoritos</span>
                  </button>
                </Link>
                <Link href="/perfil">
                  <button className="w-full mt-2 btn-secondary flex items-center justify-center gap-2">
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
