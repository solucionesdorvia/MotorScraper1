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
    
    // Intenta primero con los listados activos
    const listings = $('#search-result-live-listings a.listing-card, #search-result-listings a.listing-card');
    console.log(`Encontrados ${listings.length} listados potenciales`);
    
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
  const search = year ? `${terms}+${year}` : terms;
  return `https://bringatrailer.com/search/?s=${search.replace(/ /g, '+')}&order=end_date`;
}

function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  const t = title.toLowerCase();
  const hasMake = t.includes(make.toLowerCase());
  const hasModel = t.includes(model.toLowerCase());
  const hasYear = !year || t.includes(year);
  
  // Si es Mustang, considerarlo como caso especial
  if (make.toLowerCase() === 'ford' && model.toLowerCase() === 'mustang') {
    return t.includes('mustang') && hasYear;
  }
  
  // Criterio general: debe contener modelo y año (si se especifica)
  return (hasMake || hasModel) && hasYear;
}
