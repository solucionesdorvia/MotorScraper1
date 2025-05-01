/**
 * Scraper para Bring a Trailer - sitio premium de subastas para vehículos de colección
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Iniciando scraping de Bring a Trailer para ${make} ${model} ${year || ''}`);
    
    // Construye la URL para la búsqueda
    const searchUrl = buildBringATrailerUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Realiza la solicitud HTTP para obtener los resultados de búsqueda
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      }
    });
    
    if (!response.ok) {
      console.error(`Error al obtener resultados de Bring a Trailer: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`HTML obtenido de Bring a Trailer: ${html.length} caracteres`);
    
    // Extrae vehículos del HTML
    const vehicles = extractVehicleListings(html, make, model, year);
    
    if (vehicles.length === 0) {
      console.log('No se encontraron vehículos en Bring a Trailer');
      return [];
    }
    
    return vehicles;
  } catch (error) {
    console.error('Error en el scraper de Bring a Trailer:', error);
    return [];
  }
}

/**
 * Extrae listados de vehículos del HTML de Bring a Trailer
 */
function extractVehicleListings(
  html: string,
  make: string,
  model: string,
  year?: string
): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = load(html);
  
  console.log('Analizando HTML de Bring a Trailer...');
  
  // Selecciona los elementos que contienen listados de vehículos
  // Intentamos primero con #search-result-listings que contiene las subastas activas
  const searchResultListings = $('#search-result-listings a');
  console.log(`Encontradas ${searchResultListings.length} enlaces en #search-result-listings`);
  
  if (searchResultListings.length > 0) {
    searchResultListings.each(function(index: number, element: any) {
      try {
        // Extrae el título
        const title = $(element).find('h3').text().trim();
        if (!title) return; // Salta si no hay título
        
        console.log(`Encontrado título ${index + 1}: "${title}"`);
        
        // Solo procesa si el título es relevante para la búsqueda
        if (isRelevantListing(title, make, model, year)) {
          console.log(`Título relevante: "${title}"`);
          
          // Procesa la URL
          let sourceUrl = $(element).attr('href') || '';
          if (sourceUrl && !sourceUrl.startsWith('http')) {
            sourceUrl = `https://bringatrailer.com${sourceUrl}`;
          }
          
          // Procesa la imagen
          const imageUrl = $(element).find('.thumbnail img').attr('src') || '';
          
          // Procesa la oferta
          const bidDiv = $(element).find('.content-secondary .item-bidding');
          const currentBidText = bidDiv.find('.bid-formatted').text().trim();
          let currentBid = null;
          
          if (currentBidText) {
            const priceMatch = currentBidText.match(/(\d[\d,]+)/);
            if (priceMatch && priceMatch[1]) {
              currentBid = parseInt(priceMatch[1].replace(/,/g, ''), 10);
            }
          }
          
          // Procesa el tiempo restante
          const endsInText = bidDiv.find('.countdown-text').text().trim();
          const endsIn = endsInText || null;
          
          // Procesa el año
          const extractedYear = extractYear(title);
          
          // Procesa la descripción
          const description = $(element).find('.item-excerpt').text().trim() || null;
          
          // Procesa la ubicación
          let locationText = 'Estados Unidos';
          const countryName = $(element).find('.show-country-name').text().trim();
          if (countryName) {
            locationText = countryName === 'USA' ? 'Estados Unidos' : countryName;
          }
          
          // Procesa el tipo de carrocería
          let bodyType = null;
          const fullText = `${title} ${description || ''}`;
          
          if (fullText.toLowerCase().includes('fastback')) {
            bodyType = 'Fastback';
          } else if (fullText.toLowerCase().includes('coupe')) {
            bodyType = 'Coupe';
          } else if (fullText.toLowerCase().includes('convertible') || fullText.toLowerCase().includes('cabrio')) {
            bodyType = 'Convertible';
          } else if (fullText.toLowerCase().includes('sedan')) {
            bodyType = 'Sedan';
          }
          
          // Procesa la transmisión
          let transmission = null;
          if (fullText.toLowerCase().includes('manual') || fullText.toLowerCase().includes('speed')) {
            transmission = 'Manual';
          } else if (fullText.toLowerCase().includes('automatic') || fullText.toLowerCase().includes('auto')) {
            transmission = 'Automática';
          }
          
          // Verifica si la subasta está activa
          const isActiveAuction = !!endsIn && endsIn !== 'Terminado' && endsIn !== 'Completed' && !endsIn.toLowerCase().includes('sold');
          
          // Solo agregar si la subasta está activa
          if (isActiveAuction) {
            const vehicle: InsertVehicle = {
              title,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl,
              imageUrl,
              year: extractedYear,
              price: currentBid,
              isAuction: true,
              currentBid,
              endsIn,
              transmission,
              bodyType,
              location: locationText,
              mileage: null,
              color: null,
              vin: null,
              fuelType: null,
              dealerName: null,
              hasDeals: false
            };
            
            vehicles.push(vehicle);
            console.log(`Vehículo añadido: ${title} - ${currentBid}`);
          } else {
            console.log(`Subasta no activa, ignorando: ${title}`);
          }
        } else {
          console.log(`Título no relevante, ignorando: ${title}`);
        }
      } catch (error) {
        console.error('Error procesando listado:', error);
      }
    });
  }
  
  // Si ya encontramos vehículos, no necesitamos buscar más
  if (vehicles.length > 0) {
    console.log(`Encontrados ${vehicles.length} vehículos activos, finalizando búsqueda`);
    return vehicles;
  }
  
  // Como no se encontraron vehículos, intentamos otros selectores
  const listingCards = $('.listing-card');
  console.log(`Intentando con selector alternativo: .listing-card (${listingCards.length} encontrados)`);
  
  listingCards.each(function(index: number, element: any) {
    try {
      // Extrae datos básicos
      const title = $(element).find('h3').text().trim();
      if (!title) return; // Salta si no hay título
      
      // Solo procesa si el título es relevante
      if (isRelevantListing(title, make, model, year)) {
        let sourceUrl = $(element).attr('href') || '';
        if (sourceUrl && !sourceUrl.startsWith('http')) {
          sourceUrl = `https://bringatrailer.com${sourceUrl}`;
        }
        
        const imageUrl = $(element).find('img').first().attr('src') || '';
        const currentBidText = $(element).find('.bid-formatted').text().trim();
        let currentBid = null;
        
        if (currentBidText) {
          const priceMatch = currentBidText.match(/(\d[\d,]+)/);
          if (priceMatch && priceMatch[1]) {
            currentBid = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          }
        }
        
        const endsInText = $(element).find('.countdown-text').text().trim();
        const extractedYear = extractYear(title);
        
        // Verifica si la subasta está activa
        const isActiveAuction = !!endsInText && endsInText !== 'Terminado' && endsInText !== 'Completed' && !endsInText.toLowerCase().includes('sold');
        
        if (isActiveAuction) {
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            source: 'bringatrailer',
            sourceUrl,
            imageUrl,
            year: extractedYear,
            price: currentBid,
            isAuction: true,
            currentBid,
            endsIn: endsInText || null,
            transmission: null,
            bodyType: null,
            location: 'Estados Unidos',
            mileage: null,
            color: null,
            vin: null,
            fuelType: null,
            dealerName: null,
            hasDeals: false
          };
          
          vehicles.push(vehicle);
          console.log(`Vehículo alternativo añadido: ${title}`);
        }
      }
    } catch (error) {
      console.error('Error en selector alternativo:', error);
    }
  });
  
  console.log(`Total de vehículos encontrados en BaT: ${vehicles.length}`);
  return vehicles;
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildBringATrailerUrl(make: string, model: string, year?: string): string {
  // Base URL para búsquedas en Bring a Trailer
  const baseUrl = 'https://bringatrailer.com/search/';
  
  // Construye los parámetros de búsqueda
  let searchTerms = '';
  
  if (make.toLowerCase() === model.toLowerCase()) {
    // Si son iguales, solo usamos uno para evitar duplicación
    searchTerms = make;
  } else {
    // Si son diferentes, usamos ambos
    searchTerms = `${model}`; // Priorizamos el modelo
  }
  
  // Añadimos el año si está disponible
  if (year) {
    searchTerms = `${model}+${year}`;
  }
  
  // Agregamos el parámetro 'order=end_date' para mostrar primero subastas a punto de terminar
  return `${baseUrl}?s=${searchTerms.replace(/ /g, '+')}&order=end_date`;
}

/**
 * Comprueba si un listado es relevante para los criterios de búsqueda
 */
function isRelevantListing(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Para Ford Mustang
  if (makeLower === 'ford' && modelLower === 'mustang') {
    const isMustang = titleLower.includes('mustang') || titleLower.includes('shelby');
    
    // Si se especificó un año, comprueba si coincide
    if (year && !titleLower.includes(year)) {
      return false;
    }
    
    return isMustang;
  }
  
  // Para Dodge Challenger
  if (makeLower === 'dodge' && modelLower === 'challenger') {
    const isChallenger = titleLower.includes('challenger');
    
    // Si se especificó un año, comprueba si coincide
    if (year && !titleLower.includes(year)) {
      return false;
    }
    
    return isChallenger;
  }
  
  // Para Chevrolet Corvette
  if (makeLower === 'chevrolet' && modelLower === 'corvette') {
    const isCorvette = titleLower.includes('corvette');
    
    // Si se especificó un año, comprueba si coincide
    if (year && !titleLower.includes(year)) {
      return false;
    }
    
    return isCorvette;
  }
  
  // Método general para otros modelos
  const hasMake = titleLower.includes(makeLower);
  const hasModel = titleLower.includes(modelLower);
  const hasYear = !year || titleLower.includes(year);
  
  return hasMake && hasModel && hasYear;
}

/**
 * Extrae el año del texto del título
 */
function extractYear(text: string): number | null {
  if (!text) return null;
  
  // Busca números de 4 dígitos que podrían ser años (1900-2099)
  const yearMatch = text.match(/(19\d{2}|20\d{2})/);
  if (yearMatch && yearMatch[0]) {
    const year = parseInt(yearMatch[0], 10);
    // Verifica que sea un año razonable para un auto clásico
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return year;
    }
  }
  
  return null;
}