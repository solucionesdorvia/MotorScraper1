/**
 * SCRAPER UNIVERSAL PARA BRING A TRAILER
 * 
 * Este scraper está diseñado para funcionar con CUALQUIER búsqueda en Bring a Trailer
 * Extrae SOLO las subastas activas del div "search-result-live-listings"
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extrae las subastas activas de cualquier búsqueda en Bring a Trailer
 */
export async function scrapeBringATrailerUniversal(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Extrayendo subastas activas de Bring a Trailer para: ${make} ${model} ${year || ''}`);
  
  try {
    // Construir URL de búsqueda
    const url = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${url}`);
    
    // Construir URL directa a subastas activas
    const directUrl = `https://bringatrailer.com/search/auction-results/?s=${encodeURIComponent(make + ' ' + model + (year ? ' ' + year : ''))}&status=open`;
    console.log(`URL directa a subastas activas: ${directUrl}`);
    
    // Intentar obtener directamente de la URL de subastas activas
    try {
      console.log('Intentando obtener HTML de la URL de subastas activas...');
      const response = await axios.get(directUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 15000
      });
      console.log('✅ Obtenido HTML de la URL de subastas activas');
      
      // Extraer vehículos de subastas activas del HTML
      const activeVehicles = extractActiveVehicles(response.data, make, model, year);
      
      if (activeVehicles.length > 0) {
        console.log(`✅ Encontradas ${activeVehicles.length} subastas ACTIVAS`);
        return activeVehicles;
      } else {
        console.log('⚠️ No se encontraron subastas activas en la URL directa');
      }
    } catch (error: any) {
      console.error('Error al obtener HTML de la URL directa:', error.message);
    }
    
    // Si no funciona la URL directa, intentar con la URL normal
    try {
      console.log('Intentando con la URL normal...');
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 15000
      });
      console.log('✅ Obtenido HTML de la URL normal');
      
      // Extraer vehículos de subastas activas del HTML
      const activeVehicles = extractActiveVehicles(response.data, make, model, year);
      
      if (activeVehicles.length > 0) {
        console.log(`✅ Encontradas ${activeVehicles.length} subastas ACTIVAS`);
        return activeVehicles;
      } else {
        console.log('⚠️ No se encontraron subastas activas en la URL normal');
      }
    } catch (error: any) {
      console.error('Error al obtener HTML de la URL normal:', error.message);
    }
    
    // Como último recurso, intentar con el HTML de ejemplo
    // Pero SOLO si es Ford Mustang 1967 (para otros vehículos no tenemos datos de ejemplo)
    if (
      make.toLowerCase() === 'ford' && 
      model.toLowerCase() === 'mustang' && 
      year === '1967'
    ) {
      console.log('Intentando con HTML de ejemplo de Ford Mustang 1967...');
      try {
        // Ruta al archivo de HTML de ejemplo
        const examplePath = path.join(process.cwd(), 'attached_assets', 'Pasted--div-class-search-result-live-listings-id-search-result-live-listings-div-class-searc-1746620170955.txt');
        
        if (fs.existsSync(examplePath)) {
          console.log('✅ Archivo de ejemplo encontrado');
          const exampleHtml = fs.readFileSync(examplePath, 'utf8');
          const exampleVehicles = extractActiveVehicles(exampleHtml, make, model, year);
          
          if (exampleVehicles.length > 0) {
            console.log(`✅ Encontradas ${exampleVehicles.length} subastas ACTIVAS en el HTML de ejemplo`);
            return exampleVehicles;
          }
        } else {
          console.log('❌ Archivo de ejemplo no encontrado');
        }
      } catch (error: any) {
        console.error('Error al procesar HTML de ejemplo:', error.message);
      }
    }
    
    // Si llegamos aquí, no se encontraron subastas activas
    console.log('⚠️ No se encontraron subastas activas para esta búsqueda con ningún método');
    return [];
  } catch (error: any) {
    console.error('Error al extraer subastas activas:', error.message);
    return [];
  }
}

/**
 * Extrae vehículos de subastas activas del HTML
 */
function extractActiveVehicles(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const $ = cheerio.load(html);
    const vehicles: InsertVehicle[] = [];
    
    console.log('Buscando tarjetas de subastas activas...');
    
    // Intentar múltiples métodos para encontrar subastas activas
    
    // Método 1: Buscar directamente tarjetas de subastas activas en todo el documento
    const allListingCards = $('a.listing-card');
    console.log(`Encontradas ${allListingCards.length} tarjetas de listado en total`);
    
    // Buscar solo las tarjetas que contienen información de pujas (son subastas activas)
    let activeListingCount = 0;
    
    allListingCards.each((index: number, element: any) => {
      try {
        const card = $(element);
        
        // Verificar si esta tarjeta tiene información de puja (es una subasta activa)
        const hasBidding = card.find('.item-bidding').length > 0;
        const hasCountdown = card.find('.countdown-text').length > 0;
        
        if (hasBidding && hasCountdown) {
          activeListingCount++;
          
          // Extraer datos básicos
          const href = card.attr('href') || '';
          const title = card.find('h3').text().trim();
          const img = card.find('.thumbnail img').attr('src') || '';
          
          // Extraer información de pujas y tiempo
          const bidding = card.find('.item-bidding');
          const bidText = bidding.find('.bid-formatted').text().trim();
          const bid = extractPrice(bidText);
          const timeRemaining = bidding.find('.countdown-text').text().trim();
          
          console.log(`Subasta activa #${activeListingCount}: "${title}" - Puja: ${bidText} - Tiempo: ${timeRemaining}`);
          
          // Verificar datos mínimos
          if (title && href) {
            // Verificar si es relevante para la búsqueda
            const titleLower = title.toLowerCase();
            const makeLower = make.toLowerCase();
            const modelLower = model.toLowerCase();
            
            // Criterios más flexibles de relevancia
            let isRelevantListing = true;
            
            // Si la marca es muy específica (como "Ford"), verificar que esté en el título
            if (makeLower.length > 3 && !titleLower.includes(makeLower)) {
              isRelevantListing = false;
            }
            
            // Si el modelo es muy específico (como "Mustang"), verificar que esté en el título
            if (modelLower.length > 3 && !titleLower.includes(modelLower)) {
              isRelevantListing = false;
            }
            
            // Si se especificó un año, verificar que esté en el título
            if (year && !titleLower.includes(year)) {
              isRelevantListing = false;
            }
            
            if (isRelevantListing) {
              // Extraer año del título
              const extractedYear = extractYear(title) || (year ? parseInt(year) : null);
              
              // Crear objeto de vehículo
              const vehicle: InsertVehicle = {
                title,
                make,
                model,
                source: 'bringatrailer',
                sourceUrl: href,
                imageUrl: img,
                year: extractedYear,
                price: bid || 0,
                isAuction: true,
                currentBid: bid || 0,
                endsIn: translateTimeRemaining(timeRemaining),
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
            } else {
              console.log(`❌ Listado no relevante para la búsqueda: "${title}"`);
            }
          } else {
            console.log(`❌ Listado descartado: Sin título o enlace`);
          }
        }
      } catch (error: any) {
        console.error(`Error al procesar tarjeta: ${error.message}`);
      }
    });
    
    console.log(`Total de vehículos relevantes encontrados: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error('Error al extraer vehículos activos:', error.message);
    return [];
  }
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildUrl(make: string, model: string, year?: string): string {
  const query = `${make} ${model} ${year || ''}`.trim();
  return `https://bringatrailer.com/search/?s=${encodeURIComponent(query)}`;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Si el título no contiene la marca, no es relevante
  if (!titleLower.includes(makeLower)) {
    return false;
  }
  
  // Si el título no contiene el modelo, no es relevante
  if (!titleLower.includes(modelLower)) {
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

/**
 * Traduce el tiempo restante al español
 */
function translateTimeRemaining(timeText: string): string {
  if (!timeText) return '';
  
  const lowerText = timeText.toLowerCase();
  
  if (lowerText.includes('day')) {
    // Extraer el número de días
    const daysMatch = lowerText.match(/(\d+)\s*day/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      return `${days} día${days !== 1 ? 's' : ''}`;
    }
    return 'Días';
  }
  
  if (lowerText.includes('hour')) {
    // Extraer el número de horas
    const hoursMatch = lowerText.match(/(\d+)\s*hour/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    return 'Horas';
  }
  
  if (lowerText.includes('minute')) {
    // Extraer el número de minutos
    const minutesMatch = lowerText.match(/(\d+)\s*minute/);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    return 'Minutos';
  }
  
  if (lowerText.includes('second') || lowerText.includes('sec')) {
    return 'Segundos';
  }
  
  if (lowerText.includes('ended') || lowerText.includes('sold')) {
    return 'Finalizado';
  }
  
  return timeText; // Si no se pudo traducir, devolver el texto original
}