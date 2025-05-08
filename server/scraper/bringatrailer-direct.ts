/**
 * Scraper directo para Bring a Trailer
 * Este script utiliza peticiones HTTP directas para extraer datos en tiempo real
 * en lugar de usar un navegador completo.
 * 
 * IMPORTANTE: Todos los datos son extraídos en tiempo real con cada consulta.
 */
import { type InsertVehicle } from "@shared/schema";
import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Extrae subastas activas de Bring a Trailer usando peticiones HTTP directas
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailerDirect(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`🔍 Iniciando scraper directo para Bring a Trailer - Búsqueda: ${make} ${model} ${year || ''}`);
    
    // Array para almacenar los vehículos encontrados
    const vehicles: InsertVehicle[] = [];
    
    // Construir URL de búsqueda
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
    
    console.log(`📡 Accediendo a URL: ${searchUrl}`);
    
    // Configurar headers para simular un navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Realizar solicitud HTTP con timeout extendido
    const response = await axios.get(searchUrl, {
      headers,
      timeout: 30000
    });
    
    console.log(`✅ Respuesta recibida con status: ${response.status}`);
    
    // Crear DOM a partir del HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Extraer contenedor de subastas actuales
    console.log(`🔎 Buscando contenedor de subastas actuales...`);
    
    // Contenedor principal de subastas activas
    const auctionsContainer = document.querySelector('#auctions-current-container');
    
    if (!auctionsContainer) {
      console.log(`⚠️ No se encontró el contenedor de subastas actuales`);
      return [];
    }
    
    // Extraer tarjetas de listado
    const listingCards = auctionsContainer.querySelectorAll('.listing-card');
    
    if (!listingCards || listingCards.length === 0) {
      console.log(`⚠️ No se encontraron tarjetas de listado`);
      return [];
    }
    
    console.log(`✅ Encontradas ${listingCards.length} tarjetas de listado`);
    
    // Procesar cada tarjeta de listado
    for (let i = 0; i < listingCards.length; i++) {
      const card = listingCards[i];
      
      // Extraer título
      const titleElement = card.querySelector('h3');
      const title = titleElement ? titleElement.textContent || "" : "";
      
      // Verificar si el título es relevante para la búsqueda
      if (!isRelevant(title, make, model, year)) {
        console.log(`⚠️ Listado no relevante: ${title}`);
        continue;
      }
      
      console.log(`✅ Listado relevante encontrado: ${title}`);
      
      // URL de la subasta
      const href = card.getAttribute('href');
      
      // Imagen
      const imgElement = card.querySelector('.thumbnail img');
      let imageUrl = "";
      if (imgElement) {
        imageUrl = imgElement.getAttribute('src') || "";
      }
      
      // Puja actual
      const bidElement = card.querySelector('.bidding-bid .bid-formatted');
      let currentBid: number | null = null;
      if (bidElement) {
        const bidText = bidElement.textContent || "";
        const bidMatch = bidText.match(/\$([0-9,]+)/);
        if (bidMatch && bidMatch[1]) {
          currentBid = parseInt(bidMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      // Tiempo restante
      const countdownElement = card.querySelector('.bidding-countdown .countdown-text');
      const endsIn = countdownElement ? countdownElement.textContent || null : null;
      
      // Estado "No Reserve"
      const noReserveElement = card.querySelector('.item-tag-noreserve');
      const hasNoReserve = !!noReserveElement;
      
      // Extraer información adicional del título
      const { extractedYear, transmission, bodyType } = extractInfoFromTitle(title);
      
      // Crear objeto de vehículo
      const vehicle: InsertVehicle = {
        title: title,
        make: make,
        model: model,
        price: currentBid,
        year: extractedYear || (year ? parseInt(year, 10) : null),
        mileage: null,
        transmission: transmission,
        bodyType: bodyType,
        color: null,
        fuelType: null,
        location: "Estados Unidos",
        vin: null,
        dealerName: null,
        source: "bringatrailer",
        sourceUrl: href || `https://bringatrailer.com/search/${searchQuery}`,
        imageUrl: imageUrl,
        hasDeals: hasNoReserve,
        isAuction: true,
        currentBid: currentBid,
        endsIn: endsIn
      };
      
      console.log(`✅ Vehículo procesado: ${vehicle.title} (Puja: $${vehicle.price}, Tiempo: ${vehicle.endsIn})`);
      vehicles.push(vehicle);
    }
    
    console.log(`✅ Procesamiento completado: Encontrados ${vehicles.length} vehículos relevantes`);
    return vehicles;
    
  } catch (error) {
    console.error(`❌ Error al extraer datos de Bring a Trailer:`, error);
    return [];
  }
}

/**
 * Determina si un título de subasta es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Verificar marca
  if (!titleLower.includes(makeLower)) {
    return false;
  }
  
  // Verificar modelo con más flexibilidad
  // Para modelos como "911", verificamos que esté presente como palabra completa
  if (modelLower.length <= 3) {
    // Para modelos cortos, buscar como palabra completa
    const modelRegex = new RegExp(`\\b${modelLower}\\b`);
    if (!modelRegex.test(titleLower)) {
      return false;
    }
  } else {
    // Para modelos más largos, es suficiente con que esté incluido
    if (!titleLower.includes(modelLower)) {
      return false;
    }
  }
  
  // Verificar año si se proporciona
  if (year) {
    return titleLower.includes(year);
  }
  
  return true;
}

/**
 * Extrae información adicional del título (año, transmisión, tipo de carrocería)
 */
function extractInfoFromTitle(
  title: string
): { extractedYear: number | null; transmission: string | null; bodyType: string | null } {
  const result = {
    extractedYear: null as number | null,
    transmission: null as string | null,
    bodyType: null as string | null
  };
  
  // Extraer año
  const yearMatch = title.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    result.extractedYear = parseInt(yearMatch[0], 10);
  }
  
  // Extraer tipo de transmisión
  if (title.includes('4-Speed') || title.includes('4-speed') || title.includes('Four-Speed')) {
    result.transmission = 'Manual 4-Velocidades';
  } else if (title.includes('5-Speed') || title.includes('5-speed') || title.includes('Five-Speed')) {
    result.transmission = 'Manual 5-Velocidades';
  } else if (title.includes('6-Speed') || title.includes('6-speed') || title.includes('Six-Speed')) {
    result.transmission = 'Manual 6-Velocidades';
  } else if (title.includes('Manual')) {
    result.transmission = 'Manual';
  } else if (title.includes('Automatic')) {
    result.transmission = 'Automático';
  }
  
  // Extraer tipo de carrocería
  const bodyTypes = [
    { keywords: ['convertible', 'cabriolet', 'roadster', 'spyder', 'spider'], type: 'Convertible' },
    { keywords: ['coupe', 'coupé'], type: 'Coupe' },
    { keywords: ['sedan'], type: 'Sedan' },
    { keywords: ['hatchback'], type: 'Hatchback' },
    { keywords: ['wagon', 'estate', 'avant', 'touring'], type: 'Wagon' },
    { keywords: ['suv', 'crossover'], type: 'SUV' },
    { keywords: ['pickup', 'truck'], type: 'Pickup' },
    { keywords: ['fastback'], type: 'Fastback' },
    { keywords: ['targa'], type: 'Targa' }
  ];
  
  const titleLower = title.toLowerCase();
  for (const body of bodyTypes) {
    for (const keyword of body.keywords) {
      if (titleLower.includes(keyword)) {
        result.bodyType = body.type;
        break;
      }
    }
    if (result.bodyType) break;
  }
  
  return result;
}