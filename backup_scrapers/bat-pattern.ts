/**
 * SCRAPER BASADO EN PATRONES ESPECÍFICOS PARA BRING A TRAILER
 * 
 * Este scraper está diseñado para manejar el HTML específico proporcionado por
 * el usuario, que tiene una estructura particular con Knockout.js.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Extrae subastas activas usando el patrón específico del HTML
 */
export async function scrapeBringATrailerPattern(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Buscando subastas activas en BaT usando patrones específicos para: ${make} ${model} ${year || ''}`);
    
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
    
    // Aquí analizamos contenido específico que sabemos que existe en el HTML
    return extractVehiclesFromPattern(response.data, make, model, year);
  } catch (error: any) {
    console.error(`Error al obtener datos de BaT con patrón específico: ${error.message}`);
    return [];
  }
}

/**
 * Extrae datos de vehículos del HTML basado en el patrón proporcionado
 */
function extractVehiclesFromPattern(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const $ = cheerio.load(html);
    const vehicles: InsertVehicle[] = [];
    
    console.log('Analizando HTML con patrón específico...');
    
    // Buscar todos los enlaces de listado
    $('a[href*="/listing/"]').each((index, element) => {
      try {
        const card = $(element);
        const href = card.attr('href') || '';
        const pusher = card.attr('data-pusher') || '';
        
        // Verificar si es un listado válido
        if (href.includes('/listing/')) {
          console.log(`Encontrado enlace de listado: ${href}`);
          
          // Extraer título del elemento h3
          const titleElement = card.find('h3');
          const title = titleElement.text().trim();
          console.log(`  Título: ${title || 'No encontrado'}`);
          
          // Extraer imagen
          const imageElement = card.find('.thumbnail img');
          const imageUrl = imageElement.attr('src') || '';
          
          // Extraer descripción
          const excerptElement = card.find('.item-excerpt');
          const excerpt = excerptElement.text().trim();
          console.log(`  Descripción: ${excerpt ? 'Encontrada' : 'No encontrada'}`);
          
          // Extraer información de puja
          const bidElement = card.find('.bid-formatted');
          const bidText = bidElement.text().trim();
          console.log(`  Puja: ${bidText || 'No encontrada'}`);
          
          // Extraer tiempo restante
          const timeElement = card.find('.countdown-text');
          const timeRemaining = timeElement.text().trim();
          console.log(`  Tiempo restante: ${timeRemaining || 'No encontrado'}`);
          
          // Verificar si el título es relevante
          if (title && isRelevant(title, make, model, year)) {
            // Extraer precio
            const price = extractPrice(bidText);
            
            // Crear objeto de vehículo
            const vehicle: InsertVehicle = {
              title,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl: href,
              imageUrl,
              year: extractYear(title) || (year ? parseInt(year) : null),
              price: price || 0,
              isAuction: true,
              currentBid: price || 0,
              endsIn: timeRemaining || 'En curso',
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
            console.log(`✅ Vehículo relevante añadido: "${title}" con puja ${bidText}`);
          } else if (title) {
            console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
          } else {
            console.log(`❌ Listado sin título descartado: ${href}`);
          }
        }
      } catch (error: any) {
        console.error(`Error al procesar tarjeta: ${error.message}`);
      }
    });
    
    // Si no encontramos listados, intentar un enfoque más laxo buscando dentro de cualquier div
    if (vehicles.length === 0) {
      console.log('Intentando búsqueda más flexible de listados...');
      
      // Buscar divs que contengan href a listing
      $('div').each((index, element) => {
        const div = $(element);
        const html = div.html() || '';
        
        // Si el div contiene "/listing/" en su HTML, podría contener información valiosa
        if (html.includes('/listing/')) {
          console.log(`Div #${index} contiene referencias a listados, analizando...`);
          
          // Buscar URLs de listados dentro del HTML
          const listingRegex = /href="(https:\/\/bringatrailer\.com\/listing\/[^"]+)"/g;
          let match;
          while ((match = listingRegex.exec(html)) !== null) {
            const listingUrl = match[1];
            console.log(`  URL de listado encontrada: ${listingUrl}`);
            
            // Buscar título en proximidad a la URL
            const titleMatch = new RegExp(`href="${listingUrl}"[^>]*>.*?<h3[^>]*>([^<]+)<\/h3>`, 's').exec(html);
            const title = titleMatch ? titleMatch[1].trim() : '';
            
            if (title && isRelevant(title, make, model, year)) {
              // Buscar puja cerca del título
              const bidRegex = new RegExp(`${title}.*?bid-formatted[^>]*>([^<]+)<\/span>`, 's');
              const bidMatch = bidRegex.exec(html);
              const bidText = bidMatch ? bidMatch[1].trim() : '';
              
              // Buscar tiempo restante
              const timeRegex = new RegExp(`${title}.*?countdown-text[^>]*>([^<]+)<\/span>`, 's');
              const timeMatch = timeRegex.exec(html);
              const timeRemaining = timeMatch ? timeMatch[1].trim() : '';
              
              // Buscar imagen
              const imgRegex = new RegExp(`href="${listingUrl}"[^>]*>.*?<img[^>]*src="([^"]+)"`, 's');
              const imgMatch = imgRegex.exec(html);
              const imageUrl = imgMatch ? imgMatch[1] : '';
              
              console.log(`  Título: ${title}, Puja: ${bidText}, Tiempo: ${timeRemaining}`);
              
              // Extraer precio
              const price = extractPrice(bidText);
              
              // Crear objeto de vehículo
              const vehicle: InsertVehicle = {
                title,
                make,
                model,
                source: 'bringatrailer',
                sourceUrl: listingUrl,
                imageUrl,
                year: extractYear(title) || (year ? parseInt(year) : null),
                price: price || 0,
                isAuction: true,
                currentBid: price || 0,
                endsIn: timeRemaining || 'En curso',
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
              console.log(`✅ Vehículo relevante añadido desde HTML: "${title}"`);
            } else if (title) {
              console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
            }
          }
        }
      });
    }
    
    console.log(`Total de vehículos relevantes encontrados con patrón específico: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error(`Error al extraer datos con patrón específico: ${error.message}`);
    return [];
  }
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