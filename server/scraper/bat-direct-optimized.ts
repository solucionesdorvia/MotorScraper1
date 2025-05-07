/**
 * SCRAPER OPTIMIZADO PARA LA PÁGINA DE SUBASTAS ACTIVAS DE BRING A TRAILER
 * 
 * Basado en la estructura exacta del HTML proporcionado, este scraper se enfoca
 * en extraer datos de las subastas activas de la página /auctions/ de Bring a Trailer.
 * 
 * URL: https://bringatrailer.com/auctions/?search=mustang+1967
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Extrae subastas activas de Bring a Trailer directamente de la página /auctions/
 */
export async function scrapeBringATrailerDirectOptimized(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`🔍 Buscando subastas activas en Bring a Trailer (Optimizado): ${make} ${model} ${year || ''}`);
  
  try {
    // Construir la URL de búsqueda
    const searchTerms = [make, model, year].filter(Boolean).join('+');
    const url = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchTerms)}`;
    console.log(`URL: ${url}`);
    
    // Obtener HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const html = response.data;
    console.log(`HTML obtenido (${html.length} bytes)`);
    
    // Procesar HTML
    return extractAuctionsFromHtml(html, make, model, year);
  } catch (error: any) {
    console.error(`Error al obtener datos de Bring a Trailer: ${error.message}`);
    return [];
  }
}

/**
 * Extrae datos de subastas del HTML
 */
function extractAuctionsFromHtml(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = cheerio.load(html);
  
  console.log('Analizando HTML para buscar auctions-grid...');
  
  // Buscar el contenedor de subastas
  const container = $('.listings-container.auctions-grid');
  console.log(`Encontrado contenedor de subastas: ${container.length > 0 ? 'Sí' : 'No'}`);
  
  if (container.length === 0) {
    console.warn('No se encontró el contenedor principal de subastas.');
    return [];
  }
  
  // Buscar todas las tarjetas de listado
  const listingCards = container.find('a.listing-card');
  console.log(`Encontradas ${listingCards.length} tarjetas de listado`);
  
  // Procesar cada tarjeta de listado
  listingCards.each((index, element) => {
    try {
      // Extraer datos básicos
      const card = $(element);
      const url = card.attr('href') || '';
      
      // Extraer título desde la imagen o el h3
      let title = '';
      const h3 = card.find('h3');
      if (h3.length > 0) {
        title = h3.text().trim();
      }
      
      if (!title) {
        const img = card.find('.thumbnail img');
        if (img.length > 0) {
          title = img.attr('alt') || '';
        }
      }
      
      // Intentar extraer desde el URL si no hay título
      if (!title && url) {
        const urlMatch = url.match(/\/listing\/(.+?)\/?$/);
        if (urlMatch && urlMatch[1]) {
          title = urlMatch[1].replace(/-/g, ' ').replace(/(\d{4})/, '$1 ');
          // Capitalizar cada palabra
          title = title.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      console.log(`Listado #${index + 1}: ${title || '[Sin título]'} (${url})`);
      
      // Si no hay título después de todos los intentos, omitir este listado
      if (!title) {
        console.log('  ⚠️ Omitiendo listado sin título');
        return;
      }
      
      // Extraer precio de puja actual
      const bidFormatted = card.find('.bid-formatted');
      const bidText = bidFormatted.text().trim();
      const price = extractPrice(bidText);
      console.log(`  💰 Puja: ${bidText} (${price || 'desconocido'})`);
      
      // Extraer tiempo restante
      const countdownText = card.find('.countdown-text');
      const timeRemaining = countdownText.text().trim();
      console.log(`  ⏱️ Tiempo: ${timeRemaining}`);
      
      // Extraer imagen
      const thumbnailImg = card.find('.thumbnail img');
      const imageUrl = thumbnailImg.attr('src') || '';
      
      // Extraer descripción
      const excerpt = card.find('.item-excerpt');
      const description = excerpt.text().trim();
      
      // Verificar si el título es relevante para la búsqueda
      if (isRelevant(title, make, model, year)) {
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url,
          imageUrl,
          year: extractYear(title) || (year ? parseInt(year) : null),
          price: price || 0,
          isAuction: true,
          currentBid: price || 0,
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
        console.log(`  ✅ Añadido como vehículo relevante`);
      } else {
        console.log(`  ❌ No es relevante para ${make} ${model} ${year || ''}`);
      }
    } catch (error: any) {
      console.error(`Error al procesar tarjeta: ${error.message}`);
    }
  });
  
  console.log(`Total: Encontrados ${vehicles.length} vehículos relevantes`);
  return vehicles;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
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
 * Extrae el precio del texto
 */
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Eliminar prefijos de moneda (USD, $, etc.)
  const cleanText = text.replace(/USD|\$|,/g, '').trim();
  
  // Buscar números en el texto
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