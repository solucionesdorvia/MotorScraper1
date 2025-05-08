import { Link } from "wouter";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites-context";

export default function Navbar() {
  const { favorites } = useFavorites();
  
  return (
    <header className="w-full border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-2xl text-blue-600">
          AutoFind
        </Link>
        
        <nav className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/favorites">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
              {favorites.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs py-0.5 px-1.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}