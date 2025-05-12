import { useState } from 'react';
import { Link } from 'wouter';
import { FaCarSide, FaBars } from 'react-icons/fa';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <FaCarSide className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-neutral-800">ImportacionPrueba</h1>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/how-it-works">
              <button className="text-neutral-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                ¿Cómo Funciona?
              </button>
            </Link>
            <Link href="/about">
              <button className="text-neutral-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Nosotros
              </button>
            </Link>
            <Link href="/signin">
              <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Contactar
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
                    <FaCarSide className="text-primary text-2xl" />
                    <h1 className="text-xl font-bold text-neutral-800">ImportacionPrueba</h1>
                  </div>
                </Link>
                <Link href="/how-it-works">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    ¿Cómo Funciona?
                  </button>
                </Link>
                <Link href="/about">
                  <button className="w-full text-left py-2 px-4 hover:bg-neutral-100 rounded-md text-neutral-700">
                    Nosotros
                  </button>
                </Link>
                <Link href="/signin">
                  <button className="w-full mt-2 btn-primary">
                    Contactar
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
