import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FilterParams } from '@shared/schema';
import { bodyTypes, transmissions, colors } from '@/lib/utils';
import SourceFilter from './SourceFilter';

type FilterAccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const FilterAccordion = ({ title, children, defaultOpen = false }: FilterAccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b pb-4">
      <div 
        className="flex justify-between items-center mb-2 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium">{title}</h3>
        {isOpen ? <FaChevronUp className="text-neutral-500 transition-transform" /> : <FaChevronDown className="text-neutral-500 transition-transform" />}
      </div>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
};

const filterSchema = z.object({
  minPrice: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  minMileage: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  maxMileage: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  bodyType: z.array(z.string()).default([]),
  transmission: z.array(z.string()).default([]),
  color: z.array(z.string()).default([]),
});

type FilterPanelProps = {
  onApplyFilters: (filters: FilterParams) => void;
  onResetFilters: () => void;
  initialFilters?: FilterParams;
  sources: {
    ebay: boolean;
    edmunds: boolean;
    hemmings: boolean;
    bringatrailer: boolean;
    classiccars: boolean;
  };
  onSourceChange: (sources: any) => void;
};

const FilterPanel = ({ onApplyFilters, onResetFilters, initialFilters, sources, onSourceChange }: FilterPanelProps) => {
  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      minPrice: initialFilters?.minPrice ? initialFilters.minPrice.toString() : '',
      maxPrice: initialFilters?.maxPrice ? initialFilters.maxPrice.toString() : '',
      minMileage: initialFilters?.minMileage ? initialFilters.minMileage.toString() : '',
      maxMileage: initialFilters?.maxMileage ? initialFilters.maxMileage.toString() : '',
      bodyType: initialFilters?.bodyType || [],
      transmission: initialFilters?.transmission || [],
      color: initialFilters?.color || [],
    },
  });
  
  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    onApplyFilters({
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      minMileage: data.minMileage,
      maxMileage: data.maxMileage,
      bodyType: data.bodyType,
      transmission: data.transmission,
      color: data.color,
    });
  };
  
  return (
    <aside className="lg:w-1/4 bg-white rounded-lg shadow p-4 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <button 
          className="text-primary text-sm font-medium"
          onClick={onResetFilters}
        >
          Restablecer
        </button>
      </div>
      
      {/* Source Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Fuentes</h3>
        <SourceFilter sources={sources} onChange={onSourceChange} />
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FilterAccordion title="Rango de Precio" defaultOpen={true}>
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="minPrice"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Mínimo" 
                        {...field} 
                        className="p-2 border border-neutral-300 rounded-md text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-neutral-500">-</span>
              <FormField
                control={form.control}
                name="maxPrice"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Máximo" 
                        {...field} 
                        className="p-2 border border-neutral-300 rounded-md text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FilterAccordion>
          
          <FilterAccordion title="Kilometraje">
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="minMileage"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Mínimo" 
                        {...field} 
                        className="p-2 border border-neutral-300 rounded-md text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-neutral-500">-</span>
              <FormField
                control={form.control}
                name="maxMileage"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Máximo" 
                        {...field} 
                        className="p-2 border border-neutral-300 rounded-md text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FilterAccordion>
          
          <FilterAccordion title="Tipo de Carrocería">
            <div className="space-y-2">
              {bodyTypes.map((bodyType) => (
                <FormField
                  key={bodyType.value}
                  control={form.control}
                  name="bodyType"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(bodyType.value)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, bodyType.value])
                              : field.onChange(field.value?.filter((value) => value !== bodyType.value))
                          }}
                          className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300"
                        />
                      </FormControl>
                      <FormLabel className="ml-2 text-sm">{bodyType.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </FilterAccordion>
          
          <FilterAccordion title="Transmisión">
            <div className="space-y-2">
              {transmissions.map((transmission) => (
                <FormField
                  key={transmission.value}
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(transmission.value)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, transmission.value])
                              : field.onChange(field.value?.filter((value) => value !== transmission.value))
                          }}
                          className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300"
                        />
                      </FormControl>
                      <FormLabel className="ml-2 text-sm">{transmission.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </FilterAccordion>
          
          <FilterAccordion title="Color">
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <div 
                  key={color.value}
                  title={color.label}
                  className={`w-6 h-6 rounded-full cursor-pointer border border-neutral-300`}
                  onClick={() => {
                    const currentColors = form.getValues().color;
                    if (currentColors.includes(color.value)) {
                      form.setValue('color', currentColors.filter(c => c !== color.value));
                    } else {
                      form.setValue('color', [...currentColors, color.value]);
                    }
                  }}
                  style={{
                    backgroundColor: color.value,
                    boxShadow: form.getValues().color.includes(color.value) ? '0 0 0 2px var(--primary)' : 'none',
                  }}
                />
              ))}
            </div>
          </FilterAccordion>
          
          <Button 
            type="submit" 
            className="mt-6 w-full bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            Aplicar Filtros
          </Button>
        </form>
      </Form>
    </aside>
  );
};

export default FilterPanel;
