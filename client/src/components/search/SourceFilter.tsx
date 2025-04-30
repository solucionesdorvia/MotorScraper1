import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type SourceFilterProps = {
  sources: {
    ebay: boolean;
    edmunds: boolean;
    hemmings: boolean;
    bringatrailer: boolean;
    classiccars: boolean;
  };
  onChange: (sources: any) => void;
};

const SourceFilter = ({ sources, onChange }: SourceFilterProps) => {
  // Permitimos eBay Motors y Bring a Trailer según solicitud del usuario
  const handleSourceChange = (source: string, checked: boolean) => {
    onChange({
      ...sources,
      [source]: checked,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-ebay"
          checked={sources.ebay}
          onCheckedChange={(checked) => handleSourceChange('ebay', !!checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <Label htmlFor="filter-ebay" className="text-sm cursor-pointer">
          eBay Motors
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-bringatrailer"
          checked={sources.bringatrailer}
          onCheckedChange={(checked) => handleSourceChange('bringatrailer', !!checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <Label htmlFor="filter-bringatrailer" className="text-sm cursor-pointer">
          Bring a Trailer
        </Label>
      </div>
      
      <div className="pt-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              ebay: true,
              bringatrailer: true,
              edmunds: false, // Mantenemos estas propiedades para compatibilidad,
              hemmings: false, // pero no permitimos activarlas en la UI
              classiccars: false,
            })
          }
          className="text-xs text-primary font-medium hover:underline"
        >
          Activar Todas
        </button>
        <span className="text-neutral-300 mx-2">|</span>
        <button
          type="button"
          onClick={() =>
            onChange({
              ebay: false,
              bringatrailer: false,
              edmunds: false,
              hemmings: false,
              classiccars: false,
            })
          }
          className="text-xs text-primary font-medium hover:underline"
        >
          Desactivar Todas
        </button>
      </div>
    </div>
  );
};

export default SourceFilter;