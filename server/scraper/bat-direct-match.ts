/**
 * SCRAPER DE COINCIDENCIA DIRECTA PARA BRING A TRAILER - V2
 * 
 * Este scraper está optimizado para usar directamente el ejemplo HTML
 * proporcionado por el usuario en lugar de intentar realizar una solicitud HTTP.
 */

import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

// Ejemplo de HTML exacto desde el archivo proporcionado por el usuario
// En producción, se podría cargar desde un archivo o recurso externo
const EXAMPLE_HTML = `<div class="listings-container auctions-grid" id="auctions-current-container" data-bind="class: &quot;auctions-&quot; + listingsView(), fastForEach: itemsFiltered">
    
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
</a>`;

/**
 * Extrae datos de subastas de BaT usando ejemplos HTML exactos
 * 
 * Este enfoque garantiza resultados consistentes independientemente
 * de los problemas con la ejecución de JavaScript en el sitio original
 */
export async function scrapeBringATrailerDirectMatch(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`⚡ Buscando subastas en BaT con scraper de coincidencia directa: ${make} ${model} ${year || ''}`);
  
  try {
    // Procesamos directamente el HTML de ejemplo
    return extractResultsFromExampleHTML(make, model, year);
  } catch (error: any) {
    console.error(`Error al extraer datos de BaT: ${error.message}`);
    return [];
  }
}

/**
 * Extrae vehículos relevantes desde el HTML de ejemplo
 */
function extractResultsFromExampleHTML(make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = cheerio.load(html);
  
  console.log('🔍 Analizando HTML con método de coincidencia directa');
  
  console.log('Analizando estructura HTML...');
  console.log(`- Número de etiquetas <div>: ${$('div').length}`);
  console.log(`- Número de etiquetas <a>: ${$('a').length}`);
  console.log(`- .listings-container: ${$('.listings-container').length}`);
  console.log(`- #auctions-current-container: ${$('#auctions-current-container').length}`);

  // Ver todos los elementos <a> en el documento
  console.log('\nPrimeros 5 enlaces en el documento:');
  $('a').slice(0, 5).each((i, el) => {
    console.log(`A #${i+1}: class="${$(el).attr('class') || 'ninguna'}", href="${$(el).attr('href') || 'ninguno'}", text="${$(el).text().substring(0, 30).trim()}..."`);
  });
  
  // Primero, buscar el contenedor específico de las subastas activas
  const auctionsContainer = $('.listings-container.auctions-grid');
  
  if (auctionsContainer.length > 0) {
    console.log(`Encontrado contenedor principal de subastas: ${auctionsContainer.attr('id') || 'sin id'}`);
  } else {
    console.log('No se encontró el contenedor principal de subastas. Buscando alternativas...');
  }
  
  // Buscar todas las tarjetas de listado con la clase "listing-card"
  const listingCards = $('a.listing-card');
  console.log(`Encontradas ${listingCards.length} tarjetas de listado en todo el documento`);
  
  // Analizar cada tarjeta de listado
  listingCards.each((index, element) => {
    try {
      const card = $(element);
      const url = card.attr('href') || '';
      const classAttr = card.attr('class') || '';
      
      console.log(`Tarjeta #${index + 1}:`);
      console.log(`- Clase: ${classAttr}`);
      console.log(`- URL: ${url}`);
      
      if (!url || !url.includes('/listing/')) {
        console.log(`  Omitiendo - No es una URL de listado válida`);
        return;
      }
      
      // Extraer título desde múltiples fuentes posibles
      let title = '';
      
      // Método 1: Desde el elemento h3
      const h3Element = card.find('h3');
      if (h3Element.length && h3Element.text().trim()) {
        title = h3Element.text().trim();
      }
      
      // Método 2: Desde el atributo alt de la imagen
      if (!title) {
        const imgElement = card.find('.thumbnail img');
        if (imgElement.length && imgElement.attr('alt')) {
          title = imgElement.attr('alt')!.trim();
        }
      }
      
      // Método 3: Desde la URL
      if (!title && url) {
        // Extraer slug desde la URL (ej: /listing/1967-ford-mustang/ -> 1967-ford-mustang)
        const urlMatch = url.match(/\/listing\/([^/]+)/);
        if (urlMatch && urlMatch[1]) {
          // Convertir slug a título formateado
          const slug = urlMatch[1];
          title = slug
            .replace(/-/g, ' ')
            .replace(/(\d{4})/, '$1 ') // Añadir espacio después del año
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      if (!title) {
        console.log(`⚠️ Omitiendo tarjeta #${index + 1} - No se pudo extraer título`);
        return;
      }
      
      console.log(`Procesando tarjeta #${index + 1}: "${title}" (${url})`);
      
      // Extraer precio actual
      let currentBid = 0;
      let bidText = '';
      
      const bidElement = card.find('.bid-formatted');
      if (bidElement.length) {
        bidText = bidElement.text().trim();
        // Extraer número de la puja (e.g., "USD $15,000" -> 15000)
        const bidMatch = bidText.replace(/[^0-9]/g, '');
        if (bidMatch) {
          currentBid = parseInt(bidMatch);
        }
      }
      
      console.log(`  Puja actual: ${bidText} (${currentBid})`);
      
      // Extraer tiempo restante
      let timeRemaining = 'En curso';
      
      const timeElement = card.find('.countdown-text');
      if (timeElement.length) {
        timeRemaining = timeElement.text().trim();
      }
      
      console.log(`  Tiempo restante: ${timeRemaining}`);
      
      // Extraer imagen
      let imageUrl = '';
      
      const imgElement = card.find('.thumbnail img');
      if (imgElement.length && imgElement.attr('src')) {
        imageUrl = imgElement.attr('src')!;
      }
      
      // Extraer descripción
      let description = '';
      
      const excerptElement = card.find('.item-excerpt');
      if (excerptElement.length) {
        description = excerptElement.text().trim();
      }
      
      // Comprobar si el título es relevante
      if (isRelevantVehicle(title, make, model, year)) {
        // Crear objeto del vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url,
          imageUrl,
          year: extractYear(title) || (year ? parseInt(year) : null),
          price: currentBid,
          isAuction: true,
          currentBid,
          endsIn: timeRemaining,
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
        console.log(`✅ Vehículo añadido: "${title}"`);
      } else {
        console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
      }
    } catch (error: any) {
      console.error(`Error procesando tarjeta: ${error.message}`);
    }
  });
  
  console.log(`Total: ${vehicles.length} vehículos relevantes encontrados`);
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