/**
 * ADAPTADOR DE SCRAPER PARA BRING A TRAILER BASADO EN CÓDIGO EXPRESS PROPORCIONADO
 * 
 * Este adaptador combina y mejora las técnicas del scraper Express para
 * extraer SOLO subastas activas de Bring a Trailer
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Función principal adaptada desde el código Express proporcionado
 * Combina las mejores técnicas para extraer subastas activas
 */
export async function scrapeBringATrailerAdapter(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`[BaT Adaptador Express] Buscando: ${make} ${model} ${year || ''}`);
  
  try {
    // Construir URL de búsqueda como en el código proporcionado
    const terms = model ? `${make} ${model}` : make;
    const search = year ? `${terms} ${year}` : terms;
    const searchUrl = `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`;
    
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Obtener HTML de la página
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`Error al obtener la página: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`HTML obtenido: ${html.length} caracteres`);
    
    // MÉTODO 1: Extracción manual de la sección Live Listings (del código Express)
    console.log('MÉTODO 1: Extracción manual de sección Live Listings...');
    const liveListingsSectionStart = html.indexOf('<div class="search-result-live-listings"');
    
    if (liveListingsSectionStart === -1) {
      console.log('❌ No se encontró la sección de Live Listings con el método 1');
      // Pasar a método 2 abajo
    } else {
      console.log('✅ ENCONTRADA SECCIÓN LIVE LISTINGS!');
      
      // Extraer la sección (como en el código Express)
      let openDivs = 1;
      let currentPos = liveListingsSectionStart + 10;
      let sectionEndPos = -1;
      
      while (openDivs > 0 && currentPos < html.length) {
        const nextOpenDiv = html.indexOf('<div', currentPos);
        const nextCloseDiv = html.indexOf('</div>', currentPos);
        
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
      
      if (sectionEndPos !== -1) {
        const liveListingsHtml = html.substring(liveListingsSectionStart, sectionEndPos);
        console.log(`Sección Live Listings encontrada: ${liveListingsHtml.length} caracteres`);
        
        // Cargar en Cheerio para extracción de datos
        const $ = load(liveListingsHtml);
        const vehicles: InsertVehicle[] = [];
        
        // Buscar tarjetas de listing como en el código Express
        $('a.listing-card').each(function() {
          const url = $(this).attr('href') || '';
          const title = $(this).find('h3').text().trim();
          
          // Verificar relevancia
          if (!isRelevant(title, make, model, year)) {
            console.log(`Omitiendo listado no relevante: ${title}`);
            return; // Skip this item
          }
          
          // Extraer imagen
          const imageUrl = $(this).find('img').first().attr('src') || '';
          
          // Extraer precio/oferta como en el código Express
          let price = null;
          const priceText = $(this).find('.bid-formatted').text().trim();
          if (priceText) {
            const numericMatch = priceText.match(/[\d,]+/);
            if (numericMatch) {
              price = parseInt(numericMatch[0].replace(/,/g, ''), 10);
            }
          }
          
          // Extraer tiempo restante - CLAVE para confirmar subasta activa
          const timeText = $(this).find('.countdown-text').text().trim() || 'En curso';
          
          // Extraer año del título
          const yearMatch = title.match(/(19\d{2}|20\d{2})/);
          const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
          
          // DETECCIÓN ULTRA PRECISA de subastas activas
          // 1. Debe tener elemento bidding visible (data-bind="visible: active")
          // 2. No debe tener soldText visible
          const hasActiveBidding = $(this).find('.item-bidding[data-bind*="visible: active"]').length > 0;
          const hasSoldText = $(this).find('.item-results[data-bind*="soldText"]').is(':visible');
          const isCompleted = hasSoldText || $(this).find('.item-results').text().trim() !== 'false';
          
          // Solo mostrar si tiene bidding activo Y NO tiene indicador de venta completada
          if (hasActiveBidding && !isCompleted) {
            console.log(`✅ Tiene indicadores de tiempo: ${title}`);
            
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
            
            vehicles.push(vehicle);
            console.log(`Añadido: ${title} - ${price} - ${timeText}`);
          } else {
            console.log(`❌ No parece ser una subasta activa: ${title}`);
          }
        });
        
        if (vehicles.length > 0) {
          console.log(`Total vehículos BaT: ${vehicles.length}`);
          return vehicles;
        }
      }
    }
    
    // MÉTODO 2: Búsqueda en todo el HTML para elementos específicos de subastas activas
    console.log('MÉTODO 2: Buscando elementos específicos de subastas activas en todo el HTML...');
    const $ = load(html);
    const vehicles: InsertVehicle[] = [];
    
    // Búsqueda de elementos que indican subastas activas
    // Selector expandido para maximizar captura
    $('[class*="progress"], [data-progress-percent], [class*="countdown"], [class*="timer"], .bid-formatted').each(function() {
      // Encontrar el contenedor padre (tarjeta de subasta)
      const parentCard = $(this).closest('a');
      if (!parentCard.length) return;
      
      // Extraer datos de la tarjeta
      const url = parentCard.attr('href') || '';
      let title = parentCard.find('h3').text().trim() || parentCard.find('.listing-title').text().trim();
      
      // Si no hay título o URL, ignorar
      if (!title || !url) return;
      
      // Verificar si ya existe en los resultados para evitar duplicados
      if (vehicles.some(v => v.title === title)) return;
      
      // Verificar relevancia
      if (!isRelevant(title, make, model, year)) return;
      
      const imageUrl = parentCard.find('img').attr('src') || '';
      
      // Extraer precio
      let price = null;
      const priceText = parentCard.find('.bid-formatted, [class*="bid"], [class*="price"]').text().trim();
      if (priceText) {
        const numericMatch = priceText.match(/[\d,]+/);
        if (numericMatch) {
          price = parseInt(numericMatch[0].replace(/,/g, ''), 10);
        }
      }
      
      // Extraer tiempo - criterio crítico para ser una subasta activa
      const timeText = parentCard.find('.countdown-text, [class*="countdown"]').text().trim() || 'En curso';
      
      // DETECCIÓN ULTRA PRECISA de subastas activas (método 2)
      const hasActiveBidding = parentCard.find('.item-bidding[data-bind*="visible: active"]').length > 0;
      const hasSoldText = parentCard.find('.item-results[data-bind*="soldText"]').is(':visible');
      const isCompleted = hasSoldText || parentCard.find('.item-results').text().trim() !== 'false';
      
      // Solo aceptar si tiene bidding activo Y NO tiene indicador de venta completada
      const isActive = hasActiveBidding && !isCompleted;
      
      if (isActive) {
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
        
        vehicles.push(vehicle);
        console.log(`✅ Subasta activa encontrada (método 2): ${title}`);
      }
    });
    
    console.log(`Total vehículos BaT (método 2): ${vehicles.length}`);
    return vehicles;
    
  } catch (error) {
    console.error('Error en adaptador de BaT:', error);
    return [];
  }
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 * Función mejorada combinando la lógica del código Express
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  // Normalizar a minúsculas para comparaciones coherentes
  const t = title.toLowerCase();
  const m = make.toLowerCase();
  const mod = model ? model.toLowerCase() : '';
  
  // Caso especial para Ford Mustang (como en el código Express)
  if ((m === 'ford' && mod === 'mustang') || mod === 'mustang') {
    if (!t.includes('mustang')) return false;
    if (year && !t.includes(year)) return false;
    return true;
  }
  
  // Para búsquedas generales
  let hasModel = true;
  if (mod && mod !== '') {
    hasModel = t.includes(mod);
  }
  
  // Verificar make
  const hasMake = t.includes(m);
  
  // Verificar año
  let hasYear = true;
  if (year) {
    hasYear = t.includes(year);
    
    // Probar con año corto (ej. '67' para '1967')
    if (!hasYear && year.length === 4 && year.startsWith('19')) {
      const shortYear = year.substring(2);
      hasYear = t.includes(shortYear);
    }
  }
  
  return hasMake && hasModel && hasYear;
}