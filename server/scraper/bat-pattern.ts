/**
 * SCRAPER PARA BRING A TRAILER BASADO EN EL PATRÓN HTML
 * 
 * Este scraper está diseñado para extraer datos reales de las subastas activas 
 * utilizando exactamente el mismo patrón HTML que se encuentra en el sitio.
 * Basado en el HTML proporcionado por el usuario.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { InsertVehicle } from "@shared/schema";

// Interfaces para resolver problemas con los tipos de Cheerio
type CheerioElement = any;
type CheerioAPI = ReturnType<typeof cheerio.load>;

/**
 * Extrae subastas activas de Bring a Trailer utilizando el patrón HTML exacto
 */
export async function scrapeBringATrailerPattern(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Extrayendo subastas activas de Bring a Trailer para: ${make} ${model} ${year || ''}`);
    console.log('Usando scraper basado en el patrón HTML exacto de las subastas activas');
    
    // URL principal de búsqueda
    const mainUrl = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${mainUrl}`);
    
    // URL directa a subastas activas
    const activeAuctionsUrl = buildActiveUrl(make, model, year);
    console.log(`URL directa a subastas activas: ${activeAuctionsUrl}`);
    
    // Intentar primero con la URL específica para subastas activas
    let html = '';
    try {
      const response = await axios.get(activeAuctionsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://bringatrailer.com/',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        }
      });
      html = response.data;
      console.log('✅ Obtenido HTML de la URL de subastas activas');
    } catch (error) {
      console.error('Error obteniendo la URL de subastas activas:', error);
      
      // Si falla, intentar con la URL principal
      try {
        const mainResponse = await axios.get(mainUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://bringatrailer.com/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
          }
        });
        html = mainResponse.data;
        console.log('✅ Obtenido HTML de la URL principal como respaldo');
      } catch (mainError) {
        console.error('Error obteniendo la URL principal:', mainError);
        return [];
      }
    }
    
    // Extraer datos de las subastas activas del HTML
    const vehicles = extractLiveVehicles(html, make, model, year);
    console.log(`Extraídos ${vehicles.length} vehículos de subastas activas`);
    
    return vehicles;
  } catch (error) {
    console.error('Error extraiendo subastas activas:', error);
    return [];
  }
}

/**
 * Extrae vehículos con subastas activas del HTML
 */
function extractLiveVehicles(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const $ = cheerio.load(html);
  const vehicles: InsertVehicle[] = [];
  
  // Método 1: Buscar primero en la sección "Live Listings" específica
  console.log('Método 1: Buscando en la sección de "Live Listings"...');
  const liveListingsSection = $('.search-result-live-listings, #search-result-live-listings');
  
  if (liveListingsSection.length > 0) {
    console.log('✅ Encontrada sección "Live Listings"');
    
    // Buscar listados dentro de la sección Live Listings
    const liveListings = liveListingsSection.find('a.listing-card');
    console.log(`Encontrados ${liveListings.length} listados en la sección Live Listings`);
    
    liveListings.each((index: number, element: CheerioElement) => {
      const vehicle = extractVehicleFromCard($, element, make, model, year);
      if (vehicle) {
        console.log(`Procesado vehículo #${index + 1}: ${vehicle.title}`);
        vehicles.push(vehicle);
      }
    });
  } else {
    console.log('❌ No se encontró la sección "Live Listings"');
  }
  
  // Método 2: Si no se encuentra la sección Live Listings o no hay resultados, buscar en toda la página
  if (vehicles.length === 0) {
    console.log('Método 2: Buscando en toda la página por listados activos...');
    
    // Buscar cualquier div search-result-listings
    const searchResultListings = $('.search-result-listings, #search-result-listings');
    
    if (searchResultListings.length > 0) {
      console.log('✅ Encontrada sección "search-result-listings"');
      
      // Buscar tarjetas de listado con elemento item-bidding (indica subasta activa)
      // Nota: evitamos usar :visible que no es compatible con cheerio
      const activeListings = searchResultListings.find('a.listing-card').filter(function(this: any) {
        return $(this).find('.item-bidding, .item-bidding[style*="display: block"], .item-bidding:not([style*="display: none"])').length > 0;
      });
      
      console.log(`Encontrados ${activeListings.length} listados activos en la búsqueda general`);
      
      activeListings.each((index: number, element: CheerioElement) => {
        const vehicle = extractVehicleFromCard($, element, make, model, year);
        if (vehicle) {
          console.log(`Procesado vehículo #${index + 1}: ${vehicle.title}`);
          vehicles.push(vehicle);
        }
      });
    } else {
      console.log('❌ No se encontró ninguna sección "search-result-listings"');
    }
  }
  
  // Filtrar solo los vehículos relevantes para la búsqueda
  const relevantVehicles = vehicles.filter(vehicle => 
    isRelevant(vehicle.title, make, model, year)
  );
  
  console.log(`Total de vehículos relevantes: ${relevantVehicles.length} de ${vehicles.length} encontrados`);
  
  return relevantVehicles;
}

/**
 * Extrae los datos de un vehículo desde una tarjeta de listado
 */
function extractVehicleFromCard($: CheerioAPI, element: CheerioElement, make: string, model: string, year?: string): InsertVehicle | null {
  const $el = $(element);
  
  // Extraer información básica
  const title = $el.find('h3').text().trim();
  const link = $el.attr('href') || '';
  const image = $el.find('.thumbnail img').attr('src') || '';
  const description = $el.find('.item-excerpt').text().trim();
  
  // Si no hay título o enlace, descartar
  if (!title || !link) {
    console.log('❌ Listado descartado: Sin título o enlace');
    return null;
  }
  
  // Extraer precio actual
  let price: number | null = null;
  const bidFormatted = $el.find('.bid-formatted').text().trim();
  
  if (bidFormatted) {
    // Varios formatos posibles: USD $25,000 o $25,000 o 25,000
    const priceMatch = bidFormatted.match(/USD\s+\$(\d{1,3}(,\d{3})*|\d+)/) || 
                        bidFormatted.match(/\$(\d{1,3}(,\d{3})*|\d+)/) ||
                        bidFormatted.match(/(\d{1,3}(,\d{3})*|\d+)/);
    
    if (priceMatch && priceMatch[1]) {
      price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    }
  }
  
  // Extraer tiempo restante
  let timeRemaining = $el.find('.countdown-text').text().trim();
  let endsIn = 'En curso';
  
  if (timeRemaining) {
    if (timeRemaining.includes('day')) {
      const days = timeRemaining.match(/(\d+)/);
      if (days && days[1]) {
        endsIn = days[1] === '1' ? '1 día' : `${days[1]} días`;
      }
    } else if (timeRemaining.includes('hour')) {
      const hours = timeRemaining.match(/(\d+)/);
      if (hours && hours[1]) {
        endsIn = hours[1] === '1' ? '1 hora' : `${hours[1]} horas`;
      }
    } else if (timeRemaining.includes('min')) {
      const mins = timeRemaining.match(/(\d+)/);
      if (mins && mins[1]) {
        endsIn = mins[1] === '1' ? '1 minuto' : `${mins[1]} minutos`;
      }
    }
  }
  
  // Extraer año del título
  const yearMatch = title.match(/(19\d{2}|20\d{2})/);
  const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
  
  // Determinar información adicional basada en el título
  const bodyType = extractBodyType(title);
  const transmission = extractTransmission(title);
  
  // Crear objeto de vehículo
  const vehicle: InsertVehicle = {
    title,
    make,
    model,
    source: 'bringatrailer',
    sourceUrl: link.startsWith('http') ? link : `https://bringatrailer.com${link}`,
    imageUrl: image || 'https://i.imgur.com/U45aNlT.jpg',
    year: extractedYear,
    price,
    isAuction: true,
    currentBid: price,
    endsIn,
    transmission,
    bodyType,
    location: 'Estados Unidos',
    mileage: null,
    color: null,
    vin: null,
    fuelType: null,
    dealerName: null,
    hasDeals: false
  };
  
  return vehicle;
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildUrl(make: string, model: string, year?: string): string {
  const query = `${make} ${model}${year ? ' ' + year : ''}`;
  const encodedQuery = encodeURIComponent(query);
  return `https://bringatrailer.com/search/?s=${encodedQuery}`;
}

/**
 * Construye la URL directa a subastas activas
 */
function buildActiveUrl(make: string, model: string, year?: string): string {
  const query = `${make} ${model}${year ? ' ' + year : ''}`;
  const encodedQuery = encodeURIComponent(query);
  return `https://bringatrailer.com/search/auction-results/?s=${encodedQuery}&status=open`;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Comprobar que el título contiene la marca y el modelo
  const hasMake = titleLower.includes(makeLower);
  const hasModel = titleLower.includes(modelLower);
  
  // Si se especifica un año, comprobar que el título lo contiene
  const hasYear = year ? titleLower.includes(year) : true;
  
  return hasMake && hasModel && hasYear;
}

/**
 * Extrae el tipo de carrocería del título
 */
function extractBodyType(title: string): string | null {
  const bodyTypes = [
    { term: 'fastback', result: 'Fastback' },
    { term: 'coupe', result: 'Coupe' },
    { term: 'convertible', result: 'Convertible' },
    { term: 'cabrio', result: 'Convertible' },
    { term: 'cabriolet', result: 'Convertible' },
    { term: 'sedan', result: 'Sedan' },
    { term: 'hatchback', result: 'Hatchback' },
    { term: 'wagon', result: 'Wagon' },
    { term: 'estate', result: 'Wagon' },
    { term: 'roadster', result: 'Roadster' },
    { term: 'spider', result: 'Convertible' },
    { term: 'spyder', result: 'Convertible' },
    { term: 'targa', result: 'Targa' },
    { term: 'pickup', result: 'Pickup' },
    { term: 'truck', result: 'Pickup' },
    { term: 'suv', result: 'SUV' }
  ];
  
  const titleLower = title.toLowerCase();
  
  for (const type of bodyTypes) {
    if (titleLower.includes(type.term)) {
      return type.result;
    }
  }
  
  return null;
}

/**
 * Extrae la transmisión del título
 */
function extractTransmission(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('5-speed') || titleLower.includes('5 speed') || titleLower.includes('5-velocidades')) {
    return 'Manual 5-Velocidades';
  }
  
  if (titleLower.includes('6-speed') || titleLower.includes('6 speed') || titleLower.includes('6-velocidades')) {
    return 'Manual 6-Velocidades';
  }
  
  if (titleLower.includes('4-speed') || titleLower.includes('4 speed') || titleLower.includes('4-velocidades')) {
    return 'Manual 4-Velocidades';
  }
  
  if (titleLower.includes('3-speed') || titleLower.includes('3 speed') || titleLower.includes('3-velocidades')) {
    return 'Manual 3-Velocidades';
  }
  
  if (titleLower.includes('manual')) {
    return 'Manual';
  }
  
  if (titleLower.includes('automatic') || titleLower.includes('automático') || titleLower.includes('automatico')) {
    return 'Automático';
  }
  
  if (titleLower.includes('dsg') || titleLower.includes('pdk') || titleLower.includes('tiptronic')) {
    return 'Automático Secuencial';
  }
  
  return null;
}