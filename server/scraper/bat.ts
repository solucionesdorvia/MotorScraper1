/**
 * Scraper simplificado para Bring a Trailer
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

// Función principal para scraping de BaT
export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Iniciando scraping de Bring a Trailer para ${make} ${model} ${year || ''}`);
  
  try {
    // Construye URL para buscar en Bring a Trailer
    const searchUrl = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Obtiene HTML de la página de resultados
    const response = await fetch(searchUrl);
    if (!response.ok) return [];
    
    const html = await response.text();
    console.log(`HTML obtenido: ${html.length} caracteres`);
    
    // Extrae listados de vehículos
    const $ = load(html);
    const vehicles: InsertVehicle[] = [];
    
    // Intenta con todos los posibles selectores de listados
    const liveListings = $('#search-result-live-listings a.listing-card');
    const regularListings = $('#search-result-listings a.listing-card');
    const listingCards = $('.listing-card');
    
    // Elegimos el selector que encuentre más resultados
    let listings;
    if (liveListings.length > 0) {
      listings = liveListings;
      console.log(`Encontrados ${listings.length} listados activos`);
    } else if (regularListings.length > 0) {
      listings = regularListings;
      console.log(`Encontrados ${listings.length} listados regulares`);
    } else {
      listings = listingCards;
      console.log(`Encontrados ${listings.length} tarjetas de listado generales`);
    }
    
    // Imprimir los primeros títulos encontrados para depuración
    listings.each((i, el) => {
      if (i < 3) {
        const title = $(el).find('h3').text().trim();
        console.log(`Título ${i+1}: "${title}"`);
      }
    });
    
    // Si no encontramos nada con los selectores habituales, intentamos buscar más profundo
    if (listings.length === 0) {
      console.log('Intentando buscar listados en toda la página...');
      $('h3').each((i, el) => {
        const text = $(el).text().trim();
        if (text && isRelevant(text, make, model, year)) {
          console.log(`Título relevante encontrado: "${text}"`);
        }
      });
    }
    
    listings.each((i, el) => {
      try {
        const title = $(el).find('h3').text().trim();
        if (!title) return;
        
        // Verifica si el título es relevante para la búsqueda
        if (!isRelevant(title, make, model, year)) return;
        
        // Extrae URL, imagen y precio
        let url = $(el).attr('href') || '';
        if (url && !url.startsWith('http')) url = `https://bringatrailer.com${url}`;
        
        const img = $(el).find('.thumbnail img').attr('src') || '';
        
        // Busca precio/oferta actual
        const bidText = $(el).find('.bid-formatted').text().trim();
        let price = null;
        if (bidText) {
          const match = bidText.match(/[\$]?\s*(\d[\d,\.]+)/);
          if (match?.[1]) {
            price = parseInt(match[1].replace(/[^\d]/g, ''), 10);
          }
        }
        
        // Tiempo restante de subasta
        const timeText = $(el).find('.countdown-text').text().trim();
        
        // Verifica si la subasta está activa
        const isActive = !!timeText && 
                        !timeText.toLowerCase().includes('sold') &&
                        !timeText.toLowerCase().includes('ended') &&
                        (timeText.includes('days') || 
                         timeText.includes('hours') || 
                         timeText.includes('mins') || 
                         timeText.includes(':'));
        
        if (!isActive) return;
        
        // Extrae año del título
        const yearMatch = title.match(/(19\d{2}|20\d{2})/);
        const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : null;
        
        // Crea objeto de vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url,
          imageUrl: img,
          year: extractedYear,
          price: price,
          isAuction: true,
          currentBid: price,
          endsIn: timeText || null,
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
        console.log(`Añadido: ${title} - ${price || 'sin precio'} - ${timeText || 'sin tiempo'}`);
      } catch (err) {
        console.error('Error procesando listado:', err);
      }
    });
    
    console.log(`Total vehículos BaT: ${vehicles.length}`);
    return vehicles;
  } catch (error) {
    console.error('Error en scraper BaT:', error);
    return [];
  }
}

// Funciones auxiliares
function buildUrl(make: string, model: string, year?: string): string {
  const terms = make === model ? make : `${make} ${model}`;
  const search = year ? `${terms} ${year}` : terms;
  // Usamos el parámetro view=all para obtener todos los resultados y no solo los destacados
  return `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`;
}

function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  // Normalizamos todo a minúsculas para comparaciones
  const t = title.toLowerCase();
  const m = make.toLowerCase();
  const mod = model.toLowerCase();
  
  // Comprobamos si el título contiene la marca y/o modelo
  const hasMake = t.includes(m);
  const hasModel = t.includes(mod);
  
  // Comprobamos si el título contiene el año (si se especificó)
  let hasYear = true;
  if (year) {
    // Permite coincidencias parciales para años
    hasYear = t.includes(year);
    
    // También comprobamos si hay un año similar en el título (ej. 1967 coincide con 67)
    if (!hasYear && year.length === 4 && year.startsWith('19')) {
      const shortYear = year.substring(2); // Obtiene '67' de '1967'
      hasYear = t.includes(shortYear);
    }
  }
  
  // Casos especiales para modelos populares
  
  // Ford Mustang - caso especial
  if ((m === 'ford' && mod === 'mustang') || mod === 'mustang') {
    return t.includes('mustang') && hasYear;
  }
  
  // Chevrolet Corvette - caso especial
  if ((m === 'chevrolet' || m === 'chevy') && mod === 'corvette') {
    return (t.includes('corvette') || t.includes('vette')) && hasYear;
  }
  
  // Dodge Challenger - caso especial
  if (m === 'dodge' && mod === 'challenger') {
    return t.includes('challenger') && hasYear;
  }
  
  // Criterio general más flexible: basta con que contenga el modelo
  // Incluso si no contiene la marca, suele haber muchos resultados relevantes
  return hasModel && hasYear;
}
