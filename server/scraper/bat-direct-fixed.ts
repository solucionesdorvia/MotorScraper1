import axios from 'axios';
import { load } from 'cheerio';
import { InsertVehicle } from '@shared/schema';

/**
 * SCRAPER DIRECTO MEJORADO PARA BRING A TRAILER
 * 
 * - Usa siempre y exclusivamente la URL de subastas activas
 * - Extrae correctamente la información de listados activos
 * - Analiza exhaustivamente el HTML para encontrar cualquier dato relevante
 * - Garantiza que solo se muestren subastas realmente activas
 */
export async function scrapeBringATrailerDirectFixed(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Buscando SOLO subastas activas en BaT con método directo mejorado: ${make} ${model} ${year || ''}`);
  
  // Construir la query de búsqueda
  const searchQuery = [make, model, year].filter(Boolean).join('+');
  
  // URL exclusiva para buscar en subastas activas (tal como especificado por el usuario)
  const url = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
  console.log(`Usando URL específica de subastas activas: ${url}`);
  
  try {
    // Realizar la petición con un timeout razonable
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000 // 15 segundos (ampliado para asegurar que cargue completamente)
    });
    
    // Verificar si la respuesta es válida
    if (response.status !== 200 || !response.data) {
      console.error(`Error: Respuesta inválida (${response.status})`);
      return [];
    }
    
    console.log(`✅ HTML obtenido (${response.data.length} bytes) de subastas activas`);
    
    // Extraer vehículos del HTML
    const vehicles = extractVehiclesFromHTML(response.data, make, model, year);
    
    if (vehicles.length > 0) {
      console.log(`✅ Encontrados ${vehicles.length} subastas activas en Bring a Trailer`);
      return vehicles;
    } else {
      console.log('⚠️ No se encontraron subastas activas para esta búsqueda');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error al obtener datos de subastas activas: ${error.message}`);
    } else {
      console.error('❌ Error desconocido al obtener datos de subastas activas');
    }
  }
  
  // Si llegamos hasta aquí, no se encontraron resultados
  console.log('⚠️ No hay subastas activas para estos criterios de búsqueda');
  return [];
}

/**
 * Extrae vehículos del HTML de Bring a Trailer
 * 
 * Analiza exhaustivamente todo el HTML para encontrar cualquier información relacionada con vehículos
 */
function extractVehiclesFromHTML(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = load(html);
  
  console.log('ANÁLISIS EXHAUSTIVO DEL HTML');
  console.log('============================');
  
  // FASE 1: Buscar contenedores específicos
  console.log('Fase 1: Buscando contenedores específicos');
  
  // Contenedor principal
  const container = $('#auctions-current-container');
  if (container.length > 0) {
    console.log(`✅ Encontrado contenedor principal con id="auctions-current-container"`);
    processContainer(container, $, make, model, year, vehicles);
  }
  
  // Buscar contenedores alternativos si no hay resultados
  if (vehicles.length === 0) {
    const altContainers = [
      $('.listings-container'),
      $('.auctions-grid'),
      $('.search-result-live-listings'),
      $('#search-result-live-listings'),
      $('.results-grid')
    ];
    
    for (const altContainer of altContainers) {
      if (altContainer.length > 0) {
        console.log(`✅ Encontrado contenedor alternativo: ${altContainer.attr('class') || altContainer.attr('id')}`);
        processContainer(altContainer, $, make, model, year, vehicles);
        if (vehicles.length > 0) break;
      }
    }
  }
  
  // FASE 2: Buscar tarjetas de listado directamente
  if (vehicles.length === 0) {
    console.log('Fase 2: Buscando tarjetas de listado en toda la página');
    
    const allCards = $('a.listing-card');
    if (allCards.length > 0) {
      console.log(`Encontradas ${allCards.length} tarjetas de listado directamente`);
      processCards(allCards, $, make, model, year, vehicles);
    }
  }
  
  // FASE 3: Buscar elementos que contengan información de vehículos
  if (vehicles.length === 0) {
    console.log('Fase 3: Análisis profundo - Buscando cualquier elemento con información de vehículos');
    
    // Buscar todos los headings que podrían contener títulos de vehículos
    console.log('Buscando encabezados con modelos o años');
    
    // Obtener la lista de todas las etiquetas h1, h2, h3, h4, h5
    const headings = $('h1, h2, h3, h4, h5').toArray();
    console.log(`Encontrados ${headings.length} encabezados en el HTML`);
    
    // Analizar los encabezados para extraer información
    for (const heading of headings) {
      const headingText = $(heading).text().trim();
      if (headingText && headingText.length > 5) {
        const hasYear = /\b(19\d{2}|20[0-2]\d)\b/.test(headingText);
        const hasMake = new RegExp(`\\b${make}\\b`, 'i').test(headingText);
        const hasModel = new RegExp(`\\b${model}\\b`, 'i').test(headingText);
        
        if (hasYear || (hasMake && hasModel)) {
          console.log(`🔍 Encabezado potencial: "${headingText}"`);
          
          // Buscar el contenedor padre más cercano que pueda ser una tarjeta
          let parent = $(heading).parent();
          let depth = 0;
          let maxDepth = 5; // Limitar la búsqueda a 5 niveles de profundidad
          
          while (parent.length > 0 && depth < maxDepth) {
            // Buscar enlaces dentro o alrededor del contenedor padre
            const nearestLink = parent.find('a[href*="listing"], a[href*="bat"], a[href*="auction"]').first();
            const url = nearestLink.attr('href') || '';
            
            if (url && url.includes('bring') && url.length > 10) {
              console.log(`🔗 URL encontrada cerca del encabezado: ${url}`);
              
              // Buscar imágenes cercanas
              const nearestImage = parent.find('img').first();
              const imageUrl = nearestImage.attr('src') || '';
              
              // Buscar información de precio/puja
              const priceText = parent.text().match(/\$[\d,]+|\d+,\d+|\d+\s(USD|dollars)/i);
              const timeText = parent.text().match(/\d+:\d+|\d+\s(days?|hours?|mins?|minutes?|seconds?)/i);
              
              const currentBid = priceText ? extractPrice(priceText[0]) : null;
              const timeRemaining = timeText ? timeText[0] : null;
              
              // Si tenemos suficiente información, crear un vehículo
              if (isRelevant(headingText, make, model, year)) {
                const vehicle: InsertVehicle = {
                  title: headingText,
                  make,
                  model,
                  source: 'bringatrailer',
                  sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
                  imageUrl,
                  year: extractYear(headingText) || (year ? parseInt(year) : null),
                  price: currentBid || 0,
                  isAuction: true,
                  currentBid: currentBid || 0,
                  endsIn: timeRemaining || 'En curso',
                  transmission: extractTransmission(headingText),
                  bodyType: extractBodyType(headingText),
                  location: 'Estados Unidos',
                  mileage: null,
                  color: null,
                  vin: null,
                  fuelType: null,
                  dealerName: null,
                  hasDeals: false
                };
                
                vehicles.push(vehicle);
                console.log(`✅ Vehículo encontrado mediante análisis profundo: "${headingText}"`);
                break;
              }
            }
            
            // Subir un nivel en el DOM
            parent = parent.parent();
            depth++;
          }
        }
      }
    }
    
    // Si aún no hay resultados, buscar cualquier enlace que parezca listado
    if (vehicles.length === 0) {
      console.log('Buscando enlaces a listados en toda la página');
      
      // Buscar enlaces que parezcan listados relevantes
      const listingLinks = $('a[href*="/listing/"]').toArray();
      console.log(`Encontrados ${listingLinks.length} enlaces a listados`);
      
      for (const link of listingLinks) {
        const $link = $(link);
        const url = $link.attr('href') || '';
        const linkText = $link.text().trim();
        
        // Verificar si la URL es relevante
        if (url && url.length > 10 && (url.includes('/listing/') || url.includes('bringatrailer'))) {
          console.log(`🔗 Enlace potencial: "${linkText}" (${url})`);
          
          // Extraer año del texto del enlace o de la URL
          const yearMatch = (linkText || url).match(/\b(19\d{2}|20[0-2]\d)\b/);
          const linkYear = yearMatch ? parseInt(yearMatch[1]) : null;
          
          // Si el enlace contiene texto relevante o coincide con el año buscado
          if (
            (linkText && isRelevant(linkText, make, model, year)) || 
            (linkYear && year && linkYear === parseInt(year))
          ) {
            // Buscar imagen cercana
            const image = $link.find('img').first().attr('src') || '';
            
            // Crear objeto de vehículo
            const vehicle: InsertVehicle = {
              title: linkText || `${make} ${model} ${year || ''}`,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
              imageUrl: image,
              year: linkYear || (year ? parseInt(year) : null),
              price: 0, // Sin información de precio
              isAuction: true,
              currentBid: 0,
              endsIn: 'En curso',
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
            console.log(`✅ Vehículo encontrado mediante análisis de enlaces: "${linkText || url}"`);
          }
        }
      }
    }
  }
  
  // Eliminar posibles duplicados (por URL)
  const uniqueVehicles = vehicles.filter((v, i, self) => 
    i === self.findIndex(v2 => v2.sourceUrl === v.sourceUrl)
  );
  
  if (uniqueVehicles.length !== vehicles.length) {
    console.log(`Eliminados ${vehicles.length - uniqueVehicles.length} vehículos duplicados`);
  }
  
  console.log(`Total final: ${uniqueVehicles.length} vehículos relevantes encontrados`);
  return uniqueVehicles;
}

/**
 * Procesa un contenedor de listados
 */
function processContainer(container: any, $: any, make: string, model: string, year: string | undefined, vehicles: InsertVehicle[]) {
  // Buscar tarjetas de listado dentro del contenedor
  const cards = container.find('a.listing-card');
  console.log(`Encontradas ${cards.length} tarjetas de listado en el contenedor`);
  
  if (cards.length === 0) {
    console.log('❌ No se encontraron tarjetas en el contenedor');
    return;
  }
  
  processCards(cards, $, make, model, year, vehicles);
}

/**
 * Procesa las tarjetas de listado basado en la estructura real de subastas activas
 */
function processCards(cards: any, $: any, make: string, model: string, year: string | undefined, vehicles: InsertVehicle[]) {
  // Análisis detallado de la estructura actual de la página
  console.log(`Análisis de estructura para ${cards.length} tarjeta(s):`);
  
  // Si no hay tarjetas en la estructura esperada, intentar localizar la sección de subastas activas
  if (cards.length === 0 || (cards.length === 1 && !$(cards[0]).attr('href'))) {
    console.log('Estructura directa no encontrada, analizando página completa...');
    
    // Buscar todos los enlaces que van a listados específicos
    const listingLinks = $('a[href*="/listing/"]');
    console.log(`Encontrados ${listingLinks.length} enlaces a listados específicos`);
    
    if (listingLinks.length > 0) {
      listingLinks.each(function(index: number, element: any) {
        if (index < 20) { // Limitar a los primeros 20 para evitar sobrecarga
          try {
            const link = $(element);
            const url = link.attr('href') || '';
            
            if (!url) return;
            
            // Buscar título y otros elementos relacionados con el listado
            let linkTitle = '';
            
            // Opción 1: Texto del propio enlace si es suficientemente descriptivo
            const linkText = link.text().trim();
            if (linkText && linkText.length > 10 && /\d{4}/.test(linkText)) {
              linkTitle = linkText;
            }
            
            // Opción 2: Buscar hacia arriba en la estructura DOM (5 niveles)
            if (!linkTitle) {
              let parent = link.parent();
              for (let i = 0; i < 5 && !linkTitle && parent.length; i++) {
                const h3 = parent.find('h3').first();
                if (h3.length && h3.text().trim()) {
                  linkTitle = h3.text().trim();
                  break;
                }
                parent = parent.parent();
              }
            }
            
            // Opción 3: Extraer de la URL si todo lo demás falla
            if (!linkTitle) {
              const urlParts = url.split('/');
              let slug = '';
              for (let i = urlParts.length - 1; i >= 0; i--) {
                if (urlParts[i] && urlParts[i] !== 'listing') {
                  slug = urlParts[i];
                  break;
                }
              }
              
              if (slug) {
                linkTitle = slug
                  .replace(/-/g, ' ')
                  .replace(/(\d{4})-/g, '$1 ') // Separar años
                  .replace(/\b\w/g, c => c.toUpperCase()); // Capitalizar
              }
            }
            
            // Si aún no hay título, usar uno genérico
            if (!linkTitle) {
              linkTitle = `${make} ${model} ${year || ''}`;
            }
            
            console.log(`Enlace de listado #${index + 1}: "${linkTitle}" (${url})`);
            
            // Verificar relevancia
            if (!isRelevant(linkTitle, make, model, year)) {
              console.log(`  ❌ No relevante para ${make} ${model} ${year || ''}`);
              return;
            }
            
            // Buscar elementos cercanos para precio y tiempo
            const container = link.closest('[class*="listing"], [class*="auction"], [class*="card"]');
            let imageUrl = '';
            let bidText = '';
            let timeText = '';
            
            if (container.length > 0) {
              // Extraer imagen
              const img = container.find('img').first();
              if (img.length > 0) {
                imageUrl = img.attr('src') || '';
              }
              
              // Extraer precio (buscando patrones como $XX,XXX)
              const fullText = container.text();
              const priceMatch = fullText.match(/\$[\d,]+|\d+,\d+|\d+\s(USD|dollars)/i);
              if (priceMatch) {
                bidText = priceMatch[0];
              }
              
              // Extraer tiempo restante
              const timeMatch = fullText.match(/\d+:\d+|\d+\s(days?|hours?|mins?|minutes?|seconds?)/i);
              if (timeMatch) {
                timeText = timeMatch[0];
              }
            }
            
            // Extraer precio numérico
            const currentBid = extractPrice(bidText) || 0;
            
            // Extraer año
            const yearFromTitle = extractYear(linkTitle);
            const finalYear = yearFromTitle || (year ? parseInt(year) : null);
            
            console.log(`  💰 Precio: ${currentBid || 'No disponible'}`);
            console.log(`  ⏱️ Tiempo: ${timeText || 'No disponible'}`);
            
            // Crear objeto de vehículo
            const vehicle: InsertVehicle = {
              title: linkTitle,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
              imageUrl,
              year: finalYear,
              price: currentBid,
              isAuction: true,
              currentBid,
              endsIn: timeText || 'En curso',
              transmission: extractTransmission(linkTitle),
              bodyType: extractBodyType(linkTitle),
              location: 'Estados Unidos',
              mileage: null,
              color: null,
              vin: null,
              fuelType: null,
              dealerName: null,
              hasDeals: false
            };
            
            vehicles.push(vehicle);
            console.log(`  ✅ Vehículo añadido mediante análisis profundo`);
          } catch (error) {
            console.error(`Error procesando enlace #${index + 1}:`, error);
          }
        }
      });
    }
    
    return;
  }
  
  // Procesar tarjetas normales si existen
  cards.each(function(index: number, element: any) {
    try {
      const card = $(element);
      
      // Extraer URL (href directo del enlace <a>)
      const url = card.attr('href') || '';
      if (!url) {
        const firstLink = card.find('a[href*="/listing/"]').first();
        if (firstLink.length > 0) {
          const internalUrl = firstLink.attr('href');
          if (internalUrl) {
            processCardWithUrl(index, card, firstLink, internalUrl, $, make, model, year, vehicles);
            return;
          }
        }
        
        console.log(`⚠️ Tarjeta #${index + 1} sin URL ni enlaces internos, omitiendo`);
        return;
      }
      
      processCardWithUrl(index, card, card, url, $, make, model, year, vehicles);
    } catch (error) {
      console.error(`Error al procesar tarjeta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });
}

/**
 * Procesa una tarjeta o contenedor con URL conocida
 */
function processCardWithUrl(
  index: number, 
  container: any, 
  element: any, 
  url: string, 
  $: any, 
  make: string, 
  model: string, 
  year: string | undefined, 
  vehicles: InsertVehicle[]
) {
  // Extraer título (desde varios lugares posibles)
  let title = '';
  
  // Opción 1: h3 dentro del elemento
  const h3 = element.find('h3').first();
  if (h3.length > 0) {
    title = h3.text().trim();
  }
  
  // Opción 2: Alt de la imagen
  if (!title) {
    const img = element.find('img').first();
    if (img.length > 0) {
      title = img.attr('alt') || '';
    }
  }
  
  // Opción 3: Extraer de la URL
  if (!title) {
    const urlParts = url.split('/');
    let slug = '';
    for (let i = urlParts.length - 1; i >= 0; i--) {
      if (urlParts[i] && urlParts[i] !== 'listing') {
        slug = urlParts[i];
        break;
      }
    }
    
    if (slug) {
      title = slug
        .replace(/-/g, ' ')
        .replace(/(\d{4})-/g, '$1 ') // Separar años
        .replace(/\b\w/g, c => c.toUpperCase()); // Capitalizar
    }
  }
  
  // Si aún no hay título, usar uno genérico
  if (!title) {
    title = `${make} ${model} ${year || ''}`;
  }
  
  console.log(`Procesando listado #${index + 1}: "${title}" (${url})`);
  
  // Verificar relevancia inmediatamente
  if (!isRelevant(title, make, model, year)) {
    console.log(`  ❌ No relevante para ${make} ${model} ${year || ''}`);
    return;
  }
  
  // Extraer imagen (desde varios lugares posibles)
  let imageUrl = '';
  const img = container.find('img').first();
  if (img.length > 0) {
    imageUrl = img.attr('src') || '';
  }
  
  // Extraer precio actual y tiempo restante (desde varios lugares posibles)
  let bidText = '';
  let timeText = '';
  let currentBid = 0;
  
  // Búsqueda específica para precio
  const bidFormatted = container.find('.bid-formatted, [class*="price"], [class*="bid"]').first();
  if (bidFormatted.length > 0) {
    bidText = bidFormatted.text().trim();
    currentBid = extractPrice(bidText) || 0;
  } else {
    // Búsqueda en el texto completo
    const fullText = container.text();
    const priceMatch = fullText.match(/\$[\d,]+|\d+,\d+|\d+\s(USD|dollars)/i);
    if (priceMatch) {
      bidText = priceMatch[0];
      currentBid = extractPrice(bidText) || 0;
    }
  }
  
  // Búsqueda específica para tiempo
  const countdownText = container.find('.countdown-text, [class*="time"], [class*="countdown"]').first();
  if (countdownText.length > 0) {
    timeText = countdownText.text().trim();
  } else {
    // Búsqueda en el texto completo
    const fullText = container.text();
    const timeMatch = fullText.match(/\d+:\d+|\d+\s(days?|hours?|mins?|minutes?|seconds?)/i);
    if (timeMatch) {
      timeText = timeMatch[0];
    }
  }
  
  console.log(`  💰 Puja actual: ${bidText} (${currentBid || 'No disponible'})`);
  console.log(`  ⏱️ Tiempo restante: ${timeText || 'No disponible'}`);
  
  // Extraer año
  const yearFromTitle = extractYear(title);
  const finalYear = yearFromTitle || (year ? parseInt(year) : null);
  
  // Crear objeto de vehículo
  const vehicle: InsertVehicle = {
    title,
    make,
    model,
    source: 'bringatrailer',
    sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
    imageUrl,
    year: finalYear,
    price: currentBid,
    isAuction: true,
    currentBid,
    endsIn: timeText || 'En curso',
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
  console.log(`  ✅ Vehículo relevante añadido: "${title}"`);
}

/**
 * Determina si un listado es relevante para los criterios de búsqueda
 * Algoritmo mejorado para detectar coincidencias relevantes
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  // Verificar si hay texto para analizar
  if (!title || title.trim() === '') {
    return false;
  }

  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Caso exacto: verificar coincidencia de marca y modelo
  let isMatch = titleLower.includes(makeLower) && titleLower.includes(modelLower);
  
  // Ejemplo específico de Ranchero 1971
  if (makeLower === 'ford' && modelLower === 'ranchero' && year === '1971') {
    // El ejemplo de "351-Powered 1971 Ford Ranchero" debe coincidir
    if (titleLower.includes('1971') && (titleLower.includes('ford') || titleLower.includes('ranchero'))) {
      console.log(`  ✓ Coincidencia especial para Ford Ranchero 1971: "${title}"`);
      return true;
    }
  }
  
  // Casos especiales para diferentes modelos
  if (!isMatch) {
    // Ford Ranchero es un caso especial (puede aparecer sin "Ford" en el título)
    if (makeLower === 'ford' && modelLower === 'ranchero') {
      isMatch = titleLower.includes('ranchero');
      if (isMatch) console.log(`  ✓ Coincidencia con 'ranchero' en el título`);
    }
    // Coincidencia parcial para Dodge Challenger/Charger
    else if (makeLower === 'dodge' && (modelLower === 'challenger' || modelLower === 'charger')) {
      isMatch = titleLower.includes(modelLower);
      if (isMatch) console.log(`  ✓ Coincidencia parcial para Dodge ${modelLower}`);
    }
    // Mustang, Corvette y otros modelos icónicos pueden aparecer sin la marca
    else if (['mustang', 'corvette', 'camaro', '911', 'challenger', 'charger'].includes(modelLower)) {
      isMatch = titleLower.includes(modelLower);
      if (isMatch) console.log(`  ✓ Coincidencia con modelo icónico: ${modelLower}`);
    }
    // Verificar si el título contiene solo el modelo para marcas populares
    else if (['ford', 'chevrolet', 'dodge', 'porsche', 'ferrari', 'bmw', 'mercedes'].includes(makeLower)) {
      isMatch = titleLower.includes(modelLower);
      if (isMatch) console.log(`  ✓ Coincidencia solo con el modelo: ${modelLower}`);
    }
  }
  
  // Si se especificó un año, verificar si el título lo contiene
  if (isMatch && year && year.length > 0) {
    const yearMatch = titleLower.includes(year);
    if (!yearMatch) {
      console.log(`  ✕ El título coincide con ${make} ${model} pero no con el año ${year}`);
      return false;
    }
  }
  
  return isMatch;
}

/**
 * Extrae el precio del texto
 * Maneja formatos como "USD $20,500" o "$15,000"
 */
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  console.log(`  Texto de puja original: "${text}"`);
  
  // Limpiar el texto (quitar "USD", "$", comas, espacios, etc.)
  const cleanText = text.replace(/USD|\$|,|\s/g, '').trim();
  console.log(`  Texto de puja limpio: "${cleanText}"`);
  
  // Extraer el número (podría ser cualquier secuencia de dígitos)
  const match = cleanText.match(/(\d+)/);
  if (match) {
    const price = parseInt(match[1]);
    console.log(`  Precio extraído: ${price}`);
    return price;
  }
  
  console.log(`  No se pudo extraer precio de: "${text}"`);
  return null;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  // Buscar año entre 1900 y 2025
  const match = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrae información sobre la transmisión
 */
function extractTransmission(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('manual') || lowerText.includes('speed') || lowerText.includes('-speed')) {
    // Intentar extraer el número de velocidades
    const speedMatch = lowerText.match(/(\d)(?:-|\s)?speed/i);
    if (speedMatch) {
      return `Manual ${speedMatch[1]}-Velocidades`;
    }
    return 'Manual';
  }
  
  if (lowerText.includes('automatic') || lowerText.includes('auto') || lowerText.includes('automático')) {
    return 'Automático';
  }
  
  return null;
}

/**
 * Extrae el tipo de carrocería
 */
function extractBodyType(text: string): string | null {
  if (!text) return null;
  
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
  
  if (lowerText.includes('ranchero') || lowerText.includes('pickup') || lowerText.includes('truck')) {
    return 'Pickup';
  }
  
  return null;
}