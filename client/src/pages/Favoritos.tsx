import { useState } from 'react';
import { FaHeart, FaSearch, FaFilter, FaCarSide, FaSortAmountDown, FaSortAmountUp, FaTrashAlt, FaExternalLinkAlt, FaShare } from 'react-icons/fa';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { formatPrice } from '@/lib/utils';
import { useFavorites } from '@/lib/favorites-context';
import { Label } from '@/components/ui/label';

const Favoritos = () => {
  // Utilizamos el contexto de favoritos para obtener los vehículos guardados
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  
  // Estado para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  
  // Ejemplo de vehículos favoritos (utilizaríamos favorites del contexto en una implementación real)
  const vehiculosFavoritos = [
    {
      id: 1,
      imageUrl: "https://via.placeholder.com/400x300?text=Ford+Mustang",
      title: "Ford Mustang Fastback 1967",
      year: 1967,
      price: 35000,
      location: "Estados Unidos",
      source: "eBay Motors",
      dateAdded: "2024-04-10",
      url: "#"
    },
    {
      id: 2,
      imageUrl: "https://via.placeholder.com/400x300?text=Chevrolet+Corvette",
      title: "Chevrolet Corvette Stingray 1969",
      year: 1969,
      price: 42500,
      location: "Estados Unidos",
      source: "Bring a Trailer",
      dateAdded: "2024-04-09",
      url: "#"
    },
    {
      id: 3,
      imageUrl: "https://via.placeholder.com/400x300?text=Porsche+911",
      title: "Porsche 911 Targa 1973",
      year: 1973,
      price: 65000,
      location: "Alemania",
      source: "eBay Motors",
      dateAdded: "2024-04-08",
      url: "#"
    },
    {
      id: 4,
      imageUrl: "https://via.placeholder.com/400x300?text=Volkswagen+Beetle",
      title: "Volkswagen Beetle 1962",
      year: 1962,
      price: 18500,
      location: "Estados Unidos",
      source: "Bring a Trailer",
      dateAdded: "2024-04-05",
      url: "#"
    },
    {
      id: 5,
      imageUrl: "https://via.placeholder.com/400x300?text=Dodge+Charger",
      title: "Dodge Charger R/T 1969",
      year: 1969,
      price: 55000,
      location: "Estados Unidos",
      source: "eBay Motors",
      dateAdded: "2024-04-02",
      url: "#"
    },
    {
      id: 6,
      imageUrl: "https://via.placeholder.com/400x300?text=Mercedes+Benz",
      title: "Mercedes-Benz 280SL Pagoda 1971",
      year: 1971,
      price: 85000,
      location: "Alemania",
      source: "Bring a Trailer",
      dateAdded: "2024-04-01",
      url: "#"
    }
  ];
  
  // Opciones de fuentes para filtrar
  const fuentesDisponibles = [
    { id: 'ebay', name: 'eBay Motors' },
    { id: 'bringatrailer', name: 'Bring a Trailer' }
  ];
  
  // Opciones de décadas para filtrar
  const decadasDisponibles = [
    { id: '1950s', name: '1950-1959' },
    { id: '1960s', name: '1960-1969' },
    { id: '1970s', name: '1970-1979' },
    { id: '1980s', name: '1980-1989' },
    { id: '1990s', name: '1990-1995' }
  ];
  
  // Función para filtrar vehículos según los criterios de búsqueda
  const filteredVehicles = vehiculosFavoritos.filter(vehicle => {
    // Filtrar por término de búsqueda
    if (searchTerm && !vehicle.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar por fuente
    if (selectedSources.length > 0 && !selectedSources.some(source => vehicle.source.includes(source))) {
      return false;
    }
    
    // Filtrar por década
    if (selectedYears.length > 0) {
      const decade = getDecadeFromYear(vehicle.year);
      if (!selectedYears.includes(decade)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Función para ordenar vehículos
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortOption) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'year_asc':
        return a.year - b.year;
      case 'year_desc':
        return b.year - a.year;
      case 'recent':
      default:
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
  });
  
  // Función para obtener la década de un año
  function getDecadeFromYear(year: number): string {
    if (year >= 1950 && year <= 1959) return '1950s';
    if (year >= 1960 && year <= 1969) return '1960s';
    if (year >= 1970 && year <= 1979) return '1970s';
    if (year >= 1980 && year <= 1989) return '1980s';
    if (year >= 1990 && year <= 1995) return '1990s';
    return '';
  }
  
  // Función para manejar cambios en los filtros de fuentes
  const handleSourceChange = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };
  
  // Función para manejar cambios en los filtros de décadas
  const handleYearChange = (yearId: string) => {
    setSelectedYears(prev => 
      prev.includes(yearId)
        ? prev.filter(id => id !== yearId)
        : [...prev, yearId]
    );
  };
  
  // Función para eliminar un favorito
  const handleRemoveFavorite = (id: number) => {
    removeFavorite(id);
  };
  
  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSources([]);
    setSelectedYears([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="bg-gradient-to-r from-primary/95 to-primary py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Mis Favoritos
              </h1>
              <p className="text-white/90">
                Vehículos que has guardado para comparar y seguir
              </p>
            </div>
            <Button 
              className="mt-4 md:mt-0 bg-white text-primary hover:bg-gray-100"
              onClick={() => window.location.href = '/busqueda'}
            >
              <FaSearch className="mr-2" />
              Buscar Más Vehículos
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-10 flex-grow bg-neutral-100">
        <div className="container mx-auto px-4">
          {/* Barra de búsqueda y filtros */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Buscar en favoritos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <FaSearch className="absolute left-3 top-3 text-neutral-400" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className={`flex items-center gap-2 ${showFilters ? 'bg-neutral-100' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter className={showFilters ? 'text-primary' : ''} />
                  <span>Filtros</span>
                </Button>
                
                <select 
                  className="px-3 py-2 rounded-md border border-neutral-300 bg-white"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="year_asc">Año: antiguo a nuevo</option>
                  <option value="year_desc">Año: nuevo a antiguo</option>
                </select>
              </div>
            </div>
            
            {/* Panel de filtros expandible */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Fuentes</h3>
                    <div className="space-y-2">
                      {fuentesDisponibles.map((fuente) => (
                        <div key={fuente.id} className="flex items-center">
                          <Checkbox 
                            id={`source-${fuente.id}`}
                            checked={selectedSources.includes(fuente.id)}
                            onCheckedChange={() => handleSourceChange(fuente.id)}
                            className="mr-2"
                          />
                          <Label 
                            htmlFor={`source-${fuente.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {fuente.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Década</h3>
                    <div className="space-y-2">
                      {decadasDisponibles.map((decada) => (
                        <div key={decada.id} className="flex items-center">
                          <Checkbox 
                            id={`year-${decada.id}`}
                            checked={selectedYears.includes(decada.id)}
                            onCheckedChange={() => handleYearChange(decada.id)}
                            className="mr-2"
                          />
                          <Label 
                            htmlFor={`year-${decada.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {decada.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={handleClearFilters}
                  >
                    Limpiar Filtros
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white"
                    onClick={() => setShowFilters(false)}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Contenido principal */}
          {sortedVehicles.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-neutral-600">
                  Mostrando {sortedVehicles.length} de {vehiculosFavoritos.length} vehículos favoritos
                </p>
                {filteredVehicles.length !== vehiculosFavoritos.length && (
                  <Button 
                    variant="ghost" 
                    className="text-primary text-sm"
                    onClick={handleClearFilters}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedVehicles.map((vehiculo) => (
                  <div key={vehiculo.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="relative h-48 bg-neutral-200">
                      <img 
                        src={vehiculo.imageUrl} 
                        alt={vehiculo.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleRemoveFavorite(vehiculo.id)}
                        >
                          <FaTrashAlt className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white font-medium">{vehiculo.title}</p>
                        <p className="text-white/80 text-sm">{vehiculo.year}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-primary font-bold text-lg">
                          {formatPrice(vehiculo.price)}
                        </span>
                        <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded text-xs">
                          {vehiculo.source}
                        </span>
                      </div>
                      <p className="text-neutral-600 text-sm flex items-center gap-1 mb-3">
                        <FaCarSide />
                        <span>Ubicación: {vehiculo.location}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={vehiculo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-primary hover:bg-primary/90 text-white text-sm py-2 px-3 rounded-md flex items-center justify-center gap-1"
                        >
                          <FaExternalLinkAlt className="h-3 w-3" />
                          <span>Ver Original</span>
                        </a>
                        <Button variant="outline" className="text-sm">
                          <FaShare className="mr-1 h-3 w-3" />
                          <span>Compartir</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaHeart className="text-neutral-300 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No has guardado favoritos</h3>
              <p className="text-neutral-600 mb-6">
                No tienes vehículos favoritos guardados o no coinciden con los filtros seleccionados.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => window.location.href = '/busqueda'}
                >
                  Buscar Vehículos
                </Button>
                {selectedSources.length > 0 || selectedYears.length > 0 || searchTerm && (
                  <Button 
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Favoritos;