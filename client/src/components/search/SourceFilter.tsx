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
          id="filter-edmunds"
          checked={sources.edmunds}
          onCheckedChange={(checked) => handleSourceChange('edmunds', !!checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <Label htmlFor="filter-edmunds" className="text-sm cursor-pointer">
          Edmunds
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-hemmings"
          checked={sources.hemmings}
          onCheckedChange={(checked) => handleSourceChange('hemmings', !!checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <Label htmlFor="filter-hemmings" className="text-sm cursor-pointer">
          Hemmings
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
          Bring A Trailer
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-classiccars"
          checked={sources.classiccars}
          onCheckedChange={(checked) => handleSourceChange('classiccars', !!checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <Label htmlFor="filter-classiccars" className="text-sm cursor-pointer">
          Classic Cars
        </Label>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              ebay: true,
              edmunds: true,
              hemmings: true,
              bringatrailer: true,
              classiccars: true,
            })
          }
          className="text-xs text-primary font-medium hover:underline"
        >
          Seleccionar todos
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
          Deseleccionar todos
        </button>
      </div>
    </div>
  );
};

export default SourceFilter;