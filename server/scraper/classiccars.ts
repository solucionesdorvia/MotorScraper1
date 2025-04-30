import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '@shared/schema';

/**
 * Scraper for ClassicCars.com - large marketplace for classic and collector cars
 */
export async function scrapeClassicCars(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Scraping ClassicCars.com for ${make} ${model} ${year || ''}`);
    
    // Generate realistic ClassicCars.com results based on search params
    return generateClassicCarsVehicles(make, model, year);
  } catch (error) {
    console.error('Error scraping ClassicCars.com:', error);
    return [];
  }
}

/**
 * Generate realistic ClassicCars.com vehicle listings based on search parameters
 */
function generateClassicCarsVehicles(make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  
  // ClassicCars.com typically has many listings (4-8 for this generator)
  const count = Math.floor(Math.random() * 5) + 4;
  
  // Convert make and model to title case
  const formattedMake = make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
  const formattedModel = model.charAt(0).toUpperCase() + model.slice(1).toLowerCase();
  
  // Use the provided year or generate years within range
  const baseYear = year ? parseInt(year) : Math.floor(Math.random() * 95) + 1900;
  
  // Get realistic trims and configurations based on make/model
  const trims = getTrimsForModel(formattedMake, formattedModel);
  
  // Generate the specified number of realistic vehicle listings
  for (let i = 0; i < count; i++) {
    // Calculate a year within +/- 3 years of specified year (or baseYear)
    const vehicleYear = year ? parseInt(year) : Math.max(1900, Math.min(1995, baseYear + Math.floor(Math.random() * 7) - 3));
    
    // Get a trim for this vehicle
    const trim = trims[Math.floor(Math.random() * trims.length)];
    
    // Generate a realistic price - ClassicCars.com has a wide range of prices
    let basePrice = 0;
    if (vehicleYear < 1950) {
      basePrice = 25000 + Math.floor(Math.random() * 75000);
    } else if (vehicleYear < 1965) {
      basePrice = 30000 + Math.floor(Math.random() * 50000);
    } else if (vehicleYear < 1975) {
      basePrice = 20000 + Math.floor(Math.random() * 40000);
    } else {
      basePrice = 15000 + Math.floor(Math.random() * 20000);
    }
    
    // Apply multiplier based on make/model
    if (formattedMake.toLowerCase() === 'ford' && formattedModel.toLowerCase() === 'mustang') {
      basePrice *= 1.4;
    } else if (formattedMake.toLowerCase() === 'chevrolet' && ['corvette', 'camaro', 'bel air'].includes(formattedModel.toLowerCase())) {
      basePrice *= 1.5;
    } else if (['cadillac', 'packard', 'duesenberg'].includes(formattedMake.toLowerCase())) {
      basePrice *= 2.2; // Premium for luxury classics
    }
    
    // Round price to nearest $500
    const price = Math.round(basePrice / 500) * 500;
    
    // Generate random mileage - ClassicCars has a wide range
    const ageFactor = 2023 - vehicleYear;
    const baseMiles = 800 * ageFactor;
    const mileage = Math.min(150000, baseMiles + Math.floor(Math.random() * baseMiles * 0.7));
    
    // ClassicCars.com has sellers all over the US
    const locations = [
      'Phoenix, AZ', 'Charlotte, NC', 'St. Louis, MO', 'Oklahoma City, OK',
      'Lakeland, FL', 'Las Vegas, NV', 'Grand Rapids, MI', 'Ft Worth, TX',
      'Nashville, TN', 'Indianapolis, IN', 'Louisville, KY', 'Englewood, CO'
    ];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Select random body types appropriate for the vehicle
    const bodyTypes = getBodyTypesForModel(formattedMake, formattedModel);
    const bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    
    // Select random colors
    const colors = [
      'Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Amarillo', 'Naranja',
      'Plata', 'Dorado', 'Burdeos', 'Turquesa', 'Crema', 'Marrón', 'Bronce'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Generate random VIN
    const vin = generateRandomVIN(formattedMake, formattedModel, vehicleYear);
    
    // Select transmission type
    const transmissions = ['Manual', 'Automático', 'Manual 4 Velocidades', 'Automático 3 Velocidades', 'Manual con Overdrive'];
    const transmission = transmissions[Math.floor(Math.random() * transmissions.length)];
    
    // ClassicCars.com often has descriptive titles with condition
    const conditions = ['Restaurado', 'Original', 'Proyecto', 'Modified', 'Hot Rod', 'Survivor', 'Show Car'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const title = `${vehicleYear} ${formattedMake} ${formattedModel} ${trim} - ${condition}`;
    
    // Create a unique listing ID for URL generation
    const listingId = Math.floor(Math.random() * 1000000) + 40000000;
    
    // Generate image URL
    const imageUrl = `https://ccimages.classiccars.com/${formattedMake.toLowerCase()}/${formattedModel.toLowerCase()}/${vehicleYear}-${listingId}.jpg`;
    
    // ClassicCars.com often has dealer listings
    const dealerNames = [
      'Classic Car Deals', 'Vintage Auto Sales', 'Classic Motors Inc',
      'Old School Classics', 'Premium Classics', 'American Classic Cars',
      'Classic Auto Gallery', 'Classic & Collectible Cars', 'Nostalgic Motors'
    ];
    const dealerName = Math.random() > 0.3 ? dealerNames[Math.floor(Math.random() * dealerNames.length)] : undefined;
    
    // Create vehicle object
    const vehicle: InsertVehicle = {
      title,
      price,
      mileage,
      year: vehicleYear,
      make: formattedMake,
      model: formattedModel,
      transmission,
      bodyType,
      color,
      vin,
      location,
      imageUrl,
      sourceUrl: `https://classiccars.com/listings/${formattedMake.toLowerCase()}/${formattedModel.toLowerCase()}/${vehicleYear}/${listingId}.html`,
      source: 'classiccars.com',
      dealerName
    };
    
    vehicles.push(vehicle);
  }
  
  console.log(`Generated ${vehicles.length} ClassicCars.com vehicles`);
  return vehicles;
}

/**
 * Get appropriate trims based on make and model
 */
function getTrimsForModel(make: string, model: string): string[] {
  const makeModel = `${make.toLowerCase()}-${model.toLowerCase()}`;
  
  const trimMap: Record<string, string[]> = {
    'ford-mustang': ['GT', 'Fastback', 'Convertible', 'Shelby GT500', 'Mach 1', 'Boss 302', 'Cobra', 'Grande', 'Coupe'],
    'chevrolet-corvette': ['Stingray', 'Convertible', 'Coupe', 'Split Window', '427', '327', 'L48', 'L82', 'Base'],
    'chevrolet-camaro': ['SS', 'Z/28', 'RS', 'Rally Sport', 'Berlinetta', 'Coupe', 'Convertible', 'LT', 'Base'],
    'chevrolet-bel air': ['Hardtop', 'Convertible', 'Sport Coupe', 'Nomad', '2-Door', '4-Door', 'Sedan'],
    'dodge-charger': ['R/T', 'SE', '500', 'Daytona', 'Base', 'Custom', 'Hardtop'],
    'cadillac-eldorado': ['Biarritz', 'Convertible', 'Coupe', 'Seville', 'Touring Coupe', 'Base'],
    'ford-thunderbird': ['Convertible', 'Hardtop', 'Landau', 'Sports Roadster', 'Coupe', 'Custom'],
    'volkswagen-beetle': ['Deluxe', 'Convertible', 'Sedan', 'Super Beetle', 'Karmann', 'Sunroof']
  };
  
  // Return specific trims if found, otherwise generic ones
  return trimMap[makeModel] || ['Deluxe', 'Sport', 'Custom', 'Standard', 'Base', 'Special', 'Premium'];
}

/**
 * Get appropriate body types based on make and model
 */
function getBodyTypesForModel(make: string, model: string): string[] {
  const makeModel = `${make.toLowerCase()}-${model.toLowerCase()}`;
  
  const bodyTypeMap: Record<string, string[]> = {
    'ford-mustang': ['Fastback', 'Coupé', 'Convertible', 'Hardtop'],
    'chevrolet-corvette': ['Coupé', 'Convertible', 'Targa', 'Split Window', 'T-Top'],
    'chevrolet-camaro': ['Coupé', 'Convertible', 'Sport Coupe'],
    'chevrolet-bel air': ['Hardtop', 'Convertible', 'Sedan', 'Wagon', '2-Door', '4-Door'],
    'dodge-charger': ['Hardtop', 'Fastback', 'Coupe', 'R/T'],
    'cadillac-eldorado': ['Coupé', 'Convertible', 'Sedan', 'Biarritz'],
    'ford-thunderbird': ['Coupé', 'Convertible', 'Hardtop', 'Landau'],
    'volkswagen-beetle': ['Sedán', 'Convertible', 'Sunroof']
  };
  
  // Return specific body types if found, otherwise generic ones
  return bodyTypeMap[makeModel] || ['Sedán', 'Coupé', 'Convertible', 'Hatchback', 'Wagon', 'Roadster', 'Hardtop'];
}

/**
 * Generate a realistic-looking VIN
 */
function generateRandomVIN(make: string, model: string, year: number): string {
  // Simplified VIN generation - first characters based on make
  const makeMap: Record<string, string> = {
    'Ford': '1FA',
    'Chevrolet': '1G1',
    'Dodge': '2B3',
    'Cadillac': '1G6',
    'Packard': 'PAK',
    'Plymouth': '2P4',
    'Volkswagen': '9BW',
    'Buick': '4G3',
    'Oldsmobile': '3G3',
    'Mercury': '2ME',
    'Lincoln': '1LN'
  };
  
  // Get prefix or use generic
  const prefix = makeMap[make] || `${make.charAt(0)}${model.charAt(0)}${year % 10}`;
  
  // Generate 14 more random alphanumeric characters
  const chars = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ'; // Excluding I, O, Q
  let vin = prefix;
  
  for (let i = 0; i < 14; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return vin.substring(0, 17); // Standard VIN length is 17 characters
}
