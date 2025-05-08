import { useFavorites } from "@/lib/favorites-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, ExternalLink, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default function Favorites() {
  const { favorites, removeFavorite } = useFavorites();
  const [, navigate] = useLocation();

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Mis Favoritos</h1>
        </div>
        
        <div className="text-center py-16">
          <Heart className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No tienes vehículos favoritos</h2>
          <p className="text-muted-foreground mb-6">
            Marca los vehículos que te interesen con el corazón para guardarlos aquí.
          </p>
          <Button onClick={() => navigate("/")}>
            Buscar vehículos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Mis Favoritos</h1>
        <Badge className="ml-2">{favorites.length}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map(vehicle => (
          <Card key={vehicle.id} className="overflow-hidden">
            <div className="relative h-48 bg-muted">
              {vehicle.imageUrl ? (
                <img 
                  src={vehicle.imageUrl} 
                  alt={vehicle.title} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <Tag className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <Button 
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full"
                onClick={() => removeFavorite(vehicle.id)}
              >
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>
            
            <CardHeader>
              <CardTitle className="line-clamp-2">{vehicle.title}</CardTitle>
              <CardDescription>
                {vehicle.year} · {vehicle.make} · {vehicle.model}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="font-semibold text-lg">
                  {vehicle.isAuction 
                    ? `Puja: ${formatPrice(vehicle.currentBid || 0)}` 
                    : formatPrice(vehicle.price || 0)}
                </div>
                <Badge variant={vehicle.isAuction ? "destructive" : "outline"}>
                  {vehicle.isAuction ? `Tiempo: ${vehicle.endsIn}` : "Venta directa"}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Fuente: {vehicle.source}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <a href={vehicle.sourceUrl || "#"} target="_blank" rel="noopener noreferrer">
                  Ver más
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}