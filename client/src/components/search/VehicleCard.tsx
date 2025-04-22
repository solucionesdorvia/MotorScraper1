import { useState } from 'react';
import { FaTachometerAlt, FaGasPump, FaCog, FaHeart, FaRegHeart, FaMapMarkerAlt, FaCar } from 'react-icons/fa';
import { Vehicle } from '@shared/schema';
import { formatPrice, formatMileage, getSourceClassName, getSourceLabel, getDefaultImageUrl } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type VehicleCardProps = {
  vehicle: Vehicle;
};

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  const openDetails = () => {
    setIsDetailsOpen(true);
  };
  
  return (
    <>
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
          onClick={openDetails}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getDefaultImageUrl(vehicle.make);
          }}
        />
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg cursor-pointer hover:text-primary" onClick={openDetails}>{vehicle.title}</h3>
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
            <span className="badge-info">
              <FaTachometerAlt className="badge-icon" />
              <span>{formatMileage(vehicle.mileage === null ? undefined : vehicle.mileage)}</span>
            </span>
            
            {vehicle.fuelType && (
              <span className="badge-info">
                <FaGasPump className="badge-icon" />
                <span>{vehicle.fuelType}</span>
              </span>
            )}
            
            {vehicle.transmission && (
              <span className="badge-info">
                <FaCog className="badge-icon" />
                <span>{vehicle.transmission}</span>
              </span>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
            <span className="text-xs text-neutral-500">{vehicle.location || 'Unknown Location'}</span>
            <Button 
              variant="link" 
              className="text-primary text-sm p-0 h-auto font-medium hover:underline"
              onClick={openDetails}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
      
      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{vehicle.title}</DialogTitle>
            <DialogDescription>
              <div className={`inline-block ${getSourceClassName(vehicle.source)} text-white text-xs font-medium px-2 py-1 rounded mt-1`}>
                {getSourceLabel(vehicle.source)}
              </div>
              {vehicle.hasDeals && (
                <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-sm ml-2">
                  SALE
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <img 
                src={vehicle.imageUrl || getDefaultImageUrl(vehicle.make)}
                alt={vehicle.title} 
                className="w-full rounded-md object-cover"
                style={{height: '300px'}}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getDefaultImageUrl(vehicle.make);
                }}
              />
            </div>
            
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-price mb-2">{formatPrice(vehicle.price === null ? undefined : vehicle.price)}</div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FaTachometerAlt className="text-neutral-500" />
                  <span><strong>Mileage:</strong> {formatMileage(vehicle.mileage === null ? undefined : vehicle.mileage)}</span>
                </div>
                
                {vehicle.year && (
                  <div className="flex items-center gap-2">
                    <FaCar className="text-neutral-500" />
                    <span><strong>Year:</strong> {vehicle.year}</span>
                  </div>
                )}
                
                {vehicle.transmission && (
                  <div className="flex items-center gap-2">
                    <FaCog className="text-neutral-500" />
                    <span><strong>Transmission:</strong> {vehicle.transmission}</span>
                  </div>
                )}
                
                {vehicle.fuelType && (
                  <div className="flex items-center gap-2">
                    <FaGasPump className="text-neutral-500" />
                    <span><strong>Fuel Type:</strong> {vehicle.fuelType}</span>
                  </div>
                )}
                
                {vehicle.bodyType && (
                  <div className="flex items-center gap-2">
                    <FaCar className="text-neutral-500" />
                    <span><strong>Body Type:</strong> {vehicle.bodyType}</span>
                  </div>
                )}
                
                {vehicle.color && (
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full inline-block`} style={{backgroundColor: vehicle.color.toLowerCase()}}></div>
                    <span><strong>Color:</strong> {vehicle.color}</span>
                  </div>
                )}
                
                {vehicle.location && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-neutral-500" />
                    <span><strong>Location:</strong> {vehicle.location}</span>
                  </div>
                )}
                
                {vehicle.dealerName && (
                  <div className="flex items-center gap-2">
                    <span><strong>Dealer:</strong> {vehicle.dealerName}</span>
                  </div>
                )}
                
                {vehicle.vin && (
                  <div className="flex items-start gap-2">
                    <span><strong>VIN:</strong> {vehicle.vin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => vehicle.sourceUrl && window.open(vehicle.sourceUrl, '_blank')}
              className="bg-secondary hover:bg-secondary/90 text-white"
            >
              View on {getSourceLabel(vehicle.source)}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VehicleCard;
