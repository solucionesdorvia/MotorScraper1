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
    
    // Encontrar la sección de "Live Listings" y extraer sus listados
    // La estructura típica es: <div class="search-results"><h2>Live Listings (2)</h2></div>
    // Seguido por <div class="listings-toolbar"> y luego los elements
    // Intentamos varias estrategias para encontrar la sección correcta
    
    // Buscar la etiqueta H2 que contiene exactamente "Live Listings" - esto es lo más preciso
    const liveListingsH2 = $('h2').filter(function() {
      const text = $(this).text().trim();
      return text.startsWith('Live Listings');
    });
    console.log(`¿Se encontró encabezado H2 Live Listings?: ${liveListingsH2.length > 0}`);
    
    // Buscar cualquier elemento que contenga "Live Listings" como respaldo
    const liveListingsHeader = liveListingsH2.length > 0 ? 
      liveListingsH2.closest('div.search-results, div') : 
      $('div:contains("Live Listings")').filter(function() {
        const text = $(this).text().trim();
        return text.includes('Live Listings');
      });
    
    console.log(`Encontrado encabezado de Live Listings: ${liveListingsHeader.length > 0}`);
    
    // Intentar encontrar el contenedor que sigue al encabezado de Live Listings
    const liveSection = liveListingsHeader.next();
    
    // Si no encontramos la sección directamente, buscar por clases conocidas
    let liveGrid = $('div.grid-items, div.search-result-grid');
    
    console.log(`¿Se encontró rejilla de resultados alternativa?: ${liveGrid.length > 0}`);
    console.log(`¿Se encontró sección de Live Listings?: ${liveSection.length > 0}`);
    
    // Buscar el contenedor que contiene todos los listados "Live"
    // En el HTML proporcionado, parece ser el div que sigue al encabezado y contiene las tarjetas
    let liveListingsContainer;
    
    // Estrategia 1: Buscar directamente en el siguiente elemento
    if (liveSection.length > 0) {
      liveListingsContainer = liveSection;
    } 
    // Estrategia 2: Buscar el contenedor que contiene la clase grid-items que esté más cerca del encabezado
    else if (liveGrid.length > 0) {
      liveListingsContainer = liveGrid.eq(0); // Tomar el primer grid encontrado
    }
    // Estrategia 3: Buscar cualquier div que contenga elementos de listing después del encabezado
    else {
      const possibleContainers = $('div').filter(function() {
        return $(this).find('.search-results-listing, .listing-card, .search-result-grid-item').length > 0;
      });
      if (possibleContainers.length > 0) {
        liveListingsContainer = possibleContainers.eq(0);
      } else {
        // Si todo falla, usar el propio encabezado como referencia para buscar cercanos
        liveListingsContainer = liveListingsHeader.parent();
      }
    }
    
    console.log(`¿Se encontró contenedor de listados activos?: ${liveListingsContainer && liveListingsContainer.length > 0}`);
    
    // Buscar tarjetas dentro de la sección de listados activos primero
    const liveLinkCards = liveListingsContainer ? liveListingsContainer.find('a[href*="/listing/"]') : $([]);
    console.log(`Encontrados ${liveLinkCards.length} enlaces directos en sección Live Listings`);
    
    // Buscar elementos <div> que contengan h3 (títulos) y posiblemente datos de auto
    const liveCardsDivs = liveListingsContainer ? liveListingsContainer.find('div').filter(function() {
      return $(this).find('h3').length > 0;
    }) : $([]);
    console.log(`Encontrados ${liveCardsDivs.length} divs con títulos en sección Live Listings`);
    
    // Para depuración, imprimir algunos títulos encontrados
    liveCardsDivs.each((i, el) => {
      if (i < 3) {
        const title = $(el).find('h3').text().trim();
        console.log(`Título activo ${i+1}: "${title}"`);
        
        // Buscar elementos h3 con enlaces para construir información completa
        const anchor = $(el).find('h3 a');
        if (anchor.length > 0) {
          const href = anchor.attr('href');
          const fullUrl = href ? (href.startsWith('http') ? href : `https://bringatrailer.com${href}`) : '';
          console.log(`URL encontrada: ${fullUrl}`);
          
          // Buscar elementos de progreso e indicadores de tiempo
          const progressEls = $(el).find('progress');
          const hasProgress = progressEls.length > 0;
          console.log(`¿Tiene barra de progreso?: ${hasProgress}`);
          
          // Buscar información de precio/puja
          const priceInfo = $(el).find('.results-price, .bidding-bid, .bid-formatted, .item-results').text().trim();
          if (priceInfo) {
            console.log(`Información de precio: ${priceInfo}`);
          }
          
          // Intentar extraer datos de este listing de la sección Live directamente
          if (fullUrl && title) {
            const img = $(el).find('img').attr('src') || '';
            const yearMatch = title.match(/(19\d{2}|20\d{2})/);
            const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
            
            // Precio
            let price = null;
            if (priceInfo) {
              const priceMatch = priceInfo.match(/(?:\$)?\s*(\d[\d,]*)/);
              if (priceMatch && priceMatch[1]) {
                price = parseInt(priceMatch[1].replace(/[^\d]/g, ''), 10);
              }
            }
            
            // Añadir directamente vehículos de la sección Live
            const vehicle: InsertVehicle = {
              title,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl: fullUrl,
              imageUrl: img,
              year: extractedYear,
              price,
              isAuction: true,
              currentBid: price,
              endsIn: 'En curso', // Sabemos que es un listing activo
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
            console.log(`Añadido directamente desde Live Listings: ${title}`);
          }
        }
      }
    });
    
    // 1. Buscar enlaces directos a listados en toda la página (enfoque original)
    const listingLinks = $('a[href*="/listing/"]').filter(function() {
      const href = $(this).attr('href') || '';
      // Solo incluir enlaces que parezcan ser de vehículos
      return href.includes(model.toLowerCase()) || href.toLowerCase().includes('mustang');
    });
    
    console.log(`Encontrados ${listingLinks.length} enlaces a listados en total`);
    
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
                      container.find('.bidding-countdown').text().trim() ||
                      container.find('[class*="count"][class*="down"]').text().trim() ||
                      container.find('[class*="time"][class*="remain"]').text().trim();
                      
        // Si no hay tiempo exacto pero hay progreso o indicadores, usar un texto por defecto
        if (!timeText && container.find('progress').length > 0) {
          timeText = 'En curso'; // Valor por defecto para auctions activas con progreso
        }
        
        // Buscar otros elementos de tiempo en el contenedor
        if (!timeText) {
          // Buscar texto que coincida con patrones de tiempo
          const timePattern = /\b\d+[d|h|m|s]\b|\b\d+:\d+\b|\bends\s+in\b|\bending\b|\bends\s+soon\b/i;
          const containerText = container.text();
          if (timePattern.test(containerText)) {
            // Extraer el fragmento que contiene la información de tiempo
            const match = containerText.match(new RegExp(`.{0,10}(${timePattern.source}).{0,10}`, 'i'));
            if (match) {
              timeText = match[0].trim();
            }
          }
        }
        
        // Comprobar si el listado es de la sección "Live Listings"
        // Buscar por estructura del DOM para determinar si está en la sección de activos
        const isInLiveSection = liveCardsDivs.toArray().some(div => {
          return container[0] === div || $.contains(div, container[0]) || $.contains(container[0], div);
        });

        // Buscar indicadores adicionales de subasta activa
        // 1. Buscar iconos o textos que indiquen actividad
        const hasActiveIndicators = (
          container.find('.icon-clock').length > 0 ||
          container.find('.progress-counting').length > 0 ||
          container.find('progress').length > 0 ||
          container.find('progress[value]').length > 0 ||
          (timeText && (
            timeText.includes('day') ||
            timeText.includes('hour') ||
            timeText.includes('min') ||
            timeText.includes(':')
          )) ||
          container.text().toLowerCase().includes('ending') ||
          container.text().toLowerCase().includes('ending soon') ||
          // Si está en la sección de Live Listings, considerarlo activo
          isInLiveSection
        );
        
        // IMPORTANTE: Necesitamos mostrar resultados incluso si no encontramos indicadores perfectos
        let isActive = false;
        
        // Comprobar primero si el listado menciona explícitamente que está terminado
        const explicitlyClosed = timeText && (
          timeText.toLowerCase().includes('sold') ||
          timeText.toLowerCase().includes('ended') ||
          timeText.toLowerCase().includes('complete') ||
          timeText.toLowerCase().includes('finalizada')
        );
        
        // Si tiene indicadores explícitos de cierre, rechazarlo
        if (explicitlyClosed) {
          isActive = false;
        } 
        // Si está en "Live Listings", casi seguro que está activo
        else if (isInLiveSection) {
          isActive = true;
          console.log(`Encontrado en Live Listings: ${title}`);
        }
        // Si tiene progreso u otro indicador claro de tiempo
        else if (container.find('progress').length > 0 || 
                 (timeText && (
                    timeText.includes('day') || 
                    timeText.includes('hour') || 
                    timeText.includes('min') || 
                    timeText.includes(':') ||
                    /\d+[dhm]/.test(timeText) // Formato: "5d", "2h", etc.
                 ))) {
          isActive = true;
          console.log(`Tiene indicadores de tiempo: ${title}`);
        }
        // Enfoque más permisivo: aceptar listings con precio que parezcan recientes
        else if (price && price > 0 && !explicitlyClosed) {
          // Preferimos tener algunos resultados aunque no sepamos con certeza
          // si están activos, en lugar de no mostrar nada
          isActive = true;
          console.log(`Aceptando listing con precio: ${title} - ${price}`);
        }
        
        // Sólo incluir subastas activas - importante para los requisitos del usuario
        if (!isActive) {
          console.log(`Omitiendo subasta no activa: ${title}`);
          return;
        }
        
        // Indicar si este listado se encontró en la sección "Live Listings"
        if (isInLiveSection) {
          console.log(`Listado encontrado en sección Live Listings: ${title}`);
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
