import { 
  vehicles, 
  searchHistory, 
  filters,
  users,
  favorites,  
  type Vehicle, 
  type InsertVehicle,
  type SearchHistory,
  type InsertSearchHistory,
  type Filter,
  type InsertFilter,
  type SearchParams,
  type FilterParams,
  type User,
  type InsertUser,
  type Favorite,
  type InsertFavorite
} from "@shared/schema";
import { eq, and, like, gt, lt, or, desc, asc } from "drizzle-orm";
import { hash, compare } from "bcrypt";
import { db } from "./db";

// Interface for storage operations
export interface IStorage {
  // Vehicle operations
  saveVehicles(vehicles: InsertVehicle[]): Promise<Vehicle[]>;
  getVehicles(searchParams: SearchParams, filterParams: FilterParams): Promise<{ vehicles: Vehicle[], totalResults: number, totalPages: number }>;
  clearVehicles(): Promise<void>;
  
  // Search operations
  logSearch(search: InsertSearchHistory): Promise<SearchHistory>;
  saveFilter(filter: InsertFilter): Promise<Filter>;
  
  // User authentication operations
  createUser(userData: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  verifyUser(email: string, password: string): Promise<User | undefined>;
  
  // Favorites operations
  addFavorite(userId: number, vehicleId: number): Promise<Favorite>;
  removeFavorite(userId: number, vehicleId: number): Promise<void>;
  getUserFavorites(userId: number): Promise<Vehicle[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private searchHistory: Map<number, SearchHistory>;
  private filters: Map<number, Filter>;
  private users: Map<number, User>;
  private favorites: Map<number, Favorite>;
  currentVehicleId: number;
  currentSearchHistoryId: number;
  currentFilterId: number;
  currentUserId: number;
  currentFavoriteId: number;

  constructor() {
    this.vehicles = new Map();
    this.searchHistory = new Map();
    this.filters = new Map();
    this.users = new Map();
    this.favorites = new Map();
    this.currentVehicleId = 1;
    this.currentSearchHistoryId = 1;
    this.currentFilterId = 1;
    this.currentUserId = 1;
    this.currentFavoriteId = 1;
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
    
    // MOSTRAR VARIABLES para depuración
    console.log(`getVehicles: Total vehículos en almacenamiento: ${filteredVehicles.length}`);
    console.log(`getVehicles: Parámetros de búsqueda:`, JSON.stringify(searchParams));
    
    // Casos especiales para modelos icónicos
    const isMustangSearch = searchParams.make?.toLowerCase() === 'mustang' || 
                           searchParams.model?.toLowerCase() === 'mustang';
    const isChallengerSearch = searchParams.make?.toLowerCase() === 'challenger' || 
                              searchParams.model?.toLowerCase() === 'challenger';
    const isCamaroSearch = searchParams.make?.toLowerCase() === 'camaro' || 
                          searchParams.model?.toLowerCase() === 'camaro';
    const isCorvetteSearch = searchParams.make?.toLowerCase() === 'corvette' || 
                            searchParams.model?.toLowerCase() === 'corvette';
    
    // Apply search filters with special cases
    if (searchParams.make) {
      // Ford Mustang
      if (searchParams.make.toLowerCase() === 'mustang') {
        console.log('getVehicles: Aplicando caso especial para Mustang');
        filteredVehicles = filteredVehicles.filter(v => 
          (v.make.toLowerCase() === 'ford' && v.model.toLowerCase() === 'mustang')
        );
      }
      // Dodge Challenger
      else if (searchParams.make.toLowerCase() === 'challenger') {
        console.log('getVehicles: Aplicando caso especial para Challenger');
        filteredVehicles = filteredVehicles.filter(v => 
          (v.make.toLowerCase() === 'dodge' && v.model.toLowerCase() === 'challenger')
        );
      }
      // Chevrolet Camaro
      else if (searchParams.make.toLowerCase() === 'camaro') {
        console.log('getVehicles: Aplicando caso especial para Camaro');
        filteredVehicles = filteredVehicles.filter(v => 
          (v.make.toLowerCase() === 'chevrolet' && v.model.toLowerCase() === 'camaro')
        );
      }
      // Chevrolet Corvette
      else if (searchParams.make.toLowerCase() === 'corvette') {
        console.log('getVehicles: Aplicando caso especial para Corvette');
        filteredVehicles = filteredVehicles.filter(v => 
          (v.make.toLowerCase() === 'chevrolet' && v.model.toLowerCase() === 'corvette')
        );
      }
      // Caso normal: búsqueda estándar por marca
      else {
        filteredVehicles = filteredVehicles.filter(v => 
          v.make.toLowerCase() === searchParams.make?.toLowerCase()
        );
      }
    }
    
    // Aplicar filtro por modelo solo si no aplicamos un caso especial arriba
    const isSpecialCase = isMustangSearch || isChallengerSearch || isCamaroSearch || isCorvetteSearch;
    if (searchParams.model && !isSpecialCase) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.model.toLowerCase() === searchParams.model?.toLowerCase()
      );
    }
    
    if (searchParams.year) {
      console.log(`getVehicles: Filtrando por año ${searchParams.year}`);

      // Filtro más flexible para el año: aceptamos +/- 3 años de diferencia
      filteredVehicles = filteredVehicles.filter(v => {
        // Si el vehículo no tiene año, lo excluimos
        if (!v.year) return false;
        
        // Calculamos la diferencia absoluta con el año buscado
        const yearDifference = Math.abs(v.year - searchParams.year!);
        
        // Aceptamos vehículos con una diferencia de hasta 3 años
        return yearDifference <= 3;
      });
    }
    
    // Filter by source
    const enabledSources: string[] = [];
    if (searchParams.ebay) enabledSources.push('ebay');
    if (searchParams.edmunds) enabledSources.push('cars.com'); // edmunds maps to cars.com
    if (searchParams.hemmings) enabledSources.push('hemmings.com');
    if (searchParams.bringatrailer) {
      // Bring a Trailer puede venir con diferentes formatos en source
      enabledSources.push('bringatrailer');
      enabledSources.push('Bring a Trailer');
      enabledSources.push('BAT');
    }
    if (searchParams.classiccars) enabledSources.push('classiccars.com');
    
    if (enabledSources.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => enabledSources.includes(v.source));
    }
    
    // Apply additional filters
    if (filterParams.minPrice !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.price !== null && v.price >= (filterParams.minPrice as number)
      );
    }
    
    if (filterParams.maxPrice !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.price !== null && v.price <= (filterParams.maxPrice as number)
      );
    }
    
    if (filterParams.minMileage !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.mileage !== null && v.mileage >= (filterParams.minMileage as number)
      );
    }
    
    if (filterParams.maxMileage !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.mileage !== null && v.mileage <= (filterParams.maxMileage as number)
      );
    }
    
    if (filterParams.bodyType && filterParams.bodyType.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.bodyType !== null && filterParams.bodyType!.includes(v.bodyType as string)
      );
    }
    
    if (filterParams.transmission && filterParams.transmission.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.transmission !== null && filterParams.transmission!.includes(v.transmission as string)
      );
    }
    
    if (filterParams.color && filterParams.color.length > 0) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.color !== null && filterParams.color!.includes(v.color as string)
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
    const search: SearchHistory = { 
      ...insertSearch, 
      id,
      year: insertSearch.year || null,
      make: insertSearch.make || null,
      model: insertSearch.model || null
    };
    this.searchHistory.set(id, search);
    return search;
  }

  async saveFilter(insertFilter: InsertFilter): Promise<Filter> {
    const id = this.currentFilterId++;
    const filter: Filter = { 
      ...insertFilter, 
      id,
      make: insertFilter.make || null,
      model: insertFilter.model || null,
      transmission: insertFilter.transmission || null,
      bodyType: insertFilter.bodyType || null,
      color: insertFilter.color || null,
      minPrice: insertFilter.minPrice || null,
      maxPrice: insertFilter.maxPrice || null,
      minYear: insertFilter.minYear || null,
      maxYear: insertFilter.maxYear || null,
      minMileage: insertFilter.minMileage || null,
      maxMileage: insertFilter.maxMileage || null
    };
    this.filters.set(id, filter);
    return filter;
  }
  
  // User authentication operations
  async createUser(userData: InsertUser): Promise<User> {
    // Encrypt password
    const saltRounds = 10;
    const hashedPassword = await hash(userData.password, saltRounds);
    
    const id = this.currentUserId++;
    const user: User = { 
      ...userData,
      id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const usersList = Array.from(this.users.values());
    return usersList.find(u => u.email === email);
  }

  async verifyUser(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    const passwordMatches = await compare(password, user.password);
    return passwordMatches ? user : undefined;
  }

  // Favorites operations
  async addFavorite(userId: number, vehicleId: number): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const favorite: Favorite = {
      id,
      userId,
      vehicleId,
      createdAt: new Date()
    };
    
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(userId: number, vehicleId: number): Promise<void> {
    const favoritesList = Array.from(this.favorites.values());
    const favoriteToRemove = favoritesList.find(f => f.userId === userId && f.vehicleId === vehicleId);
    
    if (favoriteToRemove) {
      this.favorites.delete(favoriteToRemove.id);
    }
  }

  async getUserFavorites(userId: number): Promise<Vehicle[]> {
    const favoritesList = Array.from(this.favorites.values())
      .filter(f => f.userId === userId);
    
    return favoritesList.map(f => this.vehicles.get(f.vehicleId)!)
      .filter(vehicle => vehicle !== undefined);
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  // Vehicle operations
  async saveVehicles(insertVehicles: InsertVehicle[]): Promise<Vehicle[]> {
    const savedVehicles: Vehicle[] = [];
    
    for (const vehicleData of insertVehicles) {
      // Si hay datos de subasta, extraerlos
      if (vehicleData.auctionData) {
        vehicleData.isAuction = vehicleData.auctionData.isAuction;
        vehicleData.currentBid = vehicleData.auctionData.currentBid;
        vehicleData.endsIn = vehicleData.auctionData.endsIn;
        // @ts-ignore - Eliminamos auctionData después de extraer sus valores
        delete vehicleData.auctionData;
      }
      
      // Garantizar que no hay valores undefined
      const insertData = {
        ...vehicleData,
        // Convertir undefined a null
        price: vehicleData.price ?? null,
        year: vehicleData.year ?? null,
        mileage: vehicleData.mileage ?? null,
        location: vehicleData.location ?? null,
        imageUrl: vehicleData.imageUrl ?? null,
        sourceUrl: vehicleData.sourceUrl ?? null,
        transmission: vehicleData.transmission ?? null,
        fuelType: vehicleData.fuelType ?? null,
        bodyType: vehicleData.bodyType ?? null,
        color: vehicleData.color ?? null,
        vin: vehicleData.vin ?? null,
        dealerName: vehicleData.dealerName ?? null,
        hasDeals: vehicleData.hasDeals ?? false,
        isAuction: vehicleData.isAuction ?? false,
        currentBid: vehicleData.currentBid ?? null,
        endsIn: vehicleData.endsIn ?? null
      };
      
      const [savedVehicle] = await db.insert(vehicles).values(insertData).returning();
      savedVehicles.push(savedVehicle);
    }
    
    return savedVehicles;
  }

  async getVehicles(
    searchParams: SearchParams, 
    filterParams: FilterParams
  ): Promise<{ vehicles: Vehicle[], totalResults: number, totalPages: number }> {
    let query = db.select().from(vehicles);
    
    // Casos especiales para modelos icónicos
    const isMustangSearch = searchParams.make?.toLowerCase() === 'mustang' || 
                           searchParams.model?.toLowerCase() === 'mustang';
    const isChallengerSearch = searchParams.make?.toLowerCase() === 'challenger' || 
                              searchParams.model?.toLowerCase() === 'challenger';
    const isCamaroSearch = searchParams.make?.toLowerCase() === 'camaro' || 
                          searchParams.model?.toLowerCase() === 'camaro';
    const isCorvetteSearch = searchParams.make?.toLowerCase() === 'corvette' || 
                            searchParams.model?.toLowerCase() === 'corvette';
    
    // Apply make filter with special cases
    if (searchParams.make) {
      if (searchParams.make.toLowerCase() === 'mustang') {
        query = query.where(and(
          eq(vehicles.make, 'ford'),
          eq(vehicles.model, 'mustang')
        ));
      } else if (searchParams.make.toLowerCase() === 'challenger') {
        query = query.where(and(
          eq(vehicles.make, 'dodge'),
          eq(vehicles.model, 'challenger')
        ));
      } else if (searchParams.make.toLowerCase() === 'camaro') {
        query = query.where(and(
          eq(vehicles.make, 'chevrolet'),
          eq(vehicles.model, 'camaro')
        ));
      } else if (searchParams.make.toLowerCase() === 'corvette') {
        query = query.where(and(
          eq(vehicles.make, 'chevrolet'),
          eq(vehicles.model, 'corvette')
        ));
      } else {
        query = query.where(eq(vehicles.make, searchParams.make));
      }
    }
    
    // Apply model filter if not a special case
    const isSpecialCase = isMustangSearch || isChallengerSearch || isCamaroSearch || isCorvetteSearch;
    if (searchParams.model && !isSpecialCase) {
      query = query.where(eq(vehicles.model, searchParams.model));
    }
    
    // Apply year filter
    if (searchParams.year) {
      // Permitir +/- 3 años de diferencia
      const yearMin = searchParams.year - 3;
      const yearMax = searchParams.year + 3;
      query = query.where(and(
        gt(vehicles.year, yearMin),
        lt(vehicles.year, yearMax)
      ));
    }
    
    // Filter by source
    const enabledSources: string[] = [];
    if (searchParams.ebay) enabledSources.push('ebay');
    if (searchParams.edmunds) enabledSources.push('cars.com');
    if (searchParams.hemmings) enabledSources.push('hemmings.com');
    if (searchParams.bringatrailer) {
      enabledSources.push('bringatrailer');
      enabledSources.push('Bring a Trailer');
      enabledSources.push('BAT');
    }
    if (searchParams.classiccars) enabledSources.push('classiccars.com');
    
    if (enabledSources.length > 0) {
      const sourceConditions = enabledSources.map(s => eq(vehicles.source, s));
      query = query.where(or(...sourceConditions));
    }
    
    // Apply other filters
    if (filterParams.minPrice !== undefined) {
      query = query.where(gt(vehicles.price, filterParams.minPrice));
    }
    
    if (filterParams.maxPrice !== undefined) {
      query = query.where(lt(vehicles.price, filterParams.maxPrice));
    }
    
    if (filterParams.minMileage !== undefined) {
      query = query.where(gt(vehicles.mileage, filterParams.minMileage));
    }
    
    if (filterParams.maxMileage !== undefined) {
      query = query.where(lt(vehicles.mileage, filterParams.maxMileage));
    }
    
    // Body type, transmission and color filters
    if (filterParams.bodyType && filterParams.bodyType.length > 0) {
      const conditions = filterParams.bodyType.map(type => eq(vehicles.bodyType, type));
      query = query.where(or(...conditions));
    }
    
    if (filterParams.transmission && filterParams.transmission.length > 0) {
      const conditions = filterParams.transmission.map(t => eq(vehicles.transmission, t));
      query = query.where(or(...conditions));
    }
    
    if (filterParams.color && filterParams.color.length > 0) {
      const conditions = filterParams.color.map(c => eq(vehicles.color, c));
      query = query.where(or(...conditions));
    }
    
    // Count total results
    const countQuery = db.select({ count: db.fn.count() }).from(vehicles);
    const [{ count }] = await countQuery;
    const totalResults = Number(count);
    
    // Apply sorting
    if (searchParams.sort) {
      switch (searchParams.sort) {
        case 'price_asc':
          query = query.orderBy(asc(vehicles.price));
          break;
        case 'price_desc':
          query = query.orderBy(desc(vehicles.price));
          break;
        case 'mileage_asc':
          query = query.orderBy(asc(vehicles.mileage));
          break;
        case 'year_desc':
          query = query.orderBy(desc(vehicles.year));
          break;
        default:
          // relevance - no sorting
          break;
      }
    }
    
    // Apply pagination
    const limit = searchParams.limit;
    const offset = (searchParams.page - 1) * limit;
    query = query.limit(limit).offset(offset);
    
    // Execute query
    const results = await query;
    const totalPages = Math.max(1, Math.ceil(totalResults / limit));
    
    return {
      vehicles: results,
      totalResults,
      totalPages
    };
  }

  async clearVehicles(): Promise<void> {
    await db.delete(vehicles);
  }

  async logSearch(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    const [search] = await db.insert(searchHistory).values({
      query: insertSearch.query,
      make: insertSearch.make || null,
      model: insertSearch.model || null,
      year: insertSearch.year || null,
      timestamp: insertSearch.timestamp
    }).returning();
    
    return search;
  }

  async saveFilter(insertFilter: InsertFilter): Promise<Filter> {
    const [filter] = await db.insert(filters).values({
      minPrice: insertFilter.minPrice || null,
      maxPrice: insertFilter.maxPrice || null,
      minYear: insertFilter.minYear || null,
      maxYear: insertFilter.maxYear || null,
      minMileage: insertFilter.minMileage || null,
      maxMileage: insertFilter.maxMileage || null,
      make: insertFilter.make || null,
      model: insertFilter.model || null,
      transmission: insertFilter.transmission || null,
      bodyType: insertFilter.bodyType || null,
      color: insertFilter.color || null
    }).returning();
    
    return filter;
  }

  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    // Encrypt password
    const saltRounds = 10;
    const hashedPassword = await hash(userData.password, saltRounds);
    
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword
    }).returning();
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async verifyUser(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    const passwordMatches = await compare(password, user.password);
    return passwordMatches ? user : undefined;
  }

  // Favorites operations
  async addFavorite(userId: number, vehicleId: number): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values({
      userId,
      vehicleId
    }).returning();
    
    return favorite;
  }

  async removeFavorite(userId: number, vehicleId: number): Promise<void> {
    await db.delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.vehicleId, vehicleId)
      ));
  }

  async getUserFavorites(userId: number): Promise<Vehicle[]> {
    const userFavorites = await db.select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    if (userFavorites.length === 0) {
      return [];
    }
    
    const vehicleIds = userFavorites.map(f => f.vehicleId);
    const conditions = vehicleIds.map(id => eq(vehicles.id, id));
    
    return db.select().from(vehicles).where(or(...conditions));
  }
}

// Use DatabaseStorage since we now have a database connection
export const storage = new DatabaseStorage();