import { FaCog, FaHeart, FaRegHeart, FaExternalLinkAlt, FaCar, FaHandshake } from 'react-icons/fa';
import { Vehicle } from '@shared/schema';
import { formatPrice, formatMileage, getSourceClassName, getSourceLabel, getDefaultImageUrl, buildEbayUrl, buildEdmundsUrl, buildCarsUrl, buildHemmingsUrl, buildBringATrailerUrl, buildClassicCarsUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/lib/favorites-context';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Badge de categoría: clasico|moderno|electrico|hibrido|moto|comercial → label + color tailwind.
// Mapeo en línea para que no dependa de fuentes externas.
const CATEGORY_DISPLAY: Record<string, { label: string; cls: string }> = {
  clasico: { label: 'Clásico', cls: 'bg-amber-600' },
  moderno: { label: 'Moderno', cls: 'bg-blue-600' },
  electrico: { label: 'Eléctrico', cls: 'bg-emerald-600' },
  hibrido: { label: 'Híbrido', cls: 'bg-teal-600' },
  moto: { label: 'Moto', cls: 'bg-rose-600' },
  comercial: { label: 'Comercial', cls: 'bg-slate-600' },
};

type VehicleCardProps = {
  vehicle: Vehicle;
};

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  
  const toggleFavorite = () => {
    if (isFavorite(vehicle.id)) {
      removeFavorite(vehicle.id);
      toast({
        title: "Eliminado de favoritos",
        description: "Se ha eliminado el vehículo de tu lista de favoritos",
      });
    } else {
      addFavorite(vehicle);
      toast({
        title: "Añadido a favoritos",
        description: "Se ha añadido el vehículo a tu lista de favoritos",
      });
    }
  };
  
  /**
   * Abre el cotizador de E-COMEX con los datos del vehículo prefijados.
   * Llama /api/ecomex/quote-link para que el backend construya la URL canónica
   * (con tracking de origen 'clasicar').
   */
  const openEcomexQuote = async () => {
    try {
      const params = new URLSearchParams();
      if (vehicle.make) params.set('make', vehicle.make);
      if (vehicle.model) params.set('model', vehicle.model);
      if (vehicle.year) params.set('year', String(vehicle.year));
      const res = await fetch(`/api/ecomex/quote-link?${params.toString()}`);
      const data = await res.json();
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast({ title: 'No se pudo abrir el cotizador', description: 'Intentá de nuevo en un momento.' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo conectar con el cotizador.' });
    }
  };

  const openSourcePage = () => {
    if (vehicle.sourceUrl) {
      window.open(vehicle.sourceUrl, '_blank');
    } else {
      // Fallback to building a search URL based on the source
      let url = '';
      if (vehicle.source === 'ebay') {
        url = buildEbayUrl(vehicle.make, vehicle.model, vehicle.year?.toString());
      } else if (vehicle.source === 'edmunds') {
        url = buildEdmundsUrl(vehicle.make, vehicle.model, vehicle.year?.toString());
      } else if (vehicle.source === 'cars.com') {
        url = buildCarsUrl(vehicle.make, vehicle.model, vehicle.year?.toString());
      } else if (vehicle.source === 'hemmings.com') {
        url = buildHemmingsUrl(vehicle.make, vehicle.model, vehicle.year?.toString());
      } else if (vehicle.source === 'bringatrailer' || vehicle.source === 'bringatrailer.com') {
        url = buildBringATrailerUrl(vehicle.make, vehicle.model, vehicle.year?.toString());
      } else if (vehicle.source === 'classiccars.com') {
        url = buildClassicCarsUrl(vehicle.make, vehicle.model, vehicle.year?.toString());
      }
      
      if (url) {
        window.open(url, '_blank');
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative">
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        <div className={`${getSourceClassName(vehicle.source)} text-white text-xs font-medium px-2 py-1 rounded`}>
          {getSourceLabel(vehicle.source)}
        </div>
        {vehicle.vehicleCategory && CATEGORY_DISPLAY[vehicle.vehicleCategory] && (
          <div className={`${CATEGORY_DISPLAY[vehicle.vehicleCategory].cls} text-white text-xs font-medium px-2 py-1 rounded`}>
            {CATEGORY_DISPLAY[vehicle.vehicleCategory].label}
          </div>
        )}
      </div>

      {vehicle.hasDeals && (
        <div className="bg-yellow-400 absolute top-2 right-2 text-yellow-900 text-xs font-bold px-2 py-1 rounded-sm z-10">
          SALE
        </div>
      )}
      
      <div className="relative w-full h-48 overflow-hidden">
        <img 
          src={vehicle.imageUrl || getDefaultImageUrl(vehicle.make)}
          alt={vehicle.title} 
          className="w-full h-full object-contain cursor-pointer bg-neutral-100"
          onClick={openSourcePage}
          loading="lazy"
          onError={(e) => {
            console.log("Error loading image:", vehicle.imageUrl);
            const target = e.target as HTMLImageElement;
            target.src = getDefaultImageUrl(vehicle.make);
          }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg cursor-pointer hover:text-primary" onClick={openSourcePage}>{vehicle.title}</h3>
          <div 
            className="bg-neutral-200 p-1 rounded-full cursor-pointer hover:bg-neutral-300"
            onClick={toggleFavorite}
          >
            {isFavorite(vehicle.id) ? (
              <FaHeart className="text-red-500" />
            ) : (
              <FaRegHeart className="text-neutral-600" />
            )}
          </div>
        </div>
        
        {/* Regular price or auction information */}
        {vehicle.isAuction ? (
          <div className="mt-1">
            <p className="text-price">
              {formatPrice(vehicle.currentBid === null ? undefined : vehicle.currentBid)}
              <span className="text-xs text-slate-500 ml-1">oferta actual</span>
            </p>
            {vehicle.endsIn && (
              <p className="text-xs text-green-600 font-medium">
                {vehicle.endsIn.toLowerCase().includes('sold') ? 'Subasta finalizada' : 
                 vehicle.endsIn.toLowerCase().includes('completed') ? 'Subasta finalizada' :
                 vehicle.endsIn === 'No disponible' ? 'Tiempo no disponible' : 
                 `Termina en: ${vehicle.endsIn}`}
              </p>
            )}
          </div>
        ) : (
          <p className="text-price mt-1">{formatPrice(vehicle.price === null ? undefined : vehicle.price)}</p>
        )}
        
        <div className="mt-2 flex flex-wrap gap-2">
          {vehicle.transmission && (
            <span className="badge-info">
              <FaCog className="badge-icon" />
              <span>{vehicle.transmission}</span>
            </span>
          )}
          
          {vehicle.bodyType && (
            <span className="badge-info">
              <FaCar className="badge-icon" />
              <span>{vehicle.bodyType}</span>
            </span>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500">{vehicle.location || 'Unknown Location'}</span>
            <span className="text-xs font-medium mt-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getSourceClassName(vehicle.source)}`}></span>
              Fuente: {getSourceLabel(vehicle.source)}
            </span>
          </div>
          <Button
            variant="link"
            className="text-primary text-sm p-0 h-auto font-medium hover:underline flex items-center gap-1"
            onClick={openSourcePage}
          >
            Ver más <FaExternalLinkAlt className="text-xs" />
          </Button>
        </div>

        {/* CTA Cotizar con E-COMEX — visible siempre, abre cotizador con datos prefijados */}
        <Button
          className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 rounded-md flex items-center justify-center gap-2"
          onClick={openEcomexQuote}
        >
          <FaHandshake />
          Cotizar importación con E-COMEX
        </Button>
      </div>
    </div>
  );
};

export default VehicleCard;
