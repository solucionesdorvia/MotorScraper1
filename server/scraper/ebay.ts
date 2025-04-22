import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '@shared/schema';

export async function scrapeEbay(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    const query = `${make} ${model} ${year || ''}`.trim();
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&_from=R40&_trksid=m570.l1313`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.ebay.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });
    
    const $ = cheerio.load(response.data);
    const results: InsertVehicle[] = [];
    
    // Process search results - adjust selectors based on eBay's HTML structure
    // This is based on the attached HTML sample structure
    $('.s-item__wrapper').each((index, element) => {
      if (index === 0) return; // Skip the first item which is often a "Shop on eBay" header
      
      const title = $(element).find('.s-item__title').text().trim();
      
      // Skip if it's not a vehicle listing or doesn't match our criteria
      if (!title || !isRelevantListing(title, make, model, year)) {
        return;
      }
      
      // Extract all available data
      const priceText = $(element).find('.s-item__price').text().trim();
      const price = extractPrice(priceText);
      
      // Try multiple different selectors for the image
      let imageUrl = $(element).find('.s-item__image-img').attr('src');
      
      if (!imageUrl || imageUrl.includes('s-l225')) {
        // Try to get a higher resolution image
        imageUrl = $(element).find('.s-item__image-img').attr('data-src');
      }
      
      if (!imageUrl) {
        // Fallback to any image tag within the item
        imageUrl = $(element).find('img').attr('src');
      }
      
      imageUrl = imageUrl || '';
      const sourceUrl = $(element).find('.s-item__link').attr('href') || '';
      
      // Extract location from subtitle or shipping info
      const subtitle = $(element).find('.s-item__subtitle').text().trim();
      const location = extractLocation(subtitle) || 'Unknown';
      
      // Extract other details when available
      const itemDetails = $(element).find('.s-item__details').text();
      const mileage = extractMileage(itemDetails);
      const transmission = extractTransmission(itemDetails);
      const bodyType = extractBodyType(title);
      const fuelType = extractFuelType(itemDetails);
      const color = extractColor(itemDetails);
      const vin = extractVIN(itemDetails);
      
      // Extract year from title
      const extractedYear = extractYear(title);
      
      // Check for deals/sales badges
      const hasDeals = $(element).find('.s-item__deal-flag').length > 0;
      
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
        source: 'ebay',
        transmission,
        fuelType,
        bodyType,
        color,
        vin,
        hasDeals,
        dealerName: extractDealerName(itemDetails),
      });
    });
    
    return results;
  } catch (error) {
    console.error('Error scraping eBay:', error);
    return [];
  }
}

// Helper functions to extract data from text

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

function extractLocation(text: string): string | undefined {
  // Location is often in format "Located in: City, State" or "From: City, State"
  const match = text.match(/(?:Located in|From):\s*([^,]+,\s*[A-Z]{2})/i);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

function extractDealerName(text: string): string | undefined {
  const match = text.match(/Seller:\s*([^|]+)/i);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}
