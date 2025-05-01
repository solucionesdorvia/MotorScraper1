// Script para demostrar cómo se puede utilizar el scraper optimizado
// Este script es standalone y puede ejecutarse directamente

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Función principal que extrae SOLO subastas activas de Bring a Trailer
 * Detecta elementos específicos que indican que es una subasta activa
 */
async function getActiveBringATrailerListings(make, model, year) {
  console.log(`🔍 Buscando subastas ACTIVAS para: ${make} ${model} ${year || ''}`);
  
  // Construir URL de búsqueda
  const terms = model ? `${make} ${model}` : make;
  const search = year ? `${terms} ${year}` : terms;
  const searchUrl = `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`;
  
  console.log(`📡 URL de búsqueda: ${searchUrl}`);
  
  try {
    // Obtener HTML completo
    const response = await axios.get(searchUrl);
    const html = response.data;
    
    console.log(`✅ HTML obtenido: ${html.length} caracteres`);
    
    // Buscar la sección "Live Listings"
    const liveListingsSectionStart = html.indexOf('<div class="search-result-live-listings"');
    
    if (liveListingsSectionStart === -1) {
      console.log('❌ No se encontró la sección de Live Listings, buscando con método alternativo');
      return searchForActiveAuctionElements(html, make, model, year);
    }
    
    console.log('✅ ENCONTRADA SECCIÓN LIVE LISTINGS!');
    
    // Extraer sección Live Listings
    // Este método busca el div de apertura y cierre correspondiente
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
    
    if (sectionEndPos === -1) {
      console.log('❌ No se pudo extraer completamente la sección Live Listings');
      return searchForActiveAuctionElements(html, make, model, year);
    }
    
    // Extraer HTML de la sección Live Listings
    const liveListingsHtml = html.substring(liveListingsSectionStart, sectionEndPos);
    
    // Cargar el HTML en Cheerio para facilitar la extracción
    const $ = cheerio.load(liveListingsHtml);
    const listings = [];
    
    // Buscar todas las tarjetas de subastas activas
    // Formato: <a class="listing-card bg-white-transparent" ... href="URL">
    $('a.listing-card').each(function() {
      // Extraer datos básicos
      const url = $(this).attr('href');
      const title = $(this).find('h3').text().trim();
      
      // Verificar si es relevante para la búsqueda
      if (!isRelevant(title, make, model, year)) {
        return;
      }
      
      // Extraer imagen
      const imageUrl = $(this).find('img').first().attr('src') || '';
      
      // Extraer precio actual (oferta)
      let price = null;
      const priceText = $(this).find('.bid-formatted').text().trim();
      if (priceText) {
        const numericMatch = priceText.match(/[\d,]+/);
        if (numericMatch) {
          price = parseInt(numericMatch[0].replace(/,/g, ''), 10);
        }
      }
      
      // Extraer tiempo restante
      const timeText = $(this).find('.countdown-text').text().trim() || 'En curso';
      
      // Extraer año
      const yearMatch = title.match(/(19\d{2}|20\d{2})/) 
      const extractedYear = yearMatch ? parseInt(yearMatch[0]) : (year ? parseInt(year) : null);
      
      console.log(`✅ Subasta ACTIVA encontrada: ${title}`);
      
      // Crear objeto de subasta con formato coherente
      const listing = {
        title,
        price: price,
        currentBid: price,
        ending: timeText,
        endsIn: timeText,
        link: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
        sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
        imageUrl,
        year: extractedYear,
        source: 'bringatrailer',
        isAuction: true,
        make,
        model,
        mileage: null,
        transmission: null,
        bodyType: null,
        location: 'Estados Unidos',
        color: null,
        vin: null,
        fuelType: null,
        dealerName: null,
        hasDeals: false
      };
      
      listings.push(listing);
    });
    
    if (listings.length > 0) {
      console.log(`✅ ÉXITO: se encontraron ${listings.length} subastas REALMENTE ACTIVAS`);
      return listings;
    }
    
    // Si no encontramos resultados, probamos con el método de respaldo
    console.log('No se encontraron subastas activas en la sección Live Listings');
    return searchForActiveAuctionElements(html, make, model, year);
    
  } catch (error) {
    console.error('Error en scraper:', error);
    throw error;
  }
}

/**
 * Método alternativo que busca elementos específicos de subastas activas
 * en toda la página HTML
 */
function searchForActiveAuctionElements(html, make, model, year) {
  console.log('Buscando elementos específicos de subastas activas en toda la página...');
  
  const $ = cheerio.load(html);
  const listings = [];
  
  // Buscar elementos con atributos que indican subastas activas
  // como "progress-counting" o "data-progress-percent"
  $('[class*="progress"], [data-progress-percent], [class*="countdown"]').each(function() {
    // Encontrar el contenedor padre que sea un enlace <a>
    const container = $(this).closest('a');
    if (!container.length) return;
    
    // Extraer URL y título
    const url = container.attr('href');
    let title = container.find('h3').text().trim() || container.find('img').attr('alt') || '';
    
    // Si no hay título o URL, ignorar
    if (!title || !url) return;
    
    // Verificar relevancia
    if (!isRelevant(title, make, model, year)) return;
    
    // Extraer imagen
    const imageUrl = container.find('img').attr('src') || '';
    
    // Extraer precio
    let price = null;
    const priceText = container.find('.bid-formatted, [class*="bid"], [class*="price"]').text().trim();
    if (priceText) {
      const numericMatch = priceText.match(/[\d,]+/);
      if (numericMatch) {
        price = parseInt(numericMatch[0].replace(/,/g, ''), 10);
      }
    }
    
    // Extraer tiempo
    const timeText = container.find('.countdown-text, [class*="countdown"]').text().trim() || 'En curso';
    
    // Extraer año
    const yearMatch = title.match(/(19\d{2}|20\d{2})/);
    const extractedYear = yearMatch ? parseInt(yearMatch[0]) : (year ? parseInt(year) : null);
    
    console.log(`✅ (ALTERNATIVO) Subasta ACTIVA encontrada: ${title}`);
    
    // Crear objeto con la información de la subasta
    const listing = {
      title,
      price: price,
      currentBid: price,
      ending: timeText,
      endsIn: timeText,
      link: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
      sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
      imageUrl,
      year: extractedYear,
      source: 'bringatrailer',
      isAuction: true,
      make,
      model,
      mileage: null,
      transmission: null,
      bodyType: null,
      location: 'Estados Unidos',
      color: null,
      vin: null,
      fuelType: null,
      dealerName: null,
      hasDeals: false
    };
    
    listings.push(listing);
  });
  
  console.log(`Método alternativo encontró ${listings.length} subastas activas`);
  return listings;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title, make, model, year) {
  if (!title) return false;
  
  // Normalizar a minúsculas
  const t = title.toLowerCase();
  const m = make.toLowerCase();
  const mod = model ? model.toLowerCase() : '';
  
  // Caso especial para Ford Mustang
  if ((m === 'ford' && mod === 'mustang') || mod === 'mustang') {
    if (!t.includes('mustang')) return false;
    if (year && !t.includes(year)) return false;
    return true;
  }
  
  // Para búsquedas generales
  let hasModel = true;
  if (mod) {
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

// Exportar las funciones para uso en otros archivos
export {
  getActiveBringATrailerListings,
  searchForActiveAuctionElements,
  isRelevant
};

// Ejecutar como script independiente si es invocado directamente
if (process.argv[1] === import.meta.url.substring(7)) { // quitar el 'file://'
  const make = process.argv[2] || 'ford';
  const model = process.argv[3] || 'mustang';
  const year = process.argv[4];
  
  console.log(`Ejecutando búsqueda para: ${make} ${model} ${year || ''}`);
  
  getActiveBringATrailerListings(make, model, year)
    .then(listings => {
      console.log(`\n--- RESULTADOS (${listings.length} subastas) ---`);
      listings.forEach((listing, i) => {
        console.log(`\n${i + 1}. ${listing.title}`);
        console.log(`   Precio: ${listing.price || 'N/A'}`);
        console.log(`   Termina: ${listing.endsIn}`);
        console.log(`   URL: ${listing.sourceUrl}`);
      });
    })
    .catch(err => {
      console.error('Error:', err);
    });
}