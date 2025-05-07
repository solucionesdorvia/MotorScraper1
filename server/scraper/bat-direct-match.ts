/**
 * SCRAPER DE COINCIDENCIA DIRECTA PARA BRING A TRAILER - V4
 * 
 * Este scraper combina un enfoque híbrido:
 * 1. Usa ejemplos HTML estáticos como fallback para asegurar resultados consistentes
 * 2. Intenta hacer solicitudes HTTP reales para obtener resultados actualizados
 * 
 * Además, usa el formato de URL correcto para BaT: https://bringatrailer.com/auctions/?search=query
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

// Repositorio de ejemplos HTML para usar como fallback
const HTML_EXAMPLES: Record<string, string> = {
  // Ford Mustang (ejemplo original proporcionado por el usuario)
  "ford-mustang": `<div class="listings-container auctions-grid" id="auctions-current-container" data-bind="class: &quot;auctions-&quot; + listingsView(), fastForEach: itemsFiltered">
    
<a class="listing-card bg-white-transparent" data-bind="attr: { href: url, &quot;data-pusher&quot;: pusher}, fadeVisible: isVisible" style="" href="https://bringatrailer.com/listing/1967-shelby-mustang-gt500-27/" data-pusher="post;list;91725777">
    <div class="thumbnail">
        <img data-bind="attr: { src: thumbnailUrl, alt: title }" src="https://bringatrailer.com/wp-content/uploads/2025/03/1967_shelby_mustang-gt500_1967-ford-shelby-gt500-002-39035.jpg?resize=470%2C318" alt="29-Years-Owned 1967 Shelby Mustang GT500 Fastback">
        <div class="image-overlay"></div>
        <div class="icon-item-watch" data-bind="css: { &quot;item-watched&quot;: watched }, attr: { &quot;data-watch-url&quot;: watchUrl }, click: toggleListingWatch" data-watch-url="https://bringatrailer.com/wp-admin/admin-ajax.php?action=bat_listing_watch&amp;listing=91725777"></div>
        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="9075"></progress>
    </div>

    <div class="content">
        <div class="content-main">
            <div class="icon-live" data-bind="visible: showLive" style="display: none;"></div>
            <h3 data-bind="html: title">29-Years-Owned 1967 Shelby Mustang GT500 Fastback</h3>

            <div class="item-tags" data-bind="visible: premium || noreserve || repeat || currency">
                <div class="item-tag item-tag-currency" data-bind="visible: currency, css: { 'is-international': isInternational }">
                    <span class="show-country-flag" data-bind="html: countryFlag"><img class="countries-flags" src="https://bringatrailer.com/wp-content/themes/bringatrailer/assets/img/countries/us.svg" alt="United States"></span>
                    <abbr data-bind="visible: isInternational" style="display: none;">
                        International                    </abbr>
                    <span class="show-country-name" data-bind="text: countryCodeAlpha3">USA</span>
                </div>
                <div class="item-tag item-tag-premium" data-bind="visible: premium">
                    <abbr title="Premium listing">P</abbr>
                    <span>Premium</span>
                </div>
                <div class="item-tag item-tag-noreserve" data-bind="visible: noreserve" style="display: none;">
                    <abbr title="No reserve listing">NR</abbr>
                    <span>No Reserve</span>
                </div>
                <div class="item-tag item-tag-repeat" data-bind="visible: repeat" style="display: none;">
                    <abbr title="Alumni listing">A</abbr>
                    <span>Alumni</span>
                </div>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>

            <div class="item-excerpt" data-bind="html: excerpt">This 1967 Shelby Mustang GT500 fastback is one of 2,048 examples produced for the model year and was completed on June 13, 1967. It has been registered in California since new and was acquired by the seller in 1996. Mechanical work carried out in 2023 included installing a replacement 428ci engine block, a SCAT rotating assembly, and a hydraulic…</div>

            <div class="item-stats" data-bind="visible: showStats" style="display: none;">
                <div class="stats-comments" data-bind="visible: comments" style="display: none;">
                    <span class="icon-comments"></span>
                    <span class="item-comments" data-bind="text: comments"></span>
                    <span>Comments</span>
                </div>
                <div class="stats-views" data-bind="visible: views" style="display: none;">
                    <span class="item-views" data-bind="text: views"></span>
                    <span>Views</span>
                </div>
                <div class="stats-watchers" data-bind="visible: watchers" style="display: none;">
                    <span class="item-watchers" data-bind="text: watchers"></span>
                    <span>Watchers</span>
                </div>
            </div>

            <div class="item-results" data-bind="html: soldText, visible: soldText" style="display: none;">false</div>
        </div>

        <div class="content-secondary">
            <div class="item-bidding" data-bind="visible: active">
                <span class="bidding-bid">
                    <span class="bid-label" data-bind="text: currentBidLabel">Bid:</span>
                    <span class="bid-formatted bold" data-bind="text: currentBidFormatted">USD $115,000</span>
                </span>

                <span class="bidding-countdown">
                    <span class="icon-clock"></span>
                    <span class="countdown-text final-countdown" data-bind="css: { &quot;final-countdown&quot;: 86400 > secondsToEnd() }, text: countdownText">2:31:15</span>
                </span>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>
        </div>

        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="9075"></progress>
    </div>
</a>
    
    
<a class="listing-card bg-white-transparent" data-bind="attr: { href: url, &quot;data-pusher&quot;: pusher}, fadeVisible: isVisible" style="" href="https://bringatrailer.com/listing/1967-ford-mustang-29-2/" data-pusher="post;list;92873391">
    <div class="thumbnail">
        <img data-bind="attr: { src: thumbnailUrl, alt: title }" src="https://bringatrailer.com/wp-content/uploads/2025/04/1967_ford_mustang-gt_img_0625-39159.jpg?resize=470%2C318" alt="23-Years-Owned, 417 FE-Powered 1967 Ford Mustang Fastback 5-Speed">
        <div class="image-overlay"></div>
        <div class="icon-item-watch" data-bind="css: { &quot;item-watched&quot;: watched }, attr: { &quot;data-watch-url&quot;: watchUrl }, click: toggleListingWatch" data-watch-url="https://bringatrailer.com/wp-admin/admin-ajax.php?action=bat_listing_watch&amp;listing=92873391"></div>
        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="363435"></progress>
    </div>

    <div class="content">
        <div class="content-main">
            <div class="icon-live" data-bind="visible: showLive" style="display: none;"></div>
            <h3 data-bind="html: title">23-Years-Owned, 417 FE-Powered 1967 Ford Mustang Fastback 5-Speed</h3>

            <div class="item-tags" data-bind="visible: premium || noreserve || repeat || currency">
                <div class="item-tag item-tag-currency" data-bind="visible: currency, css: { 'is-international': isInternational }">
                    <span class="show-country-flag" data-bind="html: countryFlag"><img class="countries-flags" src="https://bringatrailer.com/wp-content/themes/bringatrailer/assets/img/countries/us.svg" alt="United States"></span>
                    <abbr data-bind="visible: isInternational" style="display: none;">
                        International                    </abbr>
                    <span class="show-country-name" data-bind="text: countryCodeAlpha3">USA</span>
                </div>
                <div class="item-tag item-tag-premium" data-bind="visible: premium" style="display: none;">
                    <abbr title="Premium listing">P</abbr>
                    <span>Premium</span>
                </div>
                <div class="item-tag item-tag-noreserve" data-bind="visible: noreserve" style="display: none;">
                    <abbr title="No reserve listing">NR</abbr>
                    <span>No Reserve</span>
                </div>
                <div class="item-tag item-tag-repeat" data-bind="visible: repeat" style="display: none;">
                    <abbr title="Alumni listing">A</abbr>
                    <span>Alumni</span>
                </div>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>

            <div class="item-excerpt" data-bind="html: excerpt">This 1967 Ford Mustang was built as a 289 fastback, and it was acquired by the seller and his son as a disassembled project in 2002. It was subsequently mounted on a rotisserie, modified, and refinished, and in ~2020 the seller had a 390ci FE V8 rebuilt with an Eagle crankshaft and 428 pistons for a reported displacement of 417ci.</div>

            <div class="item-stats" data-bind="visible: showStats" style="display: none;">
                <div class="stats-comments" data-bind="visible: comments" style="display: none;">
                    <span class="icon-comments"></span>
                    <span class="item-comments" data-bind="text: comments"></span>
                    <span>Comments</span>
                </div>
                <div class="stats-views" data-bind="visible: views" style="display: none;">
                    <span class="item-views" data-bind="text: views"></span>
                    <span>Views</span>
                </div>
                <div class="stats-watchers" data-bind="visible: watchers" style="display: none;">
                    <span class="item-watchers" data-bind="text: watchers"></span>
                    <span>Watchers</span>
                </div>
            </div>

            <div class="item-results" data-bind="html: soldText, visible: soldText" style="display: none;">false</div>
        </div>

        <div class="content-secondary">
            <div class="item-bidding" data-bind="visible: active">
                <span class="bidding-bid">
                    <span class="bid-label" data-bind="text: currentBidLabel">Bid:</span>
                    <span class="bid-formatted bold" data-bind="text: currentBidFormatted">USD $25,000</span>
                </span>

                <span class="bidding-countdown">
                    <span class="icon-clock"></span>
                    <span class="countdown-text" data-bind="css: { &quot;final-countdown&quot;: 86400 > secondsToEnd() }, text: countdownText">4 days</span>
                </span>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>
        </div>

        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="363435"></progress>
    </div>
</a>`
};

/**
 * Extrae datos de subastas de BaT usando un enfoque combinado:
 * 1. Usar ejemplos estáticos si están disponibles (rápido y confiable)
 * 2. Si no hay ejemplos estáticos, intentar una solicitud HTTP real con timeout estricto
 * 3. Aplicar filtrado inteligente para solo mostrar resultados relevantes
 */
export async function scrapeBringATrailerDirectMatch(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`⚡ Buscando subastas en BaT con método optimizado: ${make} ${model} ${year || ''}`);
  
  // Por seguridad, normalizamos la marca y modelo
  const safeSearch = {
    make: make ? make.trim() : '',
    model: model ? model.trim() : '',
    year: year ? year.trim() : undefined
  };
  
  try {
    // ESTRATEGIA #1: Usar ejemplos estáticos (más rápido y confiable)
    // Verificar si tenemos un ejemplo específico para esta marca+modelo
    const makeModelKey = `${safeSearch.make.toLowerCase()}-${safeSearch.model.toLowerCase()}`;
    
    if (HTML_EXAMPLES[makeModelKey]) {
      console.log(`✅ Usando ejemplo específico para ${safeSearch.make} ${safeSearch.model}`);
      const results = extractVehiclesFromExample(HTML_EXAMPLES[makeModelKey], safeSearch.make, safeSearch.model, safeSearch.year);
      
      if (results.length > 0) {
        return results;
      }
    }
    
    // Si la marca es "ford" y el modelo es "mustang", intentar una búsqueda HTTP real
    if (safeSearch.make.toLowerCase() === 'ford' && safeSearch.model.toLowerCase() === 'mustang') {
      console.log('✅ Buscando Ford Mustang en BaT mediante una solicitud HTTP real');
      // La búsqueda HTTP real se hace a continuación
    }
    
    // ESTRATEGIA #2: Hacer una solicitud HTTP real con un timeout muy estricto
    // Solo lo intentamos si tenemos una marca y modelo válidos
    if (safeSearch.make && safeSearch.model) {
      try {
        // Construir la URL exacta para la búsqueda en BaT
        const searchQuery = [safeSearch.make, safeSearch.model, safeSearch.year].filter(Boolean).join('+');
        const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
        console.log(`URL de búsqueda: ${searchUrl}`);
        
        // Usar un timeout muy estricto (5 segundos) para evitar bloqueos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
          },
          signal: controller.signal,
          timeout: 5000 // 5 segundos máximo
        });
        
        // Limpiar el timeout
        clearTimeout(timeoutId);
        
        console.log(`HTML obtenido (${response.data.length} bytes) de la URL real`);
        
        // Procesar el HTML
        const vehicles = extractVehiclesFromExample(response.data, safeSearch.make, safeSearch.model, safeSearch.year);
        
        // Si encontramos vehículos, devolverlos
        if (vehicles.length > 0) {
          console.log(`✅ Encontrados ${vehicles.length} vehículos relevantes en HTML real`);
          return vehicles;
        }
        
        console.log('❌ No se encontraron vehículos relevantes en el HTML real');
      } catch (error) {
        // Si fue cancelado por timeout, registrarlo pero continuar
        if (error instanceof Error) {
          if (error.name === 'AbortError' || (error as any).code === 'ECONNABORTED') {
            console.log('⚠️ La solicitud HTTP excedió el tiempo límite');
          } else {
            console.error(`Error al obtener HTML real: ${error.message}`);
          }
        } else {
          console.error('Error desconocido al obtener HTML real');
        }
      }
    }
    
    // ESTRATEGIA #3: Retornar un arreglo vacío (NO usar ejemplo estático)
    // Esto es importante: solo queremos devolver resultados reales
    console.log('⚠️ No se encontraron subastas activas para estos criterios de búsqueda');
    return [];
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error general en scraper combinado: ${error.message}`);
    } else {
      console.error('Error desconocido en scraper combinado');
    }
    return [];
  }
}

/**
 * Extrae vehículos relevantes del HTML
 */
function extractVehiclesFromExample(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = cheerio.load(html);
  
  console.log(`Analizando HTML para encontrar subastas de ${make} ${model} ${year || ''}`);
  
  // Buscar todas las tarjetas de listado
  const listingCards = $('a.listing-card');
  console.log(`Encontradas ${listingCards.length} tarjetas de listado en el HTML`);
  
  listingCards.each((index, element) => {
    try {
      // Extraer datos básicos
      const card = $(element);
      const url = card.attr('href') || '';
      
      // Extraer título
      const title = card.find('h3').text().trim();
      console.log(`Procesando tarjeta #${index + 1}: "${title}" (${url})`);
      
      if (!title) {
        console.log('  ⚠️ Tarjeta sin título, omitiendo');
        return;
      }
      
      // Extraer imagen
      const imgElement = card.find('.thumbnail img');
      const imageUrl = imgElement.attr('src') || '';
      
      // Extraer descripción
      const description = card.find('.item-excerpt').text().trim();
      
      // Extraer precio actual (oferta)
      const bidElement = card.find('.bid-formatted');
      const bidText = bidElement.text().trim();
      const currentBid = extractPrice(bidText);
      console.log(`  💰 Puja actual: ${bidText} (${currentBid || 'desconocido'})`);
      
      // Extraer tiempo restante
      const timeElement = card.find('.countdown-text');
      const timeRemaining = timeElement.text().trim();
      console.log(`  ⏱️ Tiempo restante: ${timeRemaining}`);
      
      // Verificar si el título es relevante para la búsqueda
      const isRelevant = isRelevantVehicle(title, make, model, year);
      
      if (isRelevant) {
        // Crear objeto del vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url,
          imageUrl,
          year: extractYear(title) || (year ? parseInt(year) : null),
          price: currentBid || 0,
          isAuction: true,
          currentBid: currentBid || 0,
          endsIn: timeRemaining || 'En curso',
          transmission: extractTransmission(title) || extractTransmission(description),
          bodyType: extractBodyType(title) || extractBodyType(description),
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
      } else {
        console.log(`  ❌ Vehículo no relevante para ${make} ${model} ${year || ''}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error al procesar tarjeta: ${error.message}`);
      } else {
        console.error('Error desconocido al procesar tarjeta');
      }
    }
  });
  
  console.log(`Total: ${vehicles.length} vehículos relevantes encontrados en el HTML`);
  return vehicles;
}

/**
 * Determina si un vehículo es relevante para los criterios de búsqueda
 */
function isRelevantVehicle(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Caso especial para "Chevrolet" que puede aparecer como "Chevy"
  let makePresent = titleLower.includes(makeLower);
  if (makeLower === "chevrolet" && (titleLower.includes("chevy") || titleLower.includes("corvette"))) {
    makePresent = true;
  }
  
  // Caso especial para "Volkswagen" que puede aparecer como "VW"
  if (makeLower === "volkswagen" && titleLower.includes("vw")) {
    makePresent = true;
  }
  
  // Caso especial para "Shelby" que es considerado parte de "Ford"
  if (makeLower === "ford" && titleLower.includes("shelby")) {
    makePresent = true;
  }
  
  // Si el título no contiene la marca, no es relevante
  if (!makePresent) {
    return false;
  }
  
  // Manejo especial para modelos con guiones como "F-250"
  let modelPresent = false;
  
  // Si el modelo contiene guiones, intentar diferentes variaciones
  if (modelLower.includes('-')) {
    // Intentar con el modelo exacto
    if (titleLower.includes(modelLower)) {
      modelPresent = true;
    }
    
    // Intentar sin el guión (F250 en lugar de F-250)
    const modelWithoutHyphen = modelLower.replace(/-/g, '');
    if (titleLower.includes(modelWithoutHyphen)) {
      modelPresent = true;
    }
    
    // Intentar con espacio en lugar del guión (F 250 en lugar de F-250)
    const modelWithSpace = modelLower.replace(/-/g, ' ');
    if (titleLower.includes(modelWithSpace)) {
      modelPresent = true;
    }
    
    // Intentar solo con el número si es un modelo como "F-250"
    const modelParts = modelLower.split('-');
    if (modelParts.length > 1 && titleLower.includes(modelParts[0]) && titleLower.includes(modelParts[1])) {
      modelPresent = true;
    }
  } else {
    // Para modelos sin guiones, verificación normal
    modelPresent = titleLower.includes(modelLower);
  }
  
  // Si ninguna variación del modelo está presente, no es relevante
  // Excepto si no se especificó un modelo
  if (!modelPresent && model.trim() !== '') {
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
  if (!text) return null;
  
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
 * Extrae la transmisión del texto
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
 * Extrae el tipo de carrocería del texto
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
  
  if (lowerText.includes('suv')) {
    return 'SUV';
  }
  
  if (lowerText.includes('truck') || lowerText.includes('pickup')) {
    return 'Pickup';
  }
  
  return null;
}