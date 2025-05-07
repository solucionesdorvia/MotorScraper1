/**
 * SCRAPER PARA LA PÁGINA DE RESULTADOS DE BÚSQUEDA GENERAL DE BRING A TRAILER
 * 
 * Este scraper está diseñado para procesar la página de resultados de búsqueda general
 * (https://bringatrailer.com/search/[query]) que tiene una estructura diferente
 * a la página de subastas activas.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { insertVehicleSchema } from '@shared/schema';
import { z } from 'zod';

type InsertVehicle = z.infer<typeof insertVehicleSchema>;

/**
 * Extrae vehículos desde la página de resultados de búsqueda general de Bring a Trailer
 */
export async function scrapeBringATrailerSearchResults(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`⚡ Buscando en la página general de resultados de BaT para: ${make} ${model} ${year || ''}`);
  
  const url = buildUrl(make, model, year);
  console.log(`Usando URL de búsqueda general: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });
    
    const html = response.data;
    console.log(`✅ HTML obtenido (${html.length} bytes) de la página de resultados de búsqueda`);
    
    return extractVehiclesFromSearchResults(html, make, model, year);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error al obtener la página de resultados de búsqueda: ${errorMessage}`);
    return [];
  }
}

/**
 * Extrae vehículos de la página de resultados de búsqueda
 */
function extractVehiclesFromSearchResults(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  console.log(`Analizando HTML para encontrar listados de ${make} ${model} ${year || ''}`);
  
  const $ = cheerio.load(html);
  const vehicles: InsertVehicle[] = [];
  
  // Buscar todos los encabezados h3 con enlaces
  const listings = $('h3 a');
  console.log(`Encontrados ${listings.length} listados potenciales en la página de resultados`);
  
  listings.each((i, element) => {
    const title = $(element).text().trim();
    const url = $(element).attr('href');
    
    // Solo procesamos si tiene título y URL
    if (title && url) {
      // Verificamos si el título es relevante para nuestra búsqueda
      if (isRelevant(title, make, model, year)) {
        console.log(`Procesando listado: "${title}" (${url})`);
        
        // Extraer el precio actual si es posible (puede no estar disponible)
        let currentBid: number | null = null;
        let bidTimeLeft: string | null = null;
        
        // Intentamos encontrar el precio y tiempo restante cerca del enlace
        const parentElements = $(element).parents();
        parentElements.each((_, parent) => {
          const parentText = $(parent).text();
          
          // Buscar patrones de precio ("Bid to $X", "Current Bid: $X", etc.)
          const priceMatch = parentText.match(/(?:Bid to|Current Bid:?|Sold for:?)\s*\$([0-9,]+)/i);
          if (priceMatch && priceMatch[1]) {
            currentBid = Number(priceMatch[1].replace(/,/g, ''));
          }
          
          // Buscar patrones de tiempo restante
          const timeMatch = parentText.match(/(\d+\s*(?:day|hour|minute|second)s?|No Reserve|Reserve Met|Auction\s*Ended)/i);
          if (timeMatch) {
            bidTimeLeft = timeMatch[0];
          }
        });
        
        // Verificar si hay indicación de subasta activa (debe contener Current Bid, o tiempo restante, etc.)
        const isActiveListing = parentElements.text().match(/(?:Current Bid|Time Left|\d+\s*(?:day|hour|minute|second)s?)/i) !== null;
        
        // Solo incluir si hay indicios de que es una subasta activa
        if (isActiveListing) {
          // Creamos el vehículo
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            year: extractYear(title) || (year ? parseInt(year) : null),
            price: currentBid || 0,
            transmission: extractTransmission(title),
            bodyType: extractBodyType(title),
            sourceUrl: url,
            imageUrl: null,
            source: 'Bring a Trailer',
            location: 'United States',
            mileage: null,
            isAuction: true,
            currentBid: currentBid || 0,
            endsIn: bidTimeLeft || 'Active auction',
            color: null,
            vin: null,
            fuelType: null,
            dealerName: null,
            hasDeals: false
          };
          
          vehicles.push(vehicle);
          console.log(`✅ Vehículo activo añadido: "${title}"`);
        } else {
          console.log(`⚠️ Listado no parece ser una subasta activa: "${title}"`);
        }
      }
    }
  });
  
  console.log(`Total: ${vehicles.length} vehículos relevantes encontrados en la página de resultados`);
  return vehicles;
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildUrl(make: string, model: string, year?: string): string {
  // Formar query para búsqueda
  let query = `${make} ${model}`.trim();
  if (year) {
    query += ` ${year}`;
  }
  
  // Reemplazar espacios por + para la URL
  const encodedQuery = query.replace(/\s+/g, '+');
  
  // URL de búsqueda general
  return `https://bringatrailer.com/search/${encodedQuery}/`;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  // Normalizar los textos para comparación (convertir a minúsculas)
  const normalizedTitle = title.toLowerCase();
  const normalizedMake = make.toLowerCase();
  const normalizedModel = model.toLowerCase();
  
  // Verificar marca y modelo
  const hasMake = normalizedTitle.includes(normalizedMake);
  const hasModel = normalizedTitle.includes(normalizedModel);
  
  // Si no se especificó año, solo verificamos marca y modelo
  if (!year) {
    return hasMake && hasModel;
  }
  
  // Si se especificó un año, verificamos si está en el título o hay uno cercano
  const titleYear = extractYear(title);
  if (titleYear !== null) {
    const targetYear = parseInt(year);
    // Permitimos un margen de ±3 años para mayor flexibilidad
    const yearDifference = Math.abs(titleYear - targetYear);
    return hasMake && hasModel && yearDifference <= 3;
  }
  
  // Si no pudimos extraer un año del título pero contiene marca y modelo,
  // lo consideramos relevante para no perder posibles resultados
  return hasMake && hasModel;
}

/**
 * Extrae el precio del texto
 */
function extractPrice(text: string): number | null {
  const priceMatch = text.match(/\$([0-9,]+)/);
  if (priceMatch && priceMatch[1]) {
    return Number(priceMatch[1].replace(/,/g, ''));
  }
  return null;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  const yearMatch = text.match(/(?:^|\s)(19[0-9]{2}|20[0-2][0-9])(?:\s|$)/);
  if (yearMatch && yearMatch[1]) {
    return parseInt(yearMatch[1]);
  }
  return null;
}

/**
 * Extrae la transmisión del título
 */
function extractTransmission(text: string): string | null {
  const normalizedText = text.toLowerCase();
  
  if (normalizedText.includes('automatic')) {
    return 'Automatic';
  } else if (normalizedText.includes('manual') || 
            normalizedText.includes('5-speed') || 
            normalizedText.includes('4-speed') || 
            normalizedText.includes('6-speed')) {
    return 'Manual';
  }
  
  return null;
}

/**
 * Extrae el tipo de carrocería del título
 */
function extractBodyType(text: string): string | null {
  const normalizedText = text.toLowerCase();
  
  if (normalizedText.includes('coupe')) {
    return 'Coupe';
  } else if (normalizedText.includes('convertible')) {
    return 'Convertible';
  } else if (normalizedText.includes('fastback')) {
    return 'Fastback';
  } else if (normalizedText.includes('sedan')) {
    return 'Sedan';
  } else if (normalizedText.includes('wagon')) {
    return 'Wagon';
  } else if (normalizedText.includes('pickup') || normalizedText.includes('truck')) {
    return 'Pickup';
  } else if (normalizedText.includes('suv')) {
    return 'SUV';
  }
  
  return null;
}