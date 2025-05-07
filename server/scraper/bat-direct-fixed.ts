import axios from 'axios';
import { load } from 'cheerio';
import { InsertVehicle } from '@shared/schema';

/**
 * SCRAPER DIRECTO MEJORADO PARA BRING A TRAILER
 * 
 * - Usa siempre coincidencia directa para buscar subastas activas
 * - Soporta exactamente la estructura HTML observada
 * - Extrae correctamente la información de listados activos
 */
export async function scrapeBringATrailerDirectFixed(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Buscando subastas activas en BaT con método directo mejorado: ${make} ${model} ${year || ''}`);
  
  // Construir la query de búsqueda
  const searchQuery = [make, model, year].filter(Boolean).join('+');
  
  // URL directa para buscar en subastas activas
  const url = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
  console.log(`URL de búsqueda: ${url}`);
  
  try {
    // Realizar la petición con un timeout razonable
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000 // 10 segundos
    });
    
    // Verificar si la respuesta es válida
    if (response.status !== 200 || !response.data) {
      console.error(`Error: Respuesta inválida (${response.status})`);
      return [];
    }
    
    console.log(`✅ HTML obtenido (${response.data.length} bytes)`);
    
    // Extraer vehículos del HTML
    const vehicles = extractVehiclesFromHTML(response.data, make, model, year);
    
    if (vehicles.length > 0) {
      console.log(`✅ Encontrados ${vehicles.length} vehículos relevantes`);
    } else {
      console.log('⚠️ No se encontraron vehículos relevantes');
    }
    
    return vehicles;
  } catch (error) {
    // Manejar errores
    if (error instanceof Error) {
      console.error(`❌ Error al obtener datos: ${error.message}`);
    } else {
      console.error('❌ Error desconocido al obtener datos');
    }
    return [];
  }
}

/**
 * Extrae vehículos del HTML de Bring a Trailer
 * 
 * Utilizando la estructura HTML exacta proporcionada:
 * <div class="listings-container auctions-grid" id="auctions-current-container">
 *   <a class="listing-card bg-white-transparent" href="...">
 *     <div class="thumbnail">...</div>
 *     <div class="content">
 *       <div class="content-main">
 *         <h3>Título del vehículo</h3>
 *         ...
 *       </div>
 *       <div class="item-bidding">
 *         <span class="bid-formatted bold">USD $20,500</span>
 *         ...
 *         <span class="countdown-text final-countdown">5:26</span>
 *       </div>
 *     </div>
 *   </a>
 * </div>
 */
function extractVehiclesFromHTML(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = load(html);
  
  // Buscar el contenedor principal de listados (estructura exacta proporcionada)
  console.log('Buscando contenedor de listados con id="auctions-current-container"');
  const container = $('#auctions-current-container');
  
  if (container.length === 0) {
    console.log('❌ No se encontró el contenedor principal con id="auctions-current-container"');
    
    // Intentar con un selector alternativo
    const altContainer = $('.listings-container, .auctions-grid').first();
    if (altContainer.length > 0) {
      console.log('✅ Encontrado contenedor alternativo');
      processContainer(altContainer, $, make, model, year, vehicles);
    } else {
      console.log('❌ No se encontró ningún contenedor de listados conocido');
      // Buscar directamente las tarjetas en toda la página
      const allCards = $('a.listing-card');
      if (allCards.length > 0) {
        console.log(`Encontradas ${allCards.length} tarjetas directamente en la página`);
        processCards(allCards, $, make, model, year, vehicles);
      } else {
        console.log('⚠️ No se encontraron tarjetas de listado en la página');
      }
    }
  } else {
    console.log(`✅ Encontrado contenedor principal con id="auctions-current-container"`);
    processContainer(container, $, make, model, year, vehicles);
  }
  
  console.log(`Total: ${vehicles.length} vehículos relevantes encontrados`);
  return vehicles;
}

/**
 * Procesa un contenedor de listados
 */
function processContainer(container: any, $: any, make: string, model: string, year: string | undefined, vehicles: InsertVehicle[]) {
  // Buscar tarjetas de listado dentro del contenedor
  const cards = container.find('a.listing-card');
  console.log(`Encontradas ${cards.length} tarjetas de listado en el contenedor`);
  
  if (cards.length === 0) {
    console.log('❌ No se encontraron tarjetas en el contenedor');
    return;
  }
  
  processCards(cards, $, make, model, year, vehicles);
}

/**
 * Procesa las tarjetas de listado
 */
function processCards(cards: any, $: any, make: string, model: string, year: string | undefined, vehicles: InsertVehicle[]) {
  cards.each(function(index: number, element: any) {
    try {
      const card = $(element);
      
      // Extraer URL
      const url = card.attr('href') || '';
      if (!url) {
        console.log(`⚠️ Tarjeta #${index + 1} sin URL, omitiendo`);
        return;
      }
      
      // Extraer título
      const title = card.find('h3').text().trim();
      if (!title) {
        console.log(`⚠️ Tarjeta #${index + 1} sin título, omitiendo`);
        return;
      }
      
      console.log(`Analizando listado #${index + 1}: "${title}" (${url})`);
      
      // Extraer imagen
      const imageUrl = card.find('.thumbnail img').attr('src') || '';
      
      // Extraer descripción
      const description = card.find('.item-excerpt').text().trim();
      
      // Extraer precio actual
      const bidText = card.find('.bid-formatted').text().trim();
      const currentBid = extractPrice(bidText);
      console.log(`  💰 Puja actual: ${bidText} (${currentBid || 'desconocido'})`);
      
      // Extraer tiempo restante
      const timeRemaining = card.find('.countdown-text').text().trim();
      console.log(`  ⏱️ Tiempo restante: ${timeRemaining}`);
      
      // Verificar si el listado es relevante
      if (isRelevant(title, make, model, year)) {
        // Crear objeto de vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
          imageUrl,
          year: extractYear(title) || (year ? parseInt(year) : null),
          price: currentBid || 0,
          isAuction: true,
          currentBid: currentBid || 0,
          endsIn: timeRemaining || 'En curso',
          transmission: extractTransmission(title) || extractTransmission(description),
          bodyType: extractBodyType(title) || extractBodyType(description),
          location: 'Estados Unidos',
          mileage: null,
          color: null,
          vin: null,
          fuelType: null,
          dealerName: null,
          hasDeals: false
        };
        
        vehicles.push(vehicle);
        console.log(`  ✅ Vehículo relevante añadido: "${title}"`);
      } else {
        console.log(`  ❌ Vehículo no relevante para ${make} ${model} ${year || ''}`);
      }
    } catch (error) {
      console.error(`Error al procesar tarjeta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });
}

/**
 * Determina si un listado es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Verificar coincidencia de marca y modelo
  let isMatch = titleLower.includes(makeLower) && titleLower.includes(modelLower);
  
  // Casos especiales
  if (!isMatch) {
    // Coincidencia parcial para Ford Ranchero
    if (makeLower === 'ford' && modelLower === 'ranchero') {
      isMatch = titleLower.includes('ranchero');
    }
    // Coincidencia parcial para Dodge Challenger/Charger
    else if (makeLower === 'dodge' && (modelLower === 'challenger' || modelLower === 'charger')) {
      isMatch = titleLower.includes(modelLower);
    }
    // Verificar si el título contiene solo el modelo para marcas populares
    else if (['ford', 'chevrolet', 'dodge', 'porsche', 'ferrari'].includes(makeLower)) {
      isMatch = titleLower.includes(modelLower);
    }
  }
  
  // Si se especificó un año, verificar si el título lo contiene
  if (isMatch && year) {
    isMatch = titleLower.includes(year);
  }
  
  return isMatch;
}

/**
 * Extrae el precio del texto
 */
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Limpiar el texto (quitar USD, $, comas, etc.)
  const cleanText = text.replace(/USD|\$|,/g, '').trim();
  
  // Extraer el número
  const match = cleanText.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  // Buscar año entre 1900 y 2025
  const match = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrae información sobre la transmisión
 */
function extractTransmission(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('manual') || lowerText.includes('speed') || lowerText.includes('-speed')) {
    // Intentar extraer el número de velocidades
    const speedMatch = lowerText.match(/(\d)(?:-|\s)?speed/i);
    if (speedMatch) {
      return `Manual ${speedMatch[1]}-Velocidades`;
    }
    return 'Manual';
  }
  
  if (lowerText.includes('automatic') || lowerText.includes('auto') || lowerText.includes('automático')) {
    return 'Automático';
  }
  
  return null;
}

/**
 * Extrae el tipo de carrocería
 */
function extractBodyType(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('coupe')) {
    return 'Coupe';
  }
  
  if (lowerText.includes('sedan')) {
    return 'Sedan';
  }
  
  if (lowerText.includes('convertible')) {
    return 'Convertible';
  }
  
  if (lowerText.includes('fastback')) {
    return 'Fastback';
  }
  
  if (lowerText.includes('wagon') || lowerText.includes('estate')) {
    return 'Wagon';
  }
  
  if (lowerText.includes('ranchero') || lowerText.includes('pickup') || lowerText.includes('truck')) {
    return 'Pickup';
  }
  
  return null;
}