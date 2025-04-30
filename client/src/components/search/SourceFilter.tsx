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
  // Solo permitimos eBay Motors a pedido del usuario
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
      
      <div className="pt-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              ebay: true,
              edmunds: false, // Mantenemos estas propiedades para compatibilidad,
              hemmings: false, // pero no permitimos activarlas en la UI
              bringatrailer: false,
              classiccars: false,
            })
          }
          className="text-xs text-primary font-medium hover:underline"
        >
          Activar eBay Motors
        </button>
        <span className="text-neutral-300 mx-2">|</span>
        <button
          type="button"
          onClick={() =>
            onChange({
              ebay: false,
              edmunds: false,
              hemmings: false,
              bringatrailer: false,
              classiccars: false,
            })
          }
          className="text-xs text-primary font-medium hover:underline"
        >
          Desactivar eBay Motors
        </button>
      </div>
    </div>
  );
};

export default SourceFilter;