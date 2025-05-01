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
  
  // Selecciona los elementos que contienen listados de vehículos activos
  // Buscamos primero en #search-result-live-listings que contiene SOLO las subastas activas
  const liveListings = $('#search-result-live-listings a.listing-card');
  console.log(`Encontradas ${liveListings.length} enlaces activos en #search-result-live-listings`);
  
  // Por si no encontramos todos los listados activos con el primer selector
  const liveListingsAlt = $('#search-result-listings a.listing-card');
  console.log(`Encontradas ${liveListingsAlt.length} enlaces activos en #search-result-listings`);
  
  // Combinamos todos los selectores para asegurar que encontramos todos los listados
  const searchResultListings = liveListings.length > 0 ? liveListings : liveListingsAlt;
  console.log(`Total de listados a procesar: ${searchResultListings.length}`);

  
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
          console.log(`Texto de oferta: "${currentBidText}"`);
          
          let currentBid = null;
          if (currentBidText) {
            // Busca patrones de precio: $69,500 o USD $69,500
            const priceMatch = currentBidText.match(/[\$]?\s*(\d[\d,\.]+)/);
            if (priceMatch && priceMatch[1]) {
              const cleanPrice = priceMatch[1].replace(/[^\d]/g, '');
              currentBid = parseInt(cleanPrice, 10);
              console.log(`Precio extraído: ${currentBid}`);
            }
          }
          
          // Procesa el tiempo restante
          const countdownSpan = bidDiv.find('.countdown-text');
          const endsInText = countdownSpan.text().trim();
          console.log(`Tiempo restante: "${endsInText}"`);
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
          const isActiveAuction = !!endsIn && 
                                endsIn !== 'No disponible' &&
                                endsIn !== 'Terminado' && 
                                endsIn !== 'Completed' && 
                                !endsIn.toLowerCase().includes('sold') &&
                                !endsIn.toLowerCase().includes('ended');
          
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
      
      // Para depuración: imprimimos el título antes de verificar relevancia
      console.log(`Evaluando título de listado alternativo: "${title}"`);
      
      // Solo procesa si el título es relevante
      if (isRelevantListing(title, make, model, year)) {
        console.log(`ENCONTRADO VEHÍCULO RELEVANTE: ${title}`);
        
        let sourceUrl = $(element).find('a').attr('href') || $(element).attr('href') || '';
        console.log(`URL encontrada: ${sourceUrl}`);
        
        if (sourceUrl && !sourceUrl.startsWith('http')) {
          sourceUrl = `https://bringatrailer.com${sourceUrl}`;
          console.log(`URL corregida: ${sourceUrl}`);
        }
        
        const imageUrl = $(element).find('img').first().attr('src') || '';
        // Extraemos el precio de la oferta actual
        let currentBidText = $(element).find('.bid-formatted').text().trim();
        
        // Si no encontramos el precio, buscamos en otros elementos posibles
        if (!currentBidText) {
          currentBidText = $(element).find('.current-bid').text().trim() ||
                           $(element).find('.amount').text().trim() ||
                           $(element).find('.highest-bid').text().trim();
        }
        
        console.log(`Texto de oferta encontrado: "${currentBidText}"`);
        
        let currentBid = null;
        if (currentBidText) {
          // Eliminamos símbolos de moneda y cualquier texto no numérico
          const priceMatch = currentBidText.match(/(\$?\s?\d[\d,\.]+)/);
          if (priceMatch && priceMatch[1]) {
            // Limpia el texto para extraer solo los números
            const cleanPrice = priceMatch[1].replace(/[^\d]/g, '');
            currentBid = parseInt(cleanPrice, 10);
            console.log(`Precio extraído: ${currentBid}`);
          }
        }
        
        // Extraemos el tiempo restante de la subasta
        let endsInText = $(element).find('.countdown-text').text().trim();
        
        // Si no encontramos texto de tiempo restante, buscamos en otros elementos
        if (!endsInText) {
          endsInText = $(element).find('.listing-available-timeremaining').text().trim() ||
                       $(element).find('.timeremaining').text().trim() ||
                       $(element).find('.completed-timeremaining').text().trim() || 
                       'No disponible';
        }
        
        console.log(`Tiempo restante encontrado: "${endsInText}"`); 
        const extractedYear = extractYear(title);
        
        // Verifica si la subasta está activa
        // Solo mostrar subastas activas basado en el mensaje del tiempo restante
        const isActiveAuction = !!endsInText && 
                            endsInText !== 'No disponible' &&
                            endsInText !== 'Terminado' && 
                            endsInText !== 'Completed' && 
                            !endsInText.toLowerCase().includes('sold') &&
                            !endsInText.toLowerCase().includes('ended');
        
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
  
  // Si make y model son iguales (como cuando se busca por "mustang" sin especificar "ford")
  if (make.toLowerCase() === model.toLowerCase()) {
    // Usamos el término
    searchTerms = make;
  } else {
    // Para casos como "dodge challenger", usamos ambos
    searchTerms = `${make} ${model}`;
  }
  
  console.log(`Términos de búsqueda iniciales: "${searchTerms}"`);

  
  // Añadimos el año si está disponible
  if (year) {
    searchTerms = `${searchTerms}+${year}`;
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
  
  console.log(`Verificando relevancia para: "${title}" contra modelo "${model}" y año "${year || 'no especificado'}"`);
  
  // Caso especial: cuando make y model son idénticos (ej: búsqueda genérica "mustang")
  if (makeLower === modelLower) {
    // Basta con que el título contenga el modelo
    const hasModel = titleLower.includes(modelLower);
    const hasYear = !year || titleLower.includes(year);
    
    const result = hasModel && hasYear;
    console.log(`Relevancia (búsqueda general): ${result ? 'SÍ' : 'NO'} - Contiene modelo: ${hasModel}, Contiene año: ${hasYear || 'No requerido'}`);
    return result;
  }
  
  // Para vehículos populares, usamos criterios más específicos
  
  // Para Ford Mustang
  if ((makeLower === 'ford' && modelLower === 'mustang') || 
      (makeLower === 'mustang' || modelLower === 'mustang')) {
    const isMustang = titleLower.includes('mustang') || titleLower.includes('shelby');
    const hasYear = !year || titleLower.includes(year);
    
    const result = isMustang && hasYear;
    console.log(`Relevancia (Mustang): ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
  
  // Para Dodge Challenger
  if ((makeLower === 'dodge' && modelLower === 'challenger') ||
      (makeLower === 'challenger' || modelLower === 'challenger')) {
    const isChallenger = titleLower.includes('challenger');
    const hasYear = !year || titleLower.includes(year);
    
    const result = isChallenger && hasYear;
    console.log(`Relevancia (Challenger): ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
  
  // Para Chevrolet Corvette
  if ((makeLower === 'chevrolet' && modelLower === 'corvette') ||
      (makeLower === 'corvette' || modelLower === 'corvette')) {
    const isCorvette = titleLower.includes('corvette') || titleLower.includes('vette');
    const hasYear = !year || titleLower.includes(year);
    
    const result = isCorvette && hasYear;
    console.log(`Relevancia (Corvette): ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
  
  // Método general para otros modelos
  const hasMake = makeLower !== modelLower ? titleLower.includes(makeLower) : true;
  const hasModel = titleLower.includes(modelLower);
  const hasYear = !year || titleLower.includes(year);
  
  const result = hasModel && hasYear; // Relajamos la condición del fabricante
  console.log(`Relevancia (genérico): ${result ? 'SÍ' : 'NO'} - Contiene modelo: ${hasModel}, Contiene año: ${hasYear || 'No requerido'}`);
  return result;
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