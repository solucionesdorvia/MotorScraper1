import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '@shared/schema';

export async function scrapeEdmunds(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    const yearParam = year ? `${year}-${year}` : '';
    const url = `https://www.edmunds.com/inventory/srp.html?inventorytype=cpo%2Cused&year=${yearParam}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(make)}%7C${encodeURIComponent(model)}&radius=100`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.edmunds.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });
    
    const $ = cheerio.load(response.data);
    const results: InsertVehicle[] = [];
    
    // Look for JSON data in the page which often contains the inventory
    let jsonData = null;
    try {
      // Edmunds often includes a data object in script tags that has all the vehicle data
      $('script').each((index, element) => {
        const scriptContent = $(element).html() || '';
        if (scriptContent.includes('window.__PRELOADED_STATE__')) {
          const dataMatch = scriptContent.match(/window\.__PRELOADED_STATE__\s*=\s*({.*?});/s);
          if (dataMatch && dataMatch[1]) {
            jsonData = JSON.parse(dataMatch[1]);
          }
        }
      });
    } catch (e) {
      console.error('Error parsing Edmunds JSON data:', e);
    }
    
    // If we have JSON data, extract vehicles from it
    if (jsonData && jsonData.inventory && jsonData.inventory.vehicles) {
      const vehicles = jsonData.inventory.vehicles;
      for (const vehicle of vehicles) {
        const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim();
        
        results.push({
          title,
          price: vehicle.price,
          year: vehicle.year,
          make,
          model,
          mileage: vehicle.mileage,
          location: vehicle.dealerLocation || vehicle.distance?.label || 'Unknown',
          imageUrl: vehicle.photos?.primary?.url || vehicle.photoInfo?.thumbnail || vehicle.photoInfo?.large || '',
          sourceUrl: `https://www.edmunds.com${vehicle.link}`,
          source: 'edmunds',
          transmission: vehicle.transmission || undefined,
          fuelType: vehicle.fuel || 'Gasoline',
          bodyType: vehicle.bodyStyle || undefined,
          color: vehicle.exteriorColor || undefined,
          vin: vehicle.vin || undefined,
          hasDeals: vehicle.specialOffers?.length > 0 || false,
          dealerName: vehicle.dealerName || undefined,
        });
      }
    } else {
      // Fallback to DOM parsing if JSON data isn't available
      $('.inventory-listing').each((index, element) => {
        const titleElement = $(element).find('.inventory-listing-title');
        const title = titleElement.text().trim();
        
        // Skip if it's not a vehicle listing or doesn't match our criteria
        if (!title || !isRelevantListing(title, make, model, year)) {
          return;
        }
        
        // Extract all available data
        const priceText = $(element).find('.inventory-listing-price').text().trim();
        const price = extractPrice(priceText);
        
        // Try multiple different selectors for the image
        let imageUrl = $(element).find('.inventory-listing-image img').attr('src');
        
        if (!imageUrl) {
          // Try other image selectors
          imageUrl = $(element).find('.vehicle-image img').attr('src');
        }
        
        if (!imageUrl) {
          // Fallback to any image within the listing
          imageUrl = $(element).find('img').attr('src');
        }
        
        imageUrl = imageUrl || '';
        const sourceUrl = 'https://www.edmunds.com' + ($(element).find('a.inventory-listing-link').attr('href') || '');
        
        // Extract location
        const location = $(element).find('.dealer-location').text().trim() || 'Unknown';
        
        // Extract other details
        const detailsText = $(element).find('.inventory-listing-details').text().trim();
        const mileage = extractMileage(detailsText);
        const transmission = extractTransmission(detailsText);
        const bodyType = extractBodyType(detailsText);
        const fuelType = extractFuelType(detailsText);
        const color = extractColor(detailsText);
        const vin = extractVIN(detailsText);
        
        // Extract year from title
        const extractedYear = extractYear(title);
        
        // Check for deals/sales badges
        const hasDeals = $(element).find('.special-offer-badge').length > 0;
        
        // Get dealer name
        const dealerName = $(element).find('.dealer-name').text().trim();
        
        results.push({
          title,
          price,
          year: extractedYear,
          make,
          model,
          mileage,
          location,
          imageUrl,
          sourceUrl,
          source: 'edmunds',
          transmission,
          fuelType,
          bodyType,
          color,
          vin,
          hasDeals,
          dealerName,
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error scraping Edmunds:', error);
    return [];
  }
}

// Helper functions - similar to eBay scraper with some adjustments

function isRelevantListing(title: string, make: string, model: string, year?: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerMake = make.toLowerCase();
  const lowerModel = model.toLowerCase();
  
  // Check if title contains both make and model
  const hasMakeAndModel = lowerTitle.includes(lowerMake) && lowerTitle.includes(lowerModel);
  
  // If year is provided, check if title contains year
  if (year) {
    return hasMakeAndModel && lowerTitle.includes(year);
  }
  
  return hasMakeAndModel;
}

function extractPrice(priceText: string): number | undefined {
  const match = priceText.match(/\$([0-9,]+(\.[0-9]{2})?)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return undefined;
}

function extractMileage(text: string): number | undefined {
  const match = text.match(/(\d{1,3}(,\d{3})*)\s*mi(les)?/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return undefined;
}

function extractTransmission(text: string): string | undefined {
  if (text.match(/automatic/i)) return 'Automatic';
  if (text.match(/manual/i)) return 'Manual';
  if (text.match(/CVT/i)) return 'CVT';
  return undefined;
}

function extractBodyType(text: string): string | undefined {
  if (text.match(/coupe/i)) return 'Coupe';
  if (text.match(/convertible/i)) return 'Convertible';
  if (text.match(/sedan/i)) return 'Sedan';
  if (text.match(/hatchback/i)) return 'Hatchback';
  if (text.match(/SUV/i)) return 'SUV';
  if (text.match(/truck/i)) return 'Truck';
  if (text.match(/van/i)) return 'Van';
  if (text.match(/wagon/i)) return 'Wagon';
  if (text.match(/fastback/i)) return 'Fastback';
  return undefined;
}

function extractFuelType(text: string): string | undefined {
  if (text.match(/gasoline/i)) return 'Gasoline';
  if (text.match(/diesel/i)) return 'Diesel';
  if (text.match(/electric/i)) return 'Electric';
  if (text.match(/hybrid/i)) return 'Hybrid';
  return 'Gasoline'; // Default to gasoline for car listings
}

function extractColor(text: string): string | undefined {
  const colors = ['black', 'white', 'silver', 'gray', 'red', 'blue', 'green', 'yellow', 'orange'];
  for (const color of colors) {
    if (text.toLowerCase().includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }
  return undefined;
}

function extractVIN(text: string): string | undefined {
  const match = text.match(/VIN\s*:?\s*([A-Z0-9]{17})/i);
  if (match) {
    return match[1];
  }
  return undefined;
}

function extractYear(text: string): number | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return undefined;
}
