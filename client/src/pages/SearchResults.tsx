import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useSearch } from 'wouter';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchForm from '@/components/search/SearchForm';
import FilterPanel from '@/components/search/FilterPanel';
import VehicleCard from '@/components/search/VehicleCard';
import VehicleCardSkeleton from '@/components/search/VehicleCardSkeleton';
import ResultsHeader from '@/components/search/ResultsHeader';
import Pagination from '@/components/search/Pagination';
import { searchParamsSchema, filterSchema, FilterParams, Vehicle } from '@shared/schema';
import { buildSearchUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SearchResults = () => {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  
  // Parse search parameters
  const query = searchParams.get('query') || '';
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const year = searchParams.get('year') || '';
  const ebay = searchParams.get('ebay') !== 'false';
  const edmunds = searchParams.get('edmunds') !== 'false';
  const hemmings = searchParams.get('hemmings') !== 'false';
  const bringatrailer = searchParams.get('bringatrailer') !== 'false';
  const classiccars = searchParams.get('classiccars') !== 'false';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = searchParams.get('sort') || 'relevance';
  
  // Parse filter parameters
  // State for source filters
  const [sources, setSources] = useState({
    ebay,
    edmunds,
    hemmings,
    bringatrailer,
    classiccars
  });
  
  // State for other filters
  const [filters, setFilters] = useState<FilterParams>({
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice') || '0', 10) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') || '0', 10) : undefined,
    minMileage: searchParams.get('minMileage') ? parseInt(searchParams.get('minMileage') || '0', 10) : undefined,
    maxMileage: searchParams.get('maxMileage') ? parseInt(searchParams.get('maxMileage') || '0', 10) : undefined,
    bodyType: searchParams.get('bodyType') ? searchParams.get('bodyType')?.split(',') || [] : undefined,
    transmission: searchParams.get('transmission') ? searchParams.get('transmission')?.split(',') || [] : undefined,
    color: searchParams.get('color') ? searchParams.get('color')?.split(',') || [] : undefined,
  });
  
  // Fetch search results
  const { data, isLoading, error } = useQuery<{
    vehicles: Vehicle[];
    totalResults: number;
    totalPages: number;
  }>({
    queryKey: [`/api/search?${searchParams.toString()}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const vehicles: Vehicle[] = data?.vehicles || [];
  const totalResults = data?.totalResults || 0;
  const totalPages = data?.totalPages || 1;
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    searchParams.set('page', newPage.toString());
    setLocation(`/search?${searchParams.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (newSort: string) => {
    searchParams.set('sort', newSort);
    searchParams.set('page', '1'); // Reset to page 1 when sort changes
    setLocation(`/search?${searchParams.toString()}`);
  };
  
  // Handle filter application
  const handleApplyFilters = (newFilters: FilterParams) => {
    // Update filters state
    setFilters(newFilters);
    
    // Update URL with filter parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            searchParams.set(key, value.join(','));
          } else {
            searchParams.delete(key);
          }
        } else if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, value.toString());
        } else {
          searchParams.delete(key);
        }
      } else {
        searchParams.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    searchParams.set('page', '1');
    setLocation(`/search?${searchParams.toString()}`);
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    // Clear all filter parameters from URL
    [
      'minPrice', 'maxPrice', 'minMileage', 'maxMileage',
      'bodyType', 'transmission', 'color'
    ].forEach(param => {
      searchParams.delete(param);
    });
    
    // Reset filters state
    setFilters({});
    
    // Reset to page 1
    searchParams.set('page', '1');
    setLocation(`/search?${searchParams.toString()}`);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="bg-gradient-primary py-6">
        <div className="container mx-auto px-4">
          <SearchForm 
            defaultQuery={query || `${make} ${model}`.trim()}
            defaultYear={year}
            defaultEbay={ebay}
            defaultEdmunds={edmunds}
            defaultHemmings={hemmings}
            defaultBringatrailer={bringatrailer}
            defaultClassiccars={classiccars}
            compact={true}
          />
        </div>
      </section>
      
      <section className="py-8 flex-grow" id="results">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <FilterPanel 
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              initialFilters={filters}
              sources={sources}
              onSourceChange={setSources}
            />
            
            <div className="lg:w-3/4">
              <ResultsHeader 
                make={make}
                model={model}
                year={year}
                totalResults={totalResults}
                onSortChange={handleSortChange}
                currentSort={sort}
              />
              
              {isLoading ? (
                <>
                  <div className="bg-white rounded-lg shadow p-6 text-center mb-6 slide-up">
                    <div className="inline-block loader-spin h-12 w-12 border-4 border-neutral-300 border-t-primary rounded-full"></div>
                    <p className="mt-4 text-neutral-600">Buscando vehículos en múltiples fuentes...</p>
                  </div>
                  
                  {/* Esqueletos para simular la carga de resultados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <VehicleCardSkeleton key={index} />
                    ))}
                  </div>
                </>
              ) : error ? (
                <div className="bg-white rounded-lg shadow p-8 text-center slide-up">
                  <p className="text-red-600">Ha ocurrido un error al buscar resultados. Por favor, inténtalo de nuevo.</p>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center slide-up">
                  <p className="text-neutral-600">No se encontraron vehículos que coincidan con tus criterios. Intenta ajustar tu búsqueda o filtros.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 staggered-grid">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="staggered-item">
                        <VehicleCard vehicle={vehicle} />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 fade-in">
                    <Pagination 
                      currentPage={page} 
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default SearchResults;
