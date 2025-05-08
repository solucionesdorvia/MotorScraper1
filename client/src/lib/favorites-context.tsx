import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Vehicle } from "../../../shared/schema";

interface FavoritesContextType {
  favorites: Vehicle[];
  addFavorite: (vehicle: Vehicle) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = "car-search-favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Vehicle[]>([]);

  useEffect(() => {
    // Cargar favoritos del localStorage al iniciar
    const savedFavorites = localStorage.getItem(STORAGE_KEY);
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Error parsing favorites from localStorage:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    // Guardar favoritos en localStorage cuando cambien
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (vehicle: Vehicle) => {
    if (!favorites.some(fav => fav.id === vehicle.id)) {
      setFavorites(prev => [...prev, vehicle]);
    }
  };

  const removeFavorite = (id: number) => {
    setFavorites(prev => prev.filter(vehicle => vehicle.id !== id));
  };

  const isFavorite = (id: number) => {
    return favorites.some(vehicle => vehicle.id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}