/**
 * SCRAPER ULTRA-PRECISO PARA LIVE LISTINGS DE BRING A TRAILER
 * 
 * Este scraper está diseñado para extraer EXACTAMENTE según la estructura HTML
 * que me compartió el usuario, enfocándose SOLO en las tarjetas dentro de
 * <div class="search-result-live-listings" id="search-result-live-listings">
 * y que tienen explícitamente la clase item-bidding visible.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { InsertVehicle } from "../../shared/schema";

/**
 * Extrae SOLO las subastas activas del HTML exacto compartido por el usuario
 */
export async function scrapeBringATrailerLiveHtml(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Extrayendo SUBASTAS ACTIVAS USANDO ESTRUCTURA HTML EXACTA para ${make} ${model} ${year || ""}`);
    
    // Construir URL
    const url = buildUrl(make, model, year);
    console.log(`Consultando URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    const html = response.data;
    
    // Verificar si tenemos contenido HTML
    if (!html || typeof html !== 'string' || html.length === 0) {
      console.log("No se pudo obtener HTML de la página");
      return [];
    }
    
    // Extraer solo las subastas activas
    const liveVehicles = extractActiveLiveVehicles(html, make, model, year);
    
    console.log(`Encontradas ${liveVehicles.length} subastas REALMENTE ACTIVAS para ${make} ${model} ${year || ""}`);
    
    return liveVehicles;
    
  } catch (error) {
    console.error("Error al extraer subastas activas con estructura HTML exacta:", error);
    return [];
  }
}

/**
 * Extrae SOLO vehículos de la sección "Live Listings" con la estructura HTML EXACTA
 * que el usuario proporcionó en su archivo HTML
 */
function extractActiveLiveVehicles(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const vehicles: InsertVehicle[] = [];
    const $ = cheerio.load(html);
    
    // PASO 1: Buscar el div exacto que contiene las subastas activas (Live Listings)
    console.log("Buscando div exacto con id='search-result-live-listings'");
    const liveListingsSection = $('#search-result-live-listings');
    
    if (liveListingsSection.length === 0) {
      console.log("⚠️ No se encontró la sección de Live Listings (id='search-result-live-listings')");
      return [];
    }
    
    console.log("✅ Div de Live Listings encontrado. Buscando tarjetas de subastas activas...");
    
    // PASO 2: Encontrar las tarjetas de listing dentro de Live Listings
    // Importante: Son elementos <a class="listing-card bg-white-transparent">
    const listingCards = liveListingsSection.find('a.listing-card');
    
    console.log(`Encontradas ${listingCards.length} tarjetas de subastas en Live Listings`);
    
    // Si no hay tarjetas, retornar array vacío
    if (listingCards.length === 0) {
      console.log("⚠️ No se encontraron tarjetas de subastas en Live Listings");
      return [];
    }
    
    // PASO 3: Procesar cada tarjeta para extraer solo las subastas activas
    listingCards.each((_, card) => {
      try {
        // CRITERIO 1: Debe tener la sección item-bidding visible
        const biddingElement = $(card).find('.item-bidding[data-bind="visible: active"]');
        
        if (biddingElement.length === 0) {
          console.log("⚠️ Tarjeta sin elemento de bidding activo, saltando...");
          return;
        }
        
        // CRITERIO 2: Debe tener contador de tiempo restante
        const countdownElement = $(card).find('.countdown-text');
        
        if (countdownElement.length === 0) {
          console.log("⚠️ Tarjeta sin contador de tiempo restante, saltando...");
          return;
        }
        
        // CRITERIO 3: NO debe tener texto de item-results visible (que indica subasta finalizada)
        const resultsElement = $(card).find('.item-results[style*="display: none"]');
        
        if (resultsElement.length === 0) {
          console.log("⚠️ Tarjeta con resultados visibles (subasta finalizada), saltando...");
          return;
        }
        
        // Extraer título del vehículo
        const title = $(card).find('h3').text().trim();
        
        // Verificar que el título sea relevante para la búsqueda
        if (!isRelevant(title, make, model, year)) {
          console.log(`⚠️ Título no relevante para la búsqueda: ${title}`);
          return;
        }
        
        // Extraer URL del listado - IMPORTANTE: debe estar en el atributo href
        const url = $(card).attr('href') || '';
        
        // Extraer URL de la imagen - IMPORTANTE: debe estar en el atributo src
        const imageUrl = $(card).find('img').attr('src') || '';
        
        // Extraer precio (oferta actual) - IMPORTANTE: está dentro de .bid-formatted
        const bidText = $(card).find('.bid-formatted').text().trim();
        const price = extractPrice(bidText);
        
        // Extraer tiempo restante - IMPORTANTE: está dentro de .countdown-text
        const timeText = countdownElement.text().trim();
        
        // Extraer descripción - IMPORTANTE: está dentro de .item-excerpt
        const description = $(card).find('.item-excerpt').text().trim();
        
        console.log(`✅ SUBASTA ACTIVA ENCONTRADA: ${title}`);
        console.log(`   Oferta actual: ${bidText}`);
        console.log(`   Tiempo restante: ${timeText}`);
        
        // Crear objeto de vehículo
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
        
      } catch (error) {
        console.error("Error al procesar tarjeta de listado:", error);
      }
    });
    
    console.log(`✅ ÉXITO TOTAL: Se encontraron ${vehicles.length} subastas GENUINAMENTE ACTIVAS`);
    
    return vehicles;
  } catch (error) {
    console.error("Error al extraer vehículos activos:", error);
    return [];
  }
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildUrl(make: string, model: string, year?: string): string {
  let query = "";
  
  if (make) query += encodeURIComponent(make) + "+";
  if (model) query += encodeURIComponent(model) + "+";
  if (year) query += encodeURIComponent(year);
  
  // Eliminar el último "+" si existe
  query = query.replace(/\+$/, "");
  
  return `https://bringatrailer.com/search/?s=${query}`;
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
  
  // Extraer solo dígitos, puntos y comas del texto
  const match = text.match(/[\d,.]+/);
  if (!match) return null;
  
  // Eliminar comas y convertir a número
  const price = parseFloat(match[0].replace(/,/g, ''));
  
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
  if (text.match(/\bSedan\b/i)) return "Sedan";
  if (text.match(/\bGT\b/i)) return "GT";
  
  return null;
}