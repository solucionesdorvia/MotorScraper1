import { useState } from 'react';
import { FaCog, FaHeart, FaRegHeart, FaExternalLinkAlt, FaCar } from 'react-icons/fa';
import { Vehicle } from '@shared/schema';
import { formatPrice, formatMileage, getSourceClassName, getSourceLabel, getDefaultImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type VehicleCardProps = {
  vehicle: Vehicle;
};

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  const openSourcePage = () => {
    if (vehicle.sourceUrl) {
      window.open(vehicle.sourceUrl, '_blank');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow relative">
      <div className={`absolute top-2 left-2 ${getSourceClassName(vehicle.source)} text-white text-xs font-medium px-2 py-1 rounded`}>
        {getSourceLabel(vehicle.source)}
      </div>
      
      {vehicle.hasDeals && (
        <div className="bg-yellow-400 absolute top-2 right-2 text-yellow-900 text-xs font-bold px-2 py-1 rounded-sm">
          SALE
        </div>
      )}
      
      <img 
        src={vehicle.imageUrl || getDefaultImageUrl(vehicle.make)}
        alt={vehicle.title} 
        className="w-full h-48 object-cover cursor-pointer"
        onClick={openSourcePage}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = getDefaultImageUrl(vehicle.make);
        }}
      />
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg cursor-pointer hover:text-primary" onClick={openSourcePage}>{vehicle.title}</h3>
          <div 
            className="bg-neutral-200 p-1 rounded-full cursor-pointer hover:bg-neutral-300"
            onClick={toggleFavorite}
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" />
            ) : (
              <FaRegHeart className="text-neutral-600" />
            )}
          </div>
        </div>
        
        <p className="text-price mt-1">{formatPrice(vehicle.price === null ? undefined : vehicle.price)}</p>
        
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
          <span className="text-xs text-neutral-500">{vehicle.location || 'Unknown Location'}</span>
          <Button 
            variant="link" 
            className="text-primary text-sm p-0 h-auto font-medium hover:underline flex items-center gap-1"
            onClick={openSourcePage}
          >
            Ver más <FaExternalLinkAlt className="text-xs" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
