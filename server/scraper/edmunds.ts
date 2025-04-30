import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '@shared/schema';

export async function scrapeEdmunds(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    // Construir la URL de forma más directa, siguiendo el formato actual de Edmunds
    const yearParam = year ? `${year}-${year}` : '';
    const makeEncoded = encodeURIComponent(make.toLowerCase());
    const modelEncoded = encodeURIComponent(model.toLowerCase());
    
    // URL mejorada siguiendo el formato actual de Edmunds
    // Formato: make/model/year/used/ - por ejemplo: ford/mustang/1967/used/
    const url = `https://www.edmunds.com/${makeEncoded}/${modelEncoded}/${yearParam ? yearParam + '/' : ''}used/`;
    
    console.log(`Scraping Edmunds URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.edmunds.com/',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000, // Tiempo de espera más largo (30 segundos)
    });
    
    const $ = cheerio.load(response.data);
    const results: InsertVehicle[] = [];
    
    // Buscar datos JSON incrustados en la página
    console.log('Buscando datos JSON en la página de Edmunds...');
    let jsonData = null;
    const scriptTags = $('script').toArray();
    
    for (const scriptTag of scriptTags) {
      const scriptContent = $(scriptTag).html() || '';
      
      // Buscar por diferentes patrones de datos
      if (scriptContent.includes('window.__INITIAL_STATE__')) {
        try {
          const dataMatch = scriptContent.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
          if (dataMatch && dataMatch[1]) {
            jsonData = JSON.parse(dataMatch[1]);
            console.log('Encontrados datos en INITIAL_STATE');
            break;
          }
        } catch (e) {
          console.error('Error parsing INITIAL_STATE JSON:', e);
        }
      }
      
      if (scriptContent.includes('window.__BONNET_DATA__')) {
        try {
          const dataMatch = scriptContent.match(/window\.__BONNET_DATA__\s*=\s*({.*?});/s);
          if (dataMatch && dataMatch[1]) {
            jsonData = JSON.parse(dataMatch[1]);
            console.log('Encontrados datos en BONNET_DATA');
            break;
          }
        } catch (e) {
          console.error('Error parsing BONNET_DATA JSON:', e);
        }
      }
      
      if (scriptContent.includes('window.__PRELOADED_STATE__')) {
        try {
          const dataMatch = scriptContent.match(/window\.__PRELOADED_STATE__\s*=\s*({.*?});/s);
          if (dataMatch && dataMatch[1]) {
            jsonData = JSON.parse(dataMatch[1]);
            console.log('Encontrados datos en PRELOADED_STATE');
            break;
          }
        } catch (e) {
          console.error('Error parsing PRELOADED_STATE JSON:', e);
        }
      }
    }
    
    // Intentar extraer vehículos del JSON si lo encontramos
    if (jsonData) {
      console.log('Procesando datos JSON encontrados...');
      
      // Navegamos por diferentes estructuras de datos posibles
      let vehicles = [];
      
      // Intentar diferentes rutas de acceso a los datos según la estructura
      if (jsonData.inventory && jsonData.inventory.vehicles) {
        vehicles = jsonData.inventory.vehicles;
      } else if (jsonData.vehicleListings) {
        vehicles = jsonData.vehicleListings;
      } else if (jsonData.initialResults && jsonData.initialResults.vehicles) {
        vehicles = jsonData.initialResults.vehicles;
      } else if (jsonData.page && jsonData.page.vehicles) {
        vehicles = jsonData.page.vehicles;
      } else {
        // Buscar recursivamente en el objeto
        const findVehicles = (obj: any, path: string[] = []): any[] => {
          if (!obj || typeof obj !== 'object') return [];
          
          if (Array.isArray(obj) && obj.length > 0 && 
              typeof obj[0] === 'object' && 
              (obj[0].make || obj[0].model || obj[0].year || obj[0].price)) {
            console.log(`Encontrados posibles vehículos en ruta: ${path.join('.')}`);
            return obj;
          }
          
          for (const key in obj) {
            const result = findVehicles(obj[key], [...path, key]);
            if (result.length > 0) return result;
          }
          
          return [];
        };
        
        vehicles = findVehicles(jsonData);
      }
      
      console.log(`Encontrados ${vehicles.length} vehículos en datos JSON`);
      
      for (const vehicle of vehicles) {
        // Verificar si este vehículo coincide con nuestros criterios
        const vehicleMake = (vehicle.make || '').toLowerCase();
        const vehicleModel = (vehicle.model || '').toLowerCase();
        const vehicleYear = vehicle.year?.toString() || '';
        
        if (vehicleMake.includes(make.toLowerCase()) && 
            vehicleModel.includes(model.toLowerCase()) &&
            (!year || vehicleYear.includes(year))) {
          
          let title = '';
          if (vehicle.year && vehicle.make && vehicle.model) {
            title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim();
          } else {
            title = vehicle.title || `${make} ${model} ${year || ''}`.trim();
          }
          
          // Extraer URL de la imagen con múltiples respaldos
          let imageUrl = '';
          if (vehicle.photos && vehicle.photos.primary && vehicle.photos.primary.url) {
            imageUrl = vehicle.photos.primary.url;
          } else if (vehicle.photoInfo && vehicle.photoInfo.large) {
            imageUrl = vehicle.photoInfo.large;
          } else if (vehicle.photoInfo && vehicle.photoInfo.thumbnail) {
            imageUrl = vehicle.photoInfo.thumbnail;
          } else if (vehicle.images && vehicle.images.length > 0) {
            imageUrl = vehicle.images[0].url || vehicle.images[0];
          } else if (vehicle.image) {
            imageUrl = vehicle.image;
          } else if (vehicle.photoUrl) {
            imageUrl = vehicle.photoUrl;
          }
          
          // URL de la fuente
          let sourceUrl = '';
          if (vehicle.link) {
            sourceUrl = vehicle.link.startsWith('http') ? vehicle.link : `https://www.edmunds.com${vehicle.link}`;
          } else if (vehicle.url) {
            sourceUrl = vehicle.url.startsWith('http') ? vehicle.url : `https://www.edmunds.com${vehicle.url}`;
          } else if (vehicle.detailsUrl) {
            sourceUrl = vehicle.detailsUrl.startsWith('http') ? vehicle.detailsUrl : `https://www.edmunds.com${vehicle.detailsUrl}`;
          } else {
            // Construir URL basada en los detalles del vehículo
            sourceUrl = `https://www.edmunds.com/${makeEncoded}/${modelEncoded}/${vehicleYear}/used/vin-${vehicle.vin || 'unknown'}/`;
          }
          
          results.push({
            title,
            price: vehicle.price || vehicle.salePrice || vehicle.msrp || undefined,
            year: vehicle.year || extractYear(title),
            make: vehicle.make || make,
            model: vehicle.model || model,
            mileage: vehicle.mileage || vehicle.odometer || undefined,
            location: vehicle.dealerLocation || vehicle.distance?.label || vehicle.location || 'Unknown',
            imageUrl,
            sourceUrl,
            source: 'edmunds',
            transmission: vehicle.transmission || undefined,
            fuelType: vehicle.fuel || vehicle.fuelType || 'Gasoline',
            bodyType: vehicle.bodyStyle || vehicle.bodyType || undefined,
            color: vehicle.exteriorColor || vehicle.color || undefined,
            vin: vehicle.vin || undefined,
            hasDeals: Boolean(vehicle.specialOffers?.length > 0 || vehicle.isSpecial || vehicle.hasDeal || vehicle.hasSpecialOffer),
            dealerName: vehicle.dealerName || vehicle.dealer?.name || undefined,
          });
        }
      }
    } else {
      console.log('No se encontraron datos JSON estructurados, intentando con HTML...');
    }
    
    // Si aún no tenemos resultados, intentamos con el DOM
    if (results.length === 0) {
      console.log('Realizando extracción del DOM HTML...');
      
      // Intentar con varios selectores diferentes que podrían contener listados de vehículos
      const selectors = [
        '.vehicle-card', // Selector común para tarjetas de vehículos
        '.inventory-listing',
        '.vehicle-listing',
        '.srp-listing',
        '.usedListing',
        '.vehicle-details',
        '[data-test="vehicleCard"]',
        '[data-test="vehicleListing"]',
        '.d-vehicle-card',
        '.vehicle-card-with-reviews'
      ];
      
      for (const selector of selectors) {
        console.log(`Probando selector: ${selector}`);
        const items = $(selector);
        
        if (items.length > 0) {
          console.log(`Encontrados ${items.length} elementos con selector ${selector}`);
          
          items.each((index, element) => {
            // Intentar extraer título de diferentes formas
            let title = '';
            const titleSelectors = [
              '.title', '.vehicle-title', '.vehicle-header', 'h2', 'h3', 
              '[data-test="vehicleTitle"]', '.vehicle-card-title'
            ];
            
            for (const titleSelector of titleSelectors) {
              const foundTitle = $(element).find(titleSelector).first().text().trim();
              if (foundTitle) {
                title = foundTitle;
                break;
              }
            }
            
            // Si no hay título pero hay make y model, podemos construirlo
            if (!title) {
              const makeText = $(element).find('[data-test="vehicleMake"]').text().trim();
              const modelText = $(element).find('[data-test="vehicleModel"]').text().trim();
              const yearText = $(element).find('[data-test="vehicleYear"]').text().trim();
              
              if (makeText || modelText || yearText) {
                title = `${yearText} ${makeText} ${modelText}`.trim();
              }
            }
            
            if (!title || !isRelevantListing(title, make, model, year)) {
              return; // Pasar al siguiente elemento
            }
            
            // Extraer precio
            let price: number | undefined;
            const priceSelectors = [
              '.price', '.vehicle-price', '.pricing', '[data-test="vehiclePrice"]',
              '.vehicle-card-price', '.payment-price'
            ];
            
            for (const priceSelector of priceSelectors) {
              const priceText = $(element).find(priceSelector).first().text().trim();
              price = extractPrice(priceText);
              if (price) break;
            }
            
            // Extraer URL de imagen
            let imageUrl = '';
            const imgElement = $(element).find('img').first();
            imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
            
            // Extraer URL de origen
            let sourceUrl = '';
            const linkElement = $(element).find('a').first();
            const href = linkElement.attr('href') || '';
            sourceUrl = href.startsWith('http') ? href : `https://www.edmunds.com${href}`;
            
            // Extraer ubicación
            let location = 'Unknown';
            const locationSelectors = [
              '.dealer-location', '.location', '.vehicle-location',
              '[data-test="vehicleLocation"]', '.vehicle-card-location'
            ];
            
            for (const locationSelector of locationSelectors) {
              const foundLocation = $(element).find(locationSelector).first().text().trim();
              if (foundLocation) {
                location = foundLocation;
                break;
              }
            }
            
            // Extraer todos los textos para buscar detalles
            const allText = $(element).text().trim();
            
            results.push({
              title,
              price,
              year: extractYear(title) || (year ? parseInt(year) : undefined),
              make,
              model,
              mileage: extractMileage(allText),
              location,
              imageUrl,
              sourceUrl,
              source: 'edmunds',
              transmission: extractTransmission(allText),
              fuelType: extractFuelType(allText),
              bodyType: extractBodyType(allText),
              color: extractColor(allText),
              vin: extractVIN(allText),
              hasDeals: $(element).find('.special-offer-badge, .special-deal, .special-offer').length > 0,
              dealerName: $(element).find('.dealer-name, .dealership').text().trim() || undefined,
            });
          });
          
          // Si encontramos resultados con este selector, terminamos
          if (results.length > 0) {
            console.log(`Extraídos ${results.length} vehículos del DOM HTML`);
            break;
          }
        }
      }
    }
    
    // Si seguimos sin resultados, intentar crear al menos un resultado de muestra basado en la página
    if (results.length === 0) {
      console.log('Intentando extraer al menos información básica sobre el modelo...');
      
      const pageTitle = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      if (pageTitle.toLowerCase().includes(make.toLowerCase()) ||
          metaDescription.toLowerCase().includes(make.toLowerCase())) {
          
        // Buscar cualquier imagen relacionada con un vehículo
        let imageUrl = '';
        $('img').each((i, img) => {
          const src = $(img).attr('src') || '';
          const alt = $(img).attr('alt') || '';
          if ((src.includes('vehicle') || src.includes('car') || src.includes('/media/')) && 
              (alt.toLowerCase().includes(make.toLowerCase()) || alt.toLowerCase().includes(model.toLowerCase()))) {
            imageUrl = src;
            return false; // Salir del bucle each
          }
        });
        
        results.push({
          title: `${year || ''} ${make} ${model}`.trim(),
          price: undefined,
          year: year ? parseInt(year) : undefined,
          make,
          model,
          mileage: undefined,
          location: 'Various Locations',
          imageUrl,
          sourceUrl: url,
          source: 'edmunds',
          transmission: undefined,
          fuelType: 'Gasoline',
          bodyType: undefined,
          color: undefined,
          vin: undefined,
          hasDeals: false,
          dealerName: 'Edmunds Listings',
        });
        
        console.log('Creado un resultado basado en información general de la página');
      }
    }
    
    console.log(`Scraping de Edmunds completado con ${results.length} resultados`);
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
