import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useSearch } from 'wouter';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchForm from '@/components/search/SearchForm';
import FilterPanel from '@/components/search/FilterPanel';
import VehicleCard from '@/components/search/VehicleCard';
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
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = searchParams.get('sort') || 'relevance';
  
  // Parse filter parameters
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
  const { data, isLoading, error } = useQuery({
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
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-primary"></div>
                  <p className="mt-4 text-neutral-600">Searching for vehicles across multiple sources...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-red-600">An error occurred while fetching results. Please try again.</p>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-neutral-600">No vehicles found matching your criteria. Try adjusting your search or filters.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {vehicles.map((vehicle) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>
                  
                  <Pagination 
                    currentPage={page} 
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
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
