import { Link } from "wouter";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites-context";
import { useTheme } from "@/components/ui/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  const { favorites } = useFavorites();
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="w-full border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-2xl text-primary">
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
                <span className="ml-1 bg-primary text-primary-foreground text-xs py-0.5 px-1.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
          
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}