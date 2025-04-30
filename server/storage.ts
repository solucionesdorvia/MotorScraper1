import { 
  vehicles, 
  searchHistory, 
  filters, 
  type Vehicle, 
  type InsertVehicle,
  type SearchHistory,
  type InsertSearchHistory,
  type Filter,
  type InsertFilter,
  type SearchParams,
  type FilterParams
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  saveVehicles(vehicles: InsertVehicle[]): Promise<Vehicle[]>;
  getVehicles(searchParams: SearchParams, filterParams: FilterParams): Promise<{ vehicles: Vehicle[], totalResults: number, totalPages: number }>;
  clearVehicles(): Promise<void>;
  logSearch(search: InsertSearchHistory): Promise<SearchHistory>;
  saveFilter(filter: InsertFilter): Promise<Filter>;
}

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private searchHistory: Map<number, SearchHistory>;
  private filters: Map<number, Filter>;
  currentVehicleId: number;
  currentSearchHistoryId: number;
  currentFilterId: number;

  constructor() {
    this.vehicles = new Map();
    this.searchHistory = new Map();
    this.filters = new Map();
    this.currentVehicleId = 1;
    this.currentSearchHistoryId = 1;
    this.currentFilterId = 1;
  }

  async saveVehicles(insertVehicles: InsertVehicle[]): Promise<Vehicle[]> {
    const savedVehicles: Vehicle[] = [];
    
    for (const insertVehicle of insertVehicles) {
      const id = this.currentVehicleId++;
      
      // Si estamos usando el campo auctionData, extraer sus valores a los campos principales
      if (insertVehicle.auctionData) {
        insertVehicle.isAuction = insertVehicle.auctionData.isAuction;
        insertVehicle.currentBid = insertVehicle.auctionData.currentBid;
        insertVehicle.endsIn = insertVehicle.auctionData.endsIn;
        // @ts-ignore - Eliminamos auctionData después de extraer sus valores
        delete insertVehicle.auctionData;
      }
      
      const vehicle: Vehicle = { 
        ...insertVehicle, 
        id,
        // Garantizar que los nuevos campos no sean undefined
        isAuction: insertVehicle.isAuction || false,
        currentBid: insertVehicle.currentBid || null,
        endsIn: insertVehicle.endsIn || null
      };
      this.vehicles.set(id, vehicle);
      savedVehicles.push(vehicle);
    }
    
    return savedVehicles;
  }

  async getVehicles(
    searchParams: SearchParams, 
    filterParams: FilterParams
  ): Promise<{ vehicles: Vehicle[], totalResults: number, totalPages: number }> {
    let filteredVehicles = Array.from(this.vehicles.values());
    
    // Apply search filters
    if (searchParams.make) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.make.toLowerCase() === searchParams.make?.toLowerCase()
      );
    }
    
    if (searchParams.model) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.model.toLowerCase() === searchParams.model?.toLowerCase()
      );
    }
    
    if (searchParams.year) {
      filteredVehicles = filteredVehicles.filter(v => v.year === searchParams.year);
    }
    
    // Filter by source
    const enabledSources = [];
    if (searchParams.ebay) enabledSources.push('ebay');
    if (searchParams.edmunds) enabledSources.push('cars.com'); // edmunds maps to cars.com
    if (searchParams.hemmings) enabledSources.push('hemmings.com');
    if (searchParams.bringatrailer) enabledSources.push('bringatrailer.com');
    if (searchParams.classiccars) enabledSources.push('classiccars.com');
    
    if (enabledSources.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => enabledSources.includes(v.source));
    }
    
    // Apply additional filters
    if (filterParams.minPrice !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.price !== undefined && v.price >= filterParams.minPrice!
      );
    }
    
    if (filterParams.maxPrice !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.price !== undefined && v.price <= filterParams.maxPrice!
      );
    }
    
    if (filterParams.minMileage !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.mileage !== undefined && v.mileage >= filterParams.minMileage!
      );
    }
    
    if (filterParams.maxMileage !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.mileage !== undefined && v.mileage <= filterParams.maxMileage!
      );
    }
    
    if (filterParams.bodyType && filterParams.bodyType.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.bodyType !== undefined && filterParams.bodyType!.includes(v.bodyType)
      );
    }
    
    if (filterParams.transmission && filterParams.transmission.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.transmission !== undefined && filterParams.transmission!.includes(v.transmission)
      );
    }
    
    if (filterParams.color && filterParams.color.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.color !== undefined && filterParams.color!.includes(v.color)
      );
    }
    
    // Sort results
    if (searchParams.sort) {
      switch (searchParams.sort) {
        case 'price_asc':
          filteredVehicles.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price_desc':
          filteredVehicles.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'mileage_asc':
          filteredVehicles.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
          break;
        case 'year_desc':
          filteredVehicles.sort((a, b) => (b.year || 0) - (a.year || 0));
          break;
        default:
          // relevance - no sorting needed
          break;
      }
    }
    
    // Paginate results
    const totalResults = filteredVehicles.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / searchParams.limit));
    const start = (searchParams.page - 1) * searchParams.limit;
    const end = start + searchParams.limit;
    const paginatedVehicles = filteredVehicles.slice(start, end);
    
    return {
      vehicles: paginatedVehicles,
      totalResults,
      totalPages
    };
  }

  async clearVehicles(): Promise<void> {
    this.vehicles.clear();
  }

  async logSearch(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.currentSearchHistoryId++;
    const search: SearchHistory = { ...insertSearch, id };
    this.searchHistory.set(id, search);
    return search;
  }

  async saveFilter(insertFilter: InsertFilter): Promise<Filter> {
    const id = this.currentFilterId++;
    const filter: Filter = { ...insertFilter, id };
    this.filters.set(id, filter);
    return filter;
  }
}

export const storage = new MemStorage();
