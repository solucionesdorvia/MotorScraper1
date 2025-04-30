// VehicleCardSkeleton muestra un estado de carga
// para los vehículos mientras se obtienen resultados
const VehicleCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
      {/* Área de imagen con efecto de carga */}
      <div className="w-full h-48 bg-neutral-200"></div>
      
      <div className="p-4">
        {/* Título simulado */}
        <div className="h-5 bg-neutral-200 rounded-md w-3/4 mb-4"></div>
        
        {/* Precio simulado */}
        <div className="h-7 bg-neutral-200 rounded-md w-1/4 mb-4"></div>
        
        {/* Badges simulados */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-neutral-200 rounded w-20"></div>
          <div className="h-6 bg-neutral-200 rounded w-24"></div>
        </div>
        
        {/* Detalles simulados */}
        <div className="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-neutral-200 rounded w-28"></div>
            <div className="h-4 bg-neutral-200 rounded w-20"></div>
          </div>
          <div className="h-6 bg-neutral-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCardSkeleton;