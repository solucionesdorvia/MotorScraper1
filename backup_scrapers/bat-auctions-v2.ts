/**
 * SCRAPER ESPECIALIZADO PARA LA SECCIÓN DE AUCTIONS DE BRING A TRAILER
 * 
 * Basado en el HTML proporcionado por el usuario:
 * - URL directa: https://bringatrailer.com/auctions/?search=mustang+1968
 * - Estructura específica de la sección "auctions"
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Extrae subastas activas de la página de auctions de Bring a Trailer
 */
export async function scrapeBringATrailerAuctionsV2(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Buscando subastas activas en BaT para: ${make} ${model} ${year || ''}`);
    
    // Construir URL para la sección de auctions con los parámetros de búsqueda
    const query = `${make} ${model} ${year || ''}`.trim();
    const url = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(query)}`;
    console.log(`URL: ${url}`);
    
    // Realizar solicitud HTTP
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 15000
    });
    
    // Extraer datos del HTML
    return parseHtmlForVehicles(response.data, make, model, year);
  } catch (error: any) {
    console.error(`Error al obtener datos de BaT: ${error.message}`);
    return [];
  }
}

/**
 * Extrae vehículos de subastas activas a partir del HTML
 */
function parseHtmlForVehicles(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const $ = cheerio.load(html);
    const vehicles: InsertVehicle[] = [];
    
    console.log(`Analizando estructura HTML para Bring a Trailer...`);
    console.log(`- Etiquetas <a>: ${$('a').length}`);
    console.log(`- Etiquetas <a> con href que contiene "listing": ${$('a[href*="/listing/"]').length}`);
    console.log(`- Etiquetas con clase "listing-card": ${$('.listing-card').length}`);
    console.log(`- Etiquetas <a> con clase "listing-card": ${$('a.listing-card').length}`);
    
    // Primero, buscar enlaces directos a listados
    const directListingLinks = $('a[href*="/listing/"]');
    console.log(`Encontrados ${directListingLinks.length} enlaces directos a listados`);
    
    // Procesar los enlaces directos
    directListingLinks.each((i, element) => {
      const link = $(element);
      const href = link.attr('href') || '';
      
      // Verificar si el enlace es realmente a un listado
      if (href.includes('/listing/')) {
        // Buscar título, preferiblemente en un h3 cercano o dentro del enlace
        let title = '';
        
        // Intentar encontrar título en h3 cercanos
        const h3Element = link.find('h3').first();
        if (h3Element.length) {
          title = h3Element.text().trim();
        }
        
        // Si no encontramos título en h3, buscarlo en el contenido del enlace
        if (!title) {
          title = link.text().trim();
        }
        
        // Si sigue sin título, buscar en atributos
        if (!title) {
          title = link.attr('title') || link.attr('alt') || '';
        }
        
        // Buscar elementos relacionados con pujas y tiempo restante
        const parentElement = link.parent();
        let bidText = '';
        let timeRemaining = '';
        let imageUrl = '';
        
        // Buscar elementos de puja en el contexto cercano
        const bidElement = link.find('.bid-formatted, .bidding-bid .bold').first();
        if (bidElement.length) {
          bidText = bidElement.text().trim();
        }
        
        // Buscar elementos de tiempo en el contexto cercano
        const timeElement = link.find('.countdown-text').first();
        if (timeElement.length) {
          timeRemaining = timeElement.text().trim();
        }
        
        // Buscar imágenes en el contexto cercano
        const imgElement = link.find('img').first();
        if (imgElement.length) {
          imageUrl = imgElement.attr('src') || '';
        }
        
        console.log(`Listado encontrado: ${title || 'Sin título'} - ${href}`);
        console.log(`- Puja: ${bidText || 'No encontrada'}, Tiempo: ${timeRemaining || 'No encontrado'}`);
        
        // Verificar si el título es relevante y tenemos datos mínimos
        if (title && isRelevant(title, make, model, year)) {
          // Extraer precio
          let price = 0;
          if (bidText) {
            price = extractPrice(bidText) || 0;
          }
          
          // Crear objeto de vehículo
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            source: 'bringatrailer',
            sourceUrl: href,
            imageUrl,
            year: extractYear(title) || (year ? parseInt(year) : null),
            price,
            isAuction: true,
            currentBid: price,
            endsIn: timeRemaining,
            transmission: extractTransmission(title),
            bodyType: extractBodyType(title),
            location: 'Estados Unidos',
            mileage: null,
            color: null,
            vin: null,
            fuelType: null,
            dealerName: null,
            hasDeals: false
          };
          
          vehicles.push(vehicle);
          console.log(`✅ Vehículo relevante añadido: "${title}"`);
        } else if (title) {
          console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
        } else {
          console.log(`❌ Enlace descartado por falta de título: ${href}`);
        }
      }
    });
    
    // Si no encontramos listados directos, probar con tarjetas de listado
    if (vehicles.length === 0) {
      const listingCards = $('a.listing-card');
      console.log(`Buscando tarjetas de listado: ${listingCards.length} encontradas`);
      
      listingCards.each((i, element) => {
        const card = $(element);
        const href = card.attr('href') || '';
        
        // Extraer título
        const titleElement = card.find('h3');
        const title = titleElement.text().trim();
        
        // Extraer imagen
        const imgElement = card.find('.thumbnail img, img');
        const imageUrl = imgElement.attr('src') || '';
        
        // Extraer información de puja
        const bidElement = card.find('.bid-formatted, .bidding-bid .bold');
        const bidText = bidElement.text().trim();
        const price = extractPrice(bidText) || 0;
        
        // Extraer tiempo restante
        const timeElement = card.find('.countdown-text');
        const timeRemaining = timeElement.text().trim();
        
        console.log(`Tarjeta de listado: ${title || 'Sin título'} - ${href}`);
        console.log(`- Puja: ${bidText || 'No encontrada'}, Tiempo: ${timeRemaining || 'No encontrado'}`);
        
        // Verificar si el título es relevante
        if (title && isRelevant(title, make, model, year)) {
          // Crear objeto de vehículo
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            source: 'bringatrailer',
            sourceUrl: href,
            imageUrl,
            year: extractYear(title) || (year ? parseInt(year) : null),
            price,
            isAuction: true,
            currentBid: price,
            endsIn: timeRemaining,
            transmission: extractTransmission(title),
            bodyType: extractBodyType(title),
            location: 'Estados Unidos',
            mileage: null,
            color: null,
            vin: null,
            fuelType: null,
            dealerName: null,
            hasDeals: false
          };
          
          vehicles.push(vehicle);
          console.log(`✅ Vehículo relevante añadido: "${title}"`);
        } else if (title) {
          console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
        }
      });
    }
    
    console.log(`Total de vehículos relevantes encontrados: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error(`Error al extraer datos del HTML: ${error.message}`);
    return [];
  }
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Caso especial para "Chevrolet" que puede aparecer como "Chevy"
  let makePresent = titleLower.includes(makeLower);
  if (makeLower === "chevrolet" && titleLower.includes("chevy")) {
    makePresent = true;
  }
  
  // Caso especial para "Volkswagen" que puede aparecer como "VW"
  if (makeLower === "volkswagen" && titleLower.includes("vw")) {
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
  if (!modelPresent) {
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
 * Extrae la transmisión del título
 */
function extractTransmission(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('manual') || lowerText.includes('speed') || lowerText.includes('5-speed') || lowerText.includes('4-speed') || lowerText.includes('6-speed')) {
    // Intentar extraer el número de velocidades
    const speedMatch = lowerText.match(/(\d)(?:-|\s)?speed/i);
    if (speedMatch) {
      return `Manual ${speedMatch[1]}-Velocidades`;
    }
    return 'Manual';
  }
  
  if (lowerText.includes('automatic') || lowerText.includes('auto')) {
    return 'Automático';
  }
  
  return null;
}

/**
 * Extrae el tipo de carrocería del título
 */
function extractBodyType(text: string): string | null {
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