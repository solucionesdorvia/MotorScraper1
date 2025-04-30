import React from 'react';
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
  const handleToggleSource = (source: string, checked: boolean) => {
    onChange({
      ...sources,
      [source]: checked,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Fuentes</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="ebay" 
            checked={sources.ebay}
            onCheckedChange={(checked) => handleToggleSource('ebay', checked as boolean)}
          />
          <Label htmlFor="ebay" className="cursor-pointer flex items-center">
            <span className="inline-block w-2 h-2 rounded-full mr-1 bg-label-ebay"></span>
            eBay Motors
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="edmunds" 
            checked={sources.edmunds}
            onCheckedChange={(checked) => handleToggleSource('edmunds', checked as boolean)}
          />
          <Label htmlFor="edmunds" className="cursor-pointer flex items-center">
            <span className="inline-block w-2 h-2 rounded-full mr-1 bg-label-cars"></span>
            Cars.com
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hemmings" 
            checked={sources.hemmings}
            onCheckedChange={(checked) => handleToggleSource('hemmings', checked as boolean)}
          />
          <Label htmlFor="hemmings" className="cursor-pointer flex items-center">
            <span className="inline-block w-2 h-2 rounded-full mr-1 bg-label-hemmings"></span>
            Hemmings
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="bringatrailer" 
            checked={sources.bringatrailer}
            onCheckedChange={(checked) => handleToggleSource('bringatrailer', checked as boolean)}
          />
          <Label htmlFor="bringatrailer" className="cursor-pointer flex items-center">
            <span className="inline-block w-2 h-2 rounded-full mr-1 bg-label-bat"></span>
            Bring a Trailer
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="classiccars" 
            checked={sources.classiccars}
            onCheckedChange={(checked) => handleToggleSource('classiccars', checked as boolean)}
          />
          <Label htmlFor="classiccars" className="cursor-pointer flex items-center">
            <span className="inline-block w-2 h-2 rounded-full mr-1 bg-label-classiccars"></span>
            Classic Cars
          </Label>
        </div>
      </div>
    </div>
  );
};

export default SourceFilter;
