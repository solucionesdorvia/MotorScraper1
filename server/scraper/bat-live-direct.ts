/**
 * Scraper ULTRAESPECIALIZADO para Bring a Trailer - SOLO SUBASTAS ACTIVAS
 * Basado DIRECTAMENTE en el HTML compartido por el usuario
 * Extrae EXCLUSIVAMENTE resultados desde la sección "Live Listings"
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

export async function scrapeBringATrailerLiveDirect(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`[BaT LiveDirect] Buscando: ${make} ${model} ${year || ''}`);
  
  try {
    // Construir URL de búsqueda
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
    
    // ENFOQUE RADICAL: Extraer SOLO la sección de Live Listings
    const liveListingsStart = html.indexOf('<div class="search-result-live-listings" id="search-result-live-listings">');
    if (liveListingsStart === -1) {
      console.log('❌ No se encontró la sección "Live Listings". No hay subastas activas.');
      return [];
    }
    
    // Encontrar el final de la sección con máxima precisión
    const closingDivSection = html.indexOf('</div>\n\n        <div data-bind="if: moreItemsAvailable"></div>', liveListingsStart);
    if (closingDivSection === -1) {
      console.log('❌ No se pudo encontrar el cierre de la sección "Live Listings"');
      // Alternativa: encontrar hasta el cierre normal
      const alternativeClosing = html.indexOf('</div>\n</div>', liveListingsStart);
      if (alternativeClosing === -1) {
        console.log('❌ No se puede extraer la sección "Live Listings" correctamente');
        return [];
      }
    }
    
    // Recortar exactamente la sección Live Listings
    const closePos = closingDivSection !== -1 ? closingDivSection + 6 : html.indexOf('</div>\n</div>', liveListingsStart) + 12;
    const liveListingsHtml = html.substring(liveListingsStart, closePos);
    console.log(`✅ Sección "Live Listings" encontrada: ${liveListingsHtml.length} caracteres`);
    
    // EXTRAER RESULTADOS USANDO CHEERIO
    const $ = load(liveListingsHtml);
    const vehicles: InsertVehicle[] = [];
    
    // Encontrar todas las tarjetas de subastas activas
    $('.listing-card').each(function() {
      try {
        const $card = $(this);
        const title = $card.find('h3').text().trim();
        const url = $card.attr('href') || '';
        
        // Verificación de relevancia
        if (!isRelevant(title, make, model, year)) {
          console.log(`Ignorando subasta no relevante: ${title}`);
          return; // Skip this one
        }
        
        // Extraer imagen
        const imageUrl = $card.find('img').attr('src') || '';
        
        // Extraer precio/oferta actual
        let price = null;
        const bidText = $card.find('.bid-formatted').text().trim();
        if (bidText) {
          const priceMatch = bidText.match(/[\d,]+/);
          if (priceMatch) {
            price = parseInt(priceMatch[0].replace(/,/g, ''), 10);
          }
        }
        
        // Extraer tiempo restante
        const timeText = $card.find('.countdown-text').text().trim() || 'En curso';
        
        // Extraer año del título
        const yearMatch = title.match(/(19\d{2}|20\d{2})/);
        const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
        
        // VERIFICACIÓN FINAL: Esta verificación es redundante porque ya estamos en la sección Live Listings
        // pero la mantenemos como doble validación
        const hasActiveBidding = $card.find('.item-bidding[data-bind*="visible: active"]').length > 0;
        const isFinalCountdown = $card.find('.countdown-text.final-countdown').length > 0;
        
        // La existencia de la tarjeta en esta sección ya confirma que es activa,
        // pero si además tiene componente de "bidding" activo, mejor todavía
        if (hasActiveBidding) {
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
          
          console.log(`✅ Subasta ACTIVA encontrada: ${title} - ${price || 'sin precio'} - ${timeText}${isFinalCountdown ? ' (FINALIZANDO PRONTO)' : ''}`);
          vehicles.push(vehicle);
        } else {
          console.log(`❌ Ignorando subasta sin componente de bidding visible: ${title}`);
        }
        
      } catch (err) {
        console.error('Error al procesar tarjeta de subasta:', err);
      }
    });
    
    console.log(`Total de subastas ACTIVAS encontradas: ${vehicles.length}`);
    return vehicles;
    
  } catch (error) {
    console.error('Error en scraper BaT LiveDirect:', error);
    return [];
  }
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
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