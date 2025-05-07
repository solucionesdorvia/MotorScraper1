/**
 * SCRAPER DIRECTO PARA LA PÁGINA DE SUBASTAS DE BRING A TRAILER
 * 
 * Este scraper está optimizado para extraer datos directamente de la página de auctions
 * de Bring a Trailer, que contiene SOLO subastas activas.
 * 
 * URL de ejemplo: https://bringatrailer.com/auctions/?search=mustang+1967
 * 
 * Estructura del HTML:
 * - Contenedor principal: <div class="listings-container auctions-grid" id="auctions-current-container">
 * - Cada listado: <a class="listing-card bg-white-transparent">
 * - Título: <h3>
 * - Precio actual: <span class="bid-formatted bold">
 * - Tiempo restante: <span class="countdown-text">
 * - Imagen: <img> dentro de <div class="thumbnail">
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Función principal para extraer subastas activas de Bring a Trailer
 */
export async function scrapeBringATrailerDirectAuctions(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Buscando vehículos en BaT usando scraper directo: ${make} ${model} ${year || ''}`);

  try {
    // Construir la URL de búsqueda
    const searchTerms = [make, model, year].filter(Boolean).join('+');
    const url = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchTerms)}`;
    console.log(`URL de búsqueda: ${url}`);

    // Obtener el HTML
    const response = await axios.get(url);
    const html = response.data;

    console.log(`HTML obtenido (${html.length} bytes)`);

    // Extraer los vehículos del HTML
    return extractVehiclesFromAuctionsPage(html, make, model, year);
  } catch (error: any) {
    console.error(`Error al obtener datos de Bring a Trailer: ${error.message}`);
    if (error.response) {
      console.error(`Estado HTTP: ${error.response.status}`);
    }
    return [];
  }
}

/**
 * Extrae vehículos de la página de auctions
 */
function extractVehiclesFromAuctionsPage(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const $ = cheerio.load(html);
    const vehicles: InsertVehicle[] = [];
    
    console.log('Analizando página de subastas activas de Bring a Trailer...');
    
    // Buscar el contenedor principal de listings
    const auctionsContainer = $('.listings-container.auctions-grid');
    if (!auctionsContainer.length) {
      console.warn('No se encontró el contenedor de subastas activas (.listings-container.auctions-grid)');
    } else {
      console.log(`Encontrado contenedor de subastas: ${auctionsContainer.attr('id') || '[sin id]'}`);
    }
    
    // Contar el número de tarjetas de listado
    const listingCards = $('a.listing-card');
    console.log(`Encontradas ${listingCards.length} tarjetas de listado`);
    
    // Analizar cada tarjeta de listado
    listingCards.each((index, element) => {
      try {
        const card = $(element);
        const href = card.attr('href') || '';
        
        // Extraer título - intentar con diferentes selectores
        let title = '';
        
        // Primero intentamos con h3 directo
        const titleElement = card.find('h3');
        if (titleElement.length) {
          title = titleElement.text().trim();
        }
        
        // Si no encontramos título, intentamos con otros métodos
        if (!title) {
          // Intentar obtener alt de la imagen
          const imgAlt = card.find('.thumbnail img').attr('alt');
          if (imgAlt) {
            title = imgAlt.trim();
          }
        }
        
        // Incluso podemos intentar obtenerlo del URL
        if (!title && href) {
          const urlMatch = href.match(/\/listing\/([^/]+)\/?$/);
          if (urlMatch && urlMatch[1]) {
            // Convertir slug a título (e.g., "1967-ford-mustang" -> "1967 Ford Mustang")
            const slug = urlMatch[1];
            title = slug.replace(/-/g, ' ').replace(/(\d{4})/, '$1 ').trim();
            // Capitalizar cada palabra
            title = title.split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
          }
        }
        
        console.log(`Listado #${index + 1}: ${title || '[Sin título]'} - URL: ${href}`);
        
        // Extraer información de puja
        const bidElement = card.find('.bid-formatted');
        const bidText = bidElement.text().trim();
        const price = extractPrice(bidText);
        
        if (bidText) {
          console.log(`  Puja: ${bidText}`);
        }
        
        // Extraer tiempo restante
        const timeElement = card.find('.countdown-text');
        const timeRemaining = timeElement.text().trim();
        
        // Extraer imagen
        const imageElement = card.find('.thumbnail img');
        const imageUrl = imageElement.attr('src') || '';
        const imageAlt = imageElement.attr('alt') || '';
        
        // Extraer descripción (opcional)
        const excerptElement = card.find('.item-excerpt');
        const excerpt = excerptElement.text().trim();
        
        // Verificar si el título es relevante para la búsqueda
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
            price: price || 0,
            isAuction: true,
            currentBid: price || 0,
            endsIn: timeRemaining || 'En curso',
            transmission: extractTransmission(title) || extractTransmission(excerpt),
            bodyType: extractBodyType(title) || extractBodyType(excerpt),
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
          console.log(`⚠️ Listado sin título descartado`);
        }
      } catch (error: any) {
        console.error(`Error al procesar tarjeta: ${error.message}`);
      }
    });
    
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
 * Extrae el tipo de carrocería del título
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