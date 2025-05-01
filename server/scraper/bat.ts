/**
 * Scraper mejorado para Bring a Trailer
 * Diseñado para extraer listados de vehículos de la página de búsqueda
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

// Función principal para scraping de BaT
export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Iniciando scraping de Bring a Trailer para ${make} ${model} ${year || ''}`);
  
  try {
    // Construye URL para buscar en Bring a Trailer con formato correcto
    const searchUrl = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Obtiene HTML de la página de resultados
    const response = await fetch(searchUrl);
    if (!response.ok) return [];
    
    const html = await response.text();
    console.log(`HTML obtenido: ${html.length} caracteres`);
    
    // Extrae listados de vehículos usando Cheerio
    const $ = load(html);
    const vehicles: InsertVehicle[] = [];
    
    // Analizar la estructura de la página
    console.log('Analizando estructura de la página de resultados...');
    
    // Buscar el título de los resultados de búsqueda
    const searchResults = $('h2:contains("Search Results")').text().trim();
    console.log(`Título de resultados: ${searchResults}`);
    
    // Buscar la sección de listados activos
    const liveListingsHeading = $('h2:contains("Live Listings")');
    if (liveListingsHeading.length > 0) {
      console.log(`Sección Live Listings: ${liveListingsHeading.text().trim()}`);
    }
    
    // Listados de vehículos - múltiples selectores para diferentes partes de la página
    // Basado en la estructura vista en la captura de pantalla e HTML proporcionado
    
    // 1. Buscar enlaces directos a listados
    const listingLinks = $('a[href*="/listing/"]').filter(function() {
      const href = $(this).attr('href') || '';
      // Solo incluir enlaces que parezcan ser de vehículos
      return href.includes('mustang') || href.includes(model.toLowerCase());
    });
    
    console.log(`Encontrados ${listingLinks.length} enlaces a listados`);
    
    // 2. Usar los enlaces para encontrar los contenedores de las tarjetas
    const cardContainers = new Set();
    
    // Procesar cada enlace encontrado para extraer datos de vehículos
    listingLinks.each((i, link) => {
      try {
        // Obtener URL del listado
        let url = $(link).attr('href') || '';
        if (!url) return;
        
        if (!url.startsWith('http')) {
          url = `https://bringatrailer.com${url}`;
        }
        
        // Buscar el contenedor padre que tiene toda la info del listado
        // Podemos navegar hacia arriba buscando contenedores que tengan la info completa
        let container = $(link);
        if (!container.hasClass('listing-card')) {
          // Usar closest para buscar el contenedor más cercano que coincida con estos selectores
          const closestContainer = container.closest('.listing-card, .search-result-grid-item, .previous-listing');
          // Solo asignar si encontramos algo
          if (closestContainer.length > 0) {
            container = closestContainer;
          }
        }
        
        // Si no encontramos contenedor, usar el enlace directamente
        if (container.length === 0) {
          container = $(link);
        }
        
        // Si ya procesamos este contenedor, omitirlo
        if (cardContainers.has(container[0])) return;
        cardContainers.add(container[0]);
        
        // Extraer título - buscar en diferentes lugares posibles
        let title = '';
        title = container.find('h3').text().trim() || 
                $(link).text().trim() || 
                $(link).attr('title') || 
                $(link).find('img').attr('alt') || 
                '';
        
        if (!title) {
          // Si no encontramos título en el contenedor, buscar en el enlace o sus atributos
          const linkText = $(link).text().trim();
          const linkTitle = $(link).attr('title');
          const imgAlt = $(link).find('img').attr('alt');
          title = linkText || linkTitle || imgAlt || '';
        }
        
        // Verificar si el título es relevante para nuestra búsqueda
        if (!title || !isRelevant(title, make, model, year)) return;
        
        // Buscar imagen - puede estar en diferentes lugares
        let imageUrl = container.find('img').attr('src') || 
                        $(link).find('img').attr('src') || 
                        '';
        
        // Buscar información de la subasta
        // El precio puede estar en diferentes lugares dependiendo de la estructura
        let bidText = container.find('.bid-formatted').text().trim() || 
                      container.find('.bidding-bid').text().trim();
        
        // Si no hay texto de oferta directo, buscar otros indicadores de precio
        if (!bidText) {
          // Buscar en el texto resultados formateados de precio
          const priceResultsText = container.find('.item-results').text().trim();
          
          // Si encontramos resultados, usarlos
          if (priceResultsText) {
            bidText = priceResultsText;
          } else {
            // Intentar buscar patrones de precio en el texto del contenedor
            const priceMatch = container.text().match(/(?:USD|\$)\s*[\d,]+/);
            if (priceMatch && priceMatch[0]) {
              bidText = priceMatch[0];
            } else {
              bidText = '';
            }
          }
        }
        
        // Convertir el texto de la oferta a un número
        let price = null;
        if (bidText) {
          // Intentar extraer el número de diferentes formatos posibles
          const priceMatch = bidText.toString().match(/(?:\$)?\s*(\d[\d,]*)/);
          if (priceMatch && priceMatch[1]) {
            price = parseInt(priceMatch[1].replace(/[^\d]/g, ''), 10);
          }
        }
        
        // Buscar tiempo restante - clave para identificar subastas activas
        let timeText = container.find('.countdown-text').text().trim() || 
                      container.find('.bidding-countdown').text().trim();
        
        // Buscar indicadores adicionales de subasta activa
        // 1. Buscar iconos o textos que indiquen actividad
        const hasActiveIndicators = (
          container.find('.icon-clock').length > 0 ||
          container.find('.progress-counting').length > 0 ||
          container.find('progress[value]').length > 0 ||
          timeText.includes('days') ||
          timeText.includes('hours') ||
          timeText.includes('mins') ||
          timeText.includes(':') ||
          container.text().includes('ending')
        );
        
        // Verificar si la subasta está activa
        const isActive = !!timeText && 
                        !timeText.toLowerCase().includes('sold') &&
                        !timeText.toLowerCase().includes('ended') &&
                        hasActiveIndicators;
        
        // Sólo incluir subastas activas - importante para los requisitos del usuario
        if (!isActive) {
          console.log(`Omitiendo subasta no activa: ${title}`);
          return;
        }
        
        // Extraer año del título
        const yearMatch = title.match(/(19\d{2}|20\d{2})/);
        const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
        
        // Crear objeto de vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url,
          imageUrl,
          year: extractedYear,
          price,
          isAuction: true,
          currentBid: price,
          endsIn: isActive ? timeText : null,
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
        
        // Solo añadir vehículo si tiene URL, título y (idealmente) precio
        if (url && title) {
          vehicles.push(vehicle);
          console.log(`Añadido: ${title} - ${price || 'sin precio'} - ${timeText || 'sin tiempo'}`);
        }
        
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
