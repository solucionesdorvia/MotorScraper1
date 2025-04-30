import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FaSearch } from 'react-icons/fa';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { years } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  query: z.string().min(1, 'Por favor ingresa lo que quieres buscar'),
  year: z.string().optional(),
  ebay: z.boolean().default(true),
  edmunds: z.boolean().default(true),
  hemmings: z.boolean().default(true),
  bringatrailer: z.boolean().default(true),
  classiccars: z.boolean().default(true),
});

type SearchFormProps = {
  defaultQuery?: string;
  defaultYear?: string;
  defaultEbay?: boolean;
  defaultEdmunds?: boolean;
  defaultHemmings?: boolean;
  defaultBringatrailer?: boolean;
  defaultClassiccars?: boolean;
  compact?: boolean;
};

const SearchForm = ({
  defaultQuery = '',
  defaultYear = '',
  defaultEbay = true,
  defaultEdmunds = true,
  defaultHemmings = true,
  defaultBringatrailer = true,
  defaultClassiccars = true,
  compact = false
}: SearchFormProps) => {
  const [, setLocation] = useLocation();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: defaultQuery,
      year: defaultYear,
      ebay: defaultEbay,
      edmunds: defaultEdmunds,
      hemmings: defaultHemmings,
      bringatrailer: defaultBringatrailer,
      classiccars: defaultClassiccars,
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Parse the query to extract make and model if possible
    const queryParts = values.query.split(' ').filter(part => part.trim() !== '');
    const searchParams = new URLSearchParams();
    
    // Add query parameter
    searchParams.set('query', values.query);
    
    // Try to guess make/model from the query
    if (queryParts.length > 0) {
      searchParams.set('make', queryParts[0]);
      
      if (queryParts.length > 1) {
        searchParams.set('model', queryParts.slice(1).join(' '));
      }
    }
    
    // Add other parameters
    if (values.year) {
      searchParams.set('year', values.year);
    }
    
    if (!values.ebay) {
      searchParams.set('ebay', 'false');
    }
    
    if (!values.edmunds) {
      searchParams.set('edmunds', 'false');
    }
    
    if (!values.hemmings) {
      searchParams.set('hemmings', 'false');
    }
    
    if (!values.bringatrailer) {
      searchParams.set('bringatrailer', 'false');
    }
    
    if (!values.classiccars) {
      searchParams.set('classiccars', 'false');
    }
    
    setLocation(`/search?${searchParams.toString()}`);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`${compact ? 'bg-white p-4 rounded-lg shadow' : 'max-w-3xl mx-auto bg-white p-4 rounded-lg shadow-lg'}`}>
        <div className={`${compact ? 'flex flex-col gap-3' : 'flex flex-col md:flex-row gap-3'}`}>
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input 
                    {...field}
                    placeholder="Buscar vehículos (ej: Ford Mustang)" 
                    className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem className="flex-1 md:max-w-[150px]">
                <FormControl>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquier Año</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <FaSearch />
            <span>Buscar</span>
          </Button>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-3">
            <FormField
              control={form.control}
              name="ebay"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </FormControl>
                  <FormLabel className="ml-2 text-sm text-neutral-700">eBay Motors</FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="edmunds"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </FormControl>
                  <FormLabel className="ml-2 text-sm text-neutral-700">Edmunds</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hemmings"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </FormControl>
                  <FormLabel className="ml-2 text-sm text-neutral-700">Hemmings</FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bringatrailer"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </FormControl>
                  <FormLabel className="ml-2 text-sm text-neutral-700">Bring a Trailer</FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="classiccars"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="form-checkbox h-4 w-4 text-primary rounded border-neutral-300 focus:ring-2 focus:ring-primary/50"
                    />
                  </FormControl>
                  <FormLabel className="ml-2 text-sm text-neutral-700">Classic Cars</FormLabel>
                </FormItem>
              )}
            />
          </div>
          
          {!compact && (
            <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
              Opciones Avanzadas
            </button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default SearchForm;
