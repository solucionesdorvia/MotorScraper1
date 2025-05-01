/**
 * SCRAPER DE EMERGENCIA PARA BRING A TRAILER
 * 
 * Este scraper toma un enfoque radical: 
 * 1. Busca directamente las subastas activas en el HTML
 * 2. Extrae manualmente los datos relevantes
 * 3. Devuelve SOLO las subastas que están REALMENTE activas
 */

import { InsertVehicle } from '../../shared/schema';

export async function emergencyScrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`SCRAPER DE EMERGENCIA - Buscando: ${make} ${model} ${year || ''}`);
  
  try {
    // URL para buscar en Bring a Trailer
    const searchUrl = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Obtener HTML completo
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`Error al obtener la página: ${response.status}`);
      return [];
    }
    
    const fullHtml = await response.text();
    console.log(`HTML obtenido: ${fullHtml.length} caracteres`);
    
    // Búsqueda MANUAL de la sección "Live Listings"
    // Queremos encontrar algo como:
    // <div class="search-result-live-listings" id="search-result-live-listings">
    const liveListingsSectionStart = fullHtml.indexOf('<div class="search-result-live-listings"');
    
    if (liveListingsSectionStart === -1) {
      console.log('❌ No se encontró la sección de Live Listings');
      return extractEmergencyBackup(fullHtml, make, model, year);
    }
    
    console.log('✅ ENCONTRADA SECCIÓN LIVE LISTINGS!');
    
    // Extraer la sección completa
    // Encontrar el final de la sección (buscando el div de cierre adecuado)
    let openDivs = 1;
    let currentPos = liveListingsSectionStart + 10;
    let sectionEndPos = -1;
    
    while (openDivs > 0 && currentPos < fullHtml.length) {
      const nextOpenDiv = fullHtml.indexOf('<div', currentPos);
      const nextCloseDiv = fullHtml.indexOf('</div>', currentPos);
      
      if (nextCloseDiv === -1) break;
      
      if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
        openDivs++;
        currentPos = nextOpenDiv + 4;
      } else {
        openDivs--;
        currentPos = nextCloseDiv + 6;
        if (openDivs === 0) {
          sectionEndPos = nextCloseDiv + 6;
          break;
        }
      }
    }
    
    if (sectionEndPos === -1) {
      console.log('❌ No se pudo extraer completamente la sección Live Listings');
      return extractEmergencyBackup(fullHtml, make, model, year);
    }
    
    // Extraer el HTML de la sección Live Listings
    const liveListingsHtml = fullHtml.substring(liveListingsSectionStart, sectionEndPos);
    console.log(`Sección Live Listings encontrada: ${liveListingsHtml.length} caracteres`);
    
    // Buscar todas las tarjetas de subastas activas
    // Formato: <a class="listing-card bg-white-transparent" ... href="URL">
    const vehicles: InsertVehicle[] = [];
    let cardStartPos = 0;
    
    while (true) {
      const listingCardStart = liveListingsHtml.indexOf('<a class="listing-card', cardStartPos);
      if (listingCardStart === -1) break;
      
      // Encontrar el final de la tarjeta
      const listingCardEnd = liveListingsHtml.indexOf('</a>', listingCardStart);
      if (listingCardEnd === -1) break;
      
      // Extraer la tarjeta completa
      const cardHtml = liveListingsHtml.substring(listingCardStart, listingCardEnd + 4);
      
      // Extraer URL
      const hrefMatch = cardHtml.match(/href="([^"]+)"/);
      const url = hrefMatch ? hrefMatch[1] : '';
      
      // Extraer título
      const titleMatch = cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Verificar si es relevante para la búsqueda
      if (!isRelevant(title, make, model, year)) {
        cardStartPos = listingCardEnd + 4;
        continue;
      }
      
      // Extraer imagen
      const imgMatch = cardHtml.match(/src="([^"]+)"/);
      const imageUrl = imgMatch ? imgMatch[1] : '';
      
      // Extraer precio actual
      const priceMatch = cardHtml.match(/bid-formatted[^>]*>([^<]+)<\/span>/);
      let price = null;
      if (priceMatch) {
        const priceText = priceMatch[1].trim();
        const numericMatch = priceText.match(/[\d,]+/);
        if (numericMatch) {
          price = parseInt(numericMatch[0].replace(/,/g, ''), 10);
        }
      }
      
      // Extraer tiempo restante
      const timeMatch = cardHtml.match(/countdown-text[^>]*>([^<]+)<\/span>/);
      const timeText = timeMatch ? timeMatch[1].trim() : 'En curso';
      
      // Extraer año (si está en el título)
      const yearMatch = title.match(/(19\d{2}|20\d{2})/);
      const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
      
      console.log(`✅ Subasta REALMENTE ACTIVA encontrada: ${title}`);
      console.log(`   URL: ${url}, Precio: ${price}, Tiempo: ${timeText}`);
      
      // Crear objeto de vehículo
      const vehicle: InsertVehicle = {
        title,
        make,
        model,
        source: 'bringatrailer',
        sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
        imageUrl,
        year: extractedYear,
        price,
        isAuction: true,
        currentBid: price,
        endsIn: timeText,
        transmission: null,
        bodyType: null,
        location: 'Estados Unidos',
        mileage: null,
        color: null,
        vin: null,
        fuelType: null,
        dealerName: null,
        hasDeals: false
      };
      
      // Añadir vehículo a la lista de resultados
      vehicles.push(vehicle);
      
      // Avanzar para buscar la siguiente tarjeta
      cardStartPos = listingCardEnd + 4;
    }
    
    if (vehicles.length > 0) {
      console.log(`✅ Éxito: se encontraron ${vehicles.length} subastas REALMENTE ACTIVAS`);
      return vehicles;
    } else {
      console.log('❌ No se encontraron subastas activas relevantes en la sección Live Listings');
      
      // Intento con otra estrategia si no encontramos resultados
      return extractEmergencyBackup(fullHtml, make, model, year);
    }
    
  } catch (error) {
    console.error('Error en scraper de emergencia:', error);
    return [];
  }
}

// Función de respaldo para buscar en toda la página
function extractEmergencyBackup(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  console.log('Ejecutando estrategia de RESPALDO DE EMERGENCIA...');
  
  try {
    // Buscar manualmente las tarjetas de subasta en todo el HTML
    // Buscar todos los elementos que tengan "countdown" o "bid-formatted"
    const vehicles: InsertVehicle[] = [];
    
    // Buscar elementos con "progress-counting" que indican claramente subastas activas
    let progressPos = 0;
    const progressIndicator = 'progress-counting';
    
    while (true) {
      const progressStart = html.indexOf(progressIndicator, progressPos);
      if (progressStart === -1) break;
      
      // Retroceder para encontrar el inicio del contenedor
      const containerStart = html.lastIndexOf('<a', progressStart);
      if (containerStart === -1) {
        progressPos = progressStart + progressIndicator.length;
        continue;
      }
      
      // Avanzar para encontrar el final del contenedor
      const containerEnd = html.indexOf('</a>', progressStart);
      if (containerEnd === -1) {
        progressPos = progressStart + progressIndicator.length;
        continue;
      }
      
      // Extraer el HTML del contenedor
      const containerHtml = html.substring(containerStart, containerEnd + 4);
      
      // Extraer detalles del vehículo
      // URL
      const hrefMatch = containerHtml.match(/href="([^"]+)"/);
      const url = hrefMatch ? hrefMatch[1] : '';
      
      // Título (puede estar en diferentes lugares)
      let title = '';
      const h3Match = containerHtml.match(/<h3[^>]*>([^<]+)<\/h3>/);
      const altMatch = containerHtml.match(/alt="([^"]+)"/);
      if (h3Match) {
        title = h3Match[1].trim();
      } else if (altMatch) {
        title = altMatch[1].trim();
      }
      
      // Verificar relevancia antes de procesar más
      if (!title || !isRelevant(title, make, model, year)) {
        progressPos = progressStart + progressIndicator.length;
        continue;
      }
      
      // Imagen
      const imgMatch = containerHtml.match(/src="([^"]+)"/);
      const imageUrl = imgMatch ? imgMatch[1] : '';
      
      // Precio
      const priceMatch = containerHtml.match(/bid-formatted[^>]*>([^<]+)<\/span>/);
      let price = null;
      if (priceMatch) {
        const priceText = priceMatch[1].trim();
        const numericMatch = priceText.match(/[\d,]+/);
        if (numericMatch) {
          price = parseInt(numericMatch[0].replace(/,/g, ''), 10);
        }
      }
      
      // Tiempo restante
      const timeMatch = containerHtml.match(/countdown-text[^>]*>([^<]+)<\/span>/);
      const timeText = timeMatch ? timeMatch[1].trim() : 'En curso';
      
      // Si llegamos aquí, es una subasta claramente activa
      console.log(`✅ (RESPALDO) Subasta ACTIVA encontrada: ${title}`);
      console.log(`   URL: ${url}, Precio: ${price}, Tiempo: ${timeText}`);
      
      // Extraer año
      const yearMatch = title.match(/(19\d{2}|20\d{2})/);
      const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
      
      // Crear objeto de vehículo
      const vehicle: InsertVehicle = {
        title,
        make,
        model,
        source: 'bringatrailer',
        sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
        imageUrl,
        year: extractedYear,
        price,
        isAuction: true,
        currentBid: price,
        endsIn: timeText,
        transmission: null,
        bodyType: null,
        location: 'Estados Unidos',
        mileage: null,
        color: null,
        vin: null,
        fuelType: null,
        dealerName: null,
        hasDeals: false
      };
      
      // Añadir vehículo a la lista
      vehicles.push(vehicle);
      
      // Avanzar para buscar el siguiente progreso
      progressPos = progressStart + progressIndicator.length;
    }
    
    console.log(`Encontrados ${vehicles.length} vehículos con estrategia de respaldo`);
    return vehicles;
    
  } catch (error) {
    console.error('Error en estrategia de respaldo:', error);
    return [];
  }
}

// Funciones auxiliares
function buildUrl(make: string, model: string, year?: string): string {
  const terms = make === model ? make : `${make} ${model}`;
  const search = year ? `${terms} ${year}` : terms;
  // Parámetro view=all para obtener todos los resultados
  return `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`;
}

function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  // Normalizar a minúsculas
  const t = title.toLowerCase();
  const m = make.toLowerCase();
  const mod = model.toLowerCase();
  
  // Casos especiales para modelos populares
  
  // Ford Mustang
  if ((m === 'ford' && mod === 'mustang') || mod === 'mustang') {
    if (!t.includes('mustang')) return false;
    if (year && !t.includes(year)) return false;
    return true;
  }
  
  // Comprobar modelo y año
  const hasModel = t.includes(mod);
  let hasYear = true;
  
  if (year) {
    hasYear = t.includes(year);
    
    // También probar con año corto (ej. '67' para '1967')
    if (!hasYear && year.length === 4 && year.startsWith('19')) {
      const shortYear = year.substring(2);
      hasYear = t.includes(shortYear);
    }
  }
  
  return hasModel && hasYear;
}