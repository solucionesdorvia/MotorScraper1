/**
 * SCRAPER ULTRA-DIRECTO PARA BRING A TRAILER
 * 
 * Este scraper consulta directamente la URL de subastas activas
 * sin depender de la búsqueda normal y extrae SOLO subastas activas.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { InsertVehicle } from "../../shared/schema";

/**
 * Extrae directamente subastas activas de Bring a Trailer
 * usando la URL directa de subastas activas (auction-results?status=open)
 */
export async function scrapeBringATrailerDirectUrl(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Obteniendo SOLO subastas activas para ${make} ${model} ${year || ""} mediante URL directa...`);
    
    // URL directa de subastas activas
    const url = "https://bringatrailer.com/auction-results?status=open";
    
    console.log(`Consultando URL de subastas activas: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    const html = response.data;
    
    // Verificar si tenemos contenido HTML
    if (!html || html.length === 0) {
      console.log("No se pudo obtener HTML de la página de subastas activas");
      return [];
    }

    console.log("Página de subastas activas obtenida, extrayendo vehículos...");
    
    // Extraer solo vehículos relevantes para la búsqueda
    const vehicles = extractActiveVehicles(html, make, model, year);
    
    console.log(`Encontrados ${vehicles.length} vehículos activos relevantes para ${make} ${model} ${year || ""}`);
    
    return vehicles;
    
  } catch (error) {
    console.error("Error al obtener subastas activas directamente:", error);
    return [];
  }
}

/**
 * Extrae vehículos activos de la página de subastas activas
 */
function extractActiveVehicles(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const vehicles: InsertVehicle[] = [];
    const $ = cheerio.load(html);
    
    // Buscar todas las tarjetas de listado
    // Estructura esperada: <a class="listing-card">...</a>
    const listingCards = $('.listing-card');
    
    console.log(`Encontradas ${listingCards.length} tarjetas de listado en total`);
    
    listingCards.each((_, card) => {
      try {
        // Extraer título del vehículo
        const title = $(card).find('h3').text().trim();
        
        // Solo procesar si es relevante para nuestra búsqueda
        if (!isRelevant(title, make, model, year)) {
          return;
        }
        
        // Extraer URL del listado y de la imagen
        const url = $(card).attr('href') || '';
        const imageUrl = $(card).find('img').attr('src') || '';
        
        // Extraer precio (oferta actual)
        const priceText = $(card).find('.bid-formatted').text().trim();
        const price = extractPrice(priceText);
        
        // Extraer tiempo restante
        const timeText = $(card).find('.countdown-text').text().trim();
        
        // Extraer descripción
        const description = $(card).find('.item-excerpt').text().trim();
        
        // Comprobar indicadores de subasta activa
        // 1. Debe tener barra de progreso
        const hasProgressBar = $(card).find('progress').length > 0;
        
        // 2. Debe tener sección de oferta con precio actual
        const hasBidding = $(card).find('.item-bidding').length > 0;
        
        // 3. Debe tener contador de tiempo restante
        const hasCountdown = $(card).find('.countdown-text').length > 0;
        
        // Solo incluir si es una subasta activa
        if (hasProgressBar && hasBidding && hasCountdown) {
          console.log(`Añadiendo subasta activa: ${title} - Oferta: ${priceText} - Tiempo: ${timeText}`);
          
          const vehicle: InsertVehicle = {
            source: "bringatrailer",
            sourceUrl: url,
            imageUrl,
            title,
            price: price || 0,
            year: extractYear(title) || (year ? parseInt(year) : 0),
            make,
            model,
            mileage: null,
            bodyType: extractBodyType(title),
            fuelType: null,
            transmission: extractTransmission(title),
            dealerName: "Bring a Trailer",
            location: "USA",
            auctionData: {
              isAuction: true,
              currentBid: price || 0,
              endsIn: timeText || "En curso"
            }
          };
          
          vehicles.push(vehicle);
        } else {
          console.log(`Ignorando listado no activo: ${title}`);
        }
      } catch (error) {
        console.error("Error al procesar tarjeta de listado:", error);
      }
    });
    
    return vehicles;
  } catch (error) {
    console.error("Error al extraer vehículos activos:", error);
    return [];
  }
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  const lowerTitle = title.toLowerCase();
  const lowerMake = make.toLowerCase();
  const lowerModel = model.toLowerCase();
  
  // Comprobar si contiene la marca y el modelo
  const hasMakeAndModel = lowerTitle.includes(lowerMake) && lowerTitle.includes(lowerModel);
  
  // Si se especificó un año, comprobar si también está en el título
  if (year && hasMakeAndModel) {
    return lowerTitle.includes(year);
  }
  
  return hasMakeAndModel;
}

/**
 * Extrae el precio del texto
 */
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Extraer solo dígitos y puntos del texto
  const digitsOnly = text.replace(/[^0-9.]/g, '');
  const price = parseFloat(digitsOnly);
  
  return isNaN(price) ? null : price;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  if (!text) return null;
  
  // Buscar un patrón de año (19xx o 20xx)
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  
  if (yearMatch && yearMatch[1]) {
    return parseInt(yearMatch[1]);
  }
  
  return null;
}

/**
 * Extrae la transmisión del título
 */
function extractTransmission(text: string): string | null {
  if (!text) return null;
  
  // Patrones comunes de transmisiones
  if (text.match(/\b\d+[-\s]?Speed\b/i)) {
    return text.match(/\b\d+[-\s]?Speed\b/i)?.[0] || null;
  }
  
  if (text.match(/\bManual\b/i)) return "Manual";
  if (text.match(/\bAutomatic\b/i)) return "Automatic";
  if (text.match(/\bAuto\b/i)) return "Automatic";
  if (text.match(/\bCVT\b/i)) return "CVT";
  if (text.match(/\bDCT\b/i)) return "DCT";
  
  return null;
}

/**
 * Extrae el tipo de carrocería del título
 */
function extractBodyType(text: string): string | null {
  if (!text) return null;
  
  // Patrones comunes de carrocerías
  if (text.match(/\bFastback\b/i)) return "Fastback";
  if (text.match(/\bConvertible\b/i)) return "Convertible";
  if (text.match(/\bCoupe\b/i)) return "Coupe";
  if (text.match(/\bSports\s?Roof\b/i)) return "SportsRoof";
  if (text.match(/\bHardtop\b/i)) return "Hardtop";
  if (text.match(/\bSedan\b/i)) return "Sedan";
  if (text.match(/\bGT\b/i)) return "GT";
  if (text.match(/\bMach\s*1\b/i)) return "Mach 1";
  if (text.match(/\bBoss\b/i)) return "Boss";
  if (text.match(/\bShelby\b/i)) return "Shelby";
  
  return null;
}