import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FaSearch } from 'react-icons/fa';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { carMakes, fordModels, years, buildSearchUrl } from '@/lib/utils';

const formSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().optional(),
  ebay: z.boolean().default(true),
  edmunds: z.boolean().default(true),
});

type SearchFormProps = {
  defaultMake?: string;
  defaultModel?: string;
  defaultYear?: string;
  defaultEbay?: boolean;
  defaultEdmunds?: boolean;
  compact?: boolean;
};

const SearchForm = ({
  defaultMake = '',
  defaultModel = '',
  defaultYear = '',
  defaultEbay = true,
  defaultEdmunds = true,
  compact = false
}: SearchFormProps) => {
  const [, setLocation] = useLocation();
  const [models, setModels] = useState(fordModels);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: defaultMake,
      model: defaultModel,
      year: defaultYear,
      ebay: defaultEbay,
      edmunds: defaultEdmunds,
    },
  });
  
  // Update models when make changes
  useEffect(() => {
    const selectedMake = form.getValues().make;
    if (selectedMake === 'ford') {
      setModels(fordModels);
    }
    // In a real app we would fetch models based on selected make from an API
  }, [form.watch('make')]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const searchUrl = buildSearchUrl(
      values.make,
      values.model,
      values.year,
      values.ebay,
      values.edmunds
    );
    setLocation(searchUrl);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`${compact ? 'bg-white p-4 rounded-lg shadow' : 'max-w-3xl mx-auto bg-white p-4 rounded-lg shadow-lg'}`}>
        <div className={`${compact ? 'flex flex-col gap-3' : 'flex flex-col md:flex-row gap-3'}`}>
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Select Make" />
                    </SelectTrigger>
                    <SelectContent>
                      {carMakes.map((make) => (
                        <SelectItem key={make.value} value={make.value}>
                          {make.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Year</SelectItem>
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
            <span>Search</span>
          </Button>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
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
          </div>
          
          {!compact && (
            <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
              Advanced Options
            </button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default SearchForm;
