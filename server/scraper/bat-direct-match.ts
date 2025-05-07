/**
 * SCRAPER DE COINCIDENCIA DIRECTA PARA BRING A TRAILER
 * 
 * Este scraper está diseñado para trabajar específicamente con la estructura HTML
 * proporcionada en el ejemplo. En lugar de buscar clases o IDs específicos,
 * utiliza la estructura conocida para extraer datos.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Extrae datos de subastas de BaT usando una coincidencia directa con la estructura HTML conocida
 */
export async function scrapeBringATrailerDirectMatch(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`⚡ Buscando subastas en BaT con scraper de coincidencia directa: ${make} ${model} ${year || ''}`);
  
  try {
    // Construir URL
    const searchTerms = [make, model, year].filter(Boolean).join('+');
    const url = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchTerms)}`;
    console.log(`URL: ${url}`);
    
    // Obtener HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      }
    });
    
    const html = response.data;
    console.log(`HTML obtenido (${html.length} bytes)`);
    
    return extractVehiclesFromHtml(html, make, model, year);
  } catch (error: any) {
    console.error(`Error al obtener datos de BaT: ${error.message}`);
    return [];
  }
}

/**
 * Extrae datos de vehículos del HTML usando la estructura conocida
 */
function extractVehiclesFromHtml(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = cheerio.load(html);
  
  console.log('🔍 Analizando HTML con método de coincidencia directa');
  
  // Buscar TODOS los elementos <a> con clase "listing-card"
  const listingCards = $('a.listing-card');
  console.log(`Encontradas ${listingCards.length} tarjetas de listado en el documento`);
  
  // Analizar cada tarjeta de listado
  listingCards.each((index, element) => {
    try {
      const card = $(element);
      const url = card.attr('href') || '';
      
      if (!url || !url.includes('/listing/')) {
        console.log(`Omitiendo tarjeta #${index + 1} - No es una URL de listado: ${url}`);
        return;
      }
      
      // Extraer título desde múltiples fuentes posibles
      let title = '';
      
      // Método 1: Desde el elemento h3
      const h3Element = card.find('h3');
      if (h3Element.length && h3Element.text().trim()) {
        title = h3Element.text().trim();
      }
      
      // Método 2: Desde el atributo alt de la imagen
      if (!title) {
        const imgElement = card.find('.thumbnail img');
        if (imgElement.length && imgElement.attr('alt')) {
          title = imgElement.attr('alt')!.trim();
        }
      }
      
      // Método 3: Desde la URL
      if (!title && url) {
        // Extraer slug desde la URL (ej: /listing/1967-ford-mustang/ -> 1967-ford-mustang)
        const urlMatch = url.match(/\/listing\/([^/]+)/);
        if (urlMatch && urlMatch[1]) {
          // Convertir slug a título formateado
          const slug = urlMatch[1];
          title = slug
            .replace(/-/g, ' ')
            .replace(/(\d{4})/, '$1 ') // Añadir espacio después del año
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      if (!title) {
        console.log(`⚠️ Omitiendo tarjeta #${index + 1} - No se pudo extraer título`);
        return;
      }
      
      console.log(`Procesando tarjeta #${index + 1}: "${title}" (${url})`);
      
      // Extraer precio actual
      let currentBid = 0;
      let bidText = '';
      
      const bidElement = card.find('.bid-formatted');
      if (bidElement.length) {
        bidText = bidElement.text().trim();
        // Extraer número de la puja (e.g., "USD $15,000" -> 15000)
        const bidMatch = bidText.replace(/[^0-9]/g, '');
        if (bidMatch) {
          currentBid = parseInt(bidMatch);
        }
      }
      
      console.log(`  Puja actual: ${bidText} (${currentBid})`);
      
      // Extraer tiempo restante
      let timeRemaining = 'En curso';
      
      const timeElement = card.find('.countdown-text');
      if (timeElement.length) {
        timeRemaining = timeElement.text().trim();
      }
      
      console.log(`  Tiempo restante: ${timeRemaining}`);
      
      // Extraer imagen
      let imageUrl = '';
      
      const imgElement = card.find('.thumbnail img');
      if (imgElement.length && imgElement.attr('src')) {
        imageUrl = imgElement.attr('src')!;
      }
      
      // Extraer descripción
      let description = '';
      
      const excerptElement = card.find('.item-excerpt');
      if (excerptElement.length) {
        description = excerptElement.text().trim();
      }
      
      // Comprobar si el título es relevante
      if (isRelevantVehicle(title, make, model, year)) {
        // Crear objeto del vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url,
          imageUrl,
          year: extractYear(title) || (year ? parseInt(year) : null),
          price: currentBid,
          isAuction: true,
          currentBid,
          endsIn: timeRemaining,
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
        console.log(`✅ Vehículo añadido: "${title}"`);
      } else {
        console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
      }
    } catch (error: any) {
      console.error(`Error procesando tarjeta: ${error.message}`);
    }
  });
  
  console.log(`Total: ${vehicles.length} vehículos relevantes encontrados`);
  return vehicles;
}

/**
 * Determina si un vehículo es relevante para los criterios de búsqueda
 */
function isRelevantVehicle(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Caso especial para "Chevrolet" que puede aparecer como "Chevy"
  let makePresent = titleLower.includes(makeLower);
  if (makeLower === "chevrolet" && (titleLower.includes("chevy") || titleLower.includes("corvette"))) {
    makePresent = true;
  }
  
  // Caso especial para "Volkswagen" que puede aparecer como "VW"
  if (makeLower === "volkswagen" && titleLower.includes("vw")) {
    makePresent = true;
  }
  
  // Caso especial para "Shelby" que es considerado parte de "Ford"
  if (makeLower === "ford" && titleLower.includes("shelby")) {
    makePresent = true;
  }
  
  // Si el título no contiene la marca, no es relevante
  if (!makePresent) {
    return false;
  }
  
  // Manejo especial para modelos con guiones como "F-250"
  let modelPresent = false;
  
  // Si el modelo contiene guiones, intentar diferentes variaciones
  if (modelLower.includes('-')) {
    // Intentar con el modelo exacto
    if (titleLower.includes(modelLower)) {
      modelPresent = true;
    }
    
    // Intentar sin el guión (F250 en lugar de F-250)
    const modelWithoutHyphen = modelLower.replace(/-/g, '');
    if (titleLower.includes(modelWithoutHyphen)) {
      modelPresent = true;
    }
    
    // Intentar con espacio en lugar del guión (F 250 en lugar de F-250)
    const modelWithSpace = modelLower.replace(/-/g, ' ');
    if (titleLower.includes(modelWithSpace)) {
      modelPresent = true;
    }
    
    // Intentar solo con el número si es un modelo como "F-250"
    const modelParts = modelLower.split('-');
    if (modelParts.length > 1 && titleLower.includes(modelParts[0]) && titleLower.includes(modelParts[1])) {
      modelPresent = true;
    }
  } else {
    // Para modelos sin guiones, verificación normal
    modelPresent = titleLower.includes(modelLower);
  }
  
  // Si ninguna variación del modelo está presente, no es relevante
  // Excepto si no se especificó un modelo
  if (!modelPresent && model.trim() !== '') {
    return false;
  }
  
  // Si se especificó un año, verificar si el título contiene el año
  if (year && !titleLower.includes(year)) {
    return false;
  }
  
  return true;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  // Buscar años entre 1900 y 2025
  const match = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrae la transmisión del texto
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
 * Extrae el tipo de carrocería del texto
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
  
  if (lowerText.includes('suv')) {
    return 'SUV';
  }
  
  if (lowerText.includes('truck') || lowerText.includes('pickup')) {
    return 'Pickup';
  }
  
  return null;
}