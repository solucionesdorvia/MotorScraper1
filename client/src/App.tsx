import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FavoritesProvider } from "@/lib/favorites-context";
import { AuthProvider } from "@/hooks/useAuth";
// Nota: el Navbar global se eliminó porque las páginas ya rendereaban su propio
// <Header /> + <Footer /> y se mostraban duplicadas. Header maneja la nav.
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import Favorites from "@/pages/Favorites";
import GuiaImportacion from "@/pages/GuiaImportacion";
import Perfil from "@/pages/Perfil";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Mantenemos compatibilidad con la ruta original */}
      <Route path="/search" component={SearchResults} />
      {/* Nueva ruta en español */}
      <Route path="/busqueda" component={SearchResults} />
      {/* Mantenemos compatibilidad con la ruta original */}
      <Route path="/favorites" component={Favorites} />
      {/* Nueva ruta en español */}
      <Route path="/favoritos" component={Favorites} />
      {/* Rutas para las secciones principales */}
      <Route path="/guia-importacion" component={GuiaImportacion} />
      <Route path="/requisitos" component={GuiaImportacion} />
      <Route path="/aranceles" component={GuiaImportacion} />
      <Route path="/restricciones" component={GuiaImportacion} />
      <Route path="/terminos" component={NotFound} />
      <Route path="/perfil" component={Perfil} />
      {/* Rutas de autenticación */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen flex flex-col">
              <main className="flex-1">
                <Router />
              </main>
            </div>
          </TooltipProvider>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
