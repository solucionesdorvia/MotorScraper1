/**
 * SCRAPER ESPECIALIZADO PARA PROCESAMIENTO DE HTML YA RENDERIZADO DE BRING A TRAILER
 * 
 * Este scraper está diseñado para procesar ejemplos de HTML donde Knockout.js ya ha
 * renderizado los listados de vehículos. Utiliza la estructura exacta observada en
 * el HTML proporcionado por el usuario.
 */

import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Extrae vehículos de un ejemplo de HTML ya renderizado
 */
export async function scrapeBringATrailerFromExample(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    // Aquí utilizaríamos normalmente axios para obtener HTML dinámicamente,
    // pero para este caso especial, utilizamos HTML local proporcionado por el usuario
    console.log(`Procesando HTML de ejemplo para buscar: ${make} ${model} ${year || ''}`);
    
    // Cargar HTML estático de ejemplo
    const html = EXAMPLE_HTML;
    
    // Extraer vehículos del HTML
    return extractVehiclesFromHTML(html, make, model, year);
  } catch (error: any) {
    console.error(`Error al procesar HTML de ejemplo: ${error.message}`);
    return [];
  }
}

/**
 * Extrae vehículos del HTML renderizado
 */
function extractVehiclesFromHTML(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const $ = cheerio.load(html);
    const vehicles: InsertVehicle[] = [];
    
    console.log('Analizando HTML ya renderizado de Bring a Trailer...');
    
    // Buscar todos los listados de vehículos
    $('.listing-card').each((index, element) => {
      try {
        const card = $(element);
        const href = card.attr('href') || '';
        
        // Extraer título del h3
        const title = card.find('h3').text().trim();
        console.log(`Encontrado listado #${index + 1}: ${title || '[Sin título]'}`);
        
        // Extraer información de puja
        const bidElement = card.find('.bid-formatted');
        const bidText = bidElement.text().trim();
        const price = extractPrice(bidText);
        
        // Extraer tiempo restante
        const timeElement = card.find('.countdown-text');
        const timeRemaining = timeElement.text().trim();
        
        // Extraer imagen
        const imageElement = card.find('.thumbnail img');
        const imageUrl = imageElement.attr('src') || '';
        
        // Extraer descripción (opcional)
        const excerptElement = card.find('.item-excerpt');
        const excerpt = excerptElement.text().trim();
        
        // Verificar si el título es relevante para nuestra búsqueda
        if (title && isRelevant(title, make, model, year)) {
          // Crear objeto de vehículo
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            source: 'bringatrailer',
            sourceUrl: href,
            imageUrl,
            year: extractYear(title) || (year ? parseInt(year) : null),
            price: price || 0,
            isAuction: true,
            currentBid: price || 0,
            endsIn: timeRemaining || 'En curso',
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
          console.log(`✅ Vehículo relevante añadido: "${title}" con puja ${bidText}`);
        } else if (title) {
          console.log(`❌ Vehículo no relevante para ${make} ${model} ${year || ''}: "${title}"`);
        } else {
          console.log(`⚠️ Listado sin título descartado`);
        }
      } catch (error: any) {
        console.error(`Error al procesar tarjeta: ${error.message}`);
      }
    });
    
    console.log(`Total de vehículos relevantes encontrados: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error(`Error al extraer datos del HTML de ejemplo: ${error.message}`);
    return [];
  }
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Caso especial para "Chevrolet" que puede aparecer como "Chevy"
  let makePresent = titleLower.includes(makeLower);
  if (makeLower === "chevrolet" && titleLower.includes("chevy")) {
    makePresent = true;
  }
  
  // Caso especial para "Volkswagen" que puede aparecer como "VW"
  if (makeLower === "volkswagen" && titleLower.includes("vw")) {
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
  if (!modelPresent) {
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
 * Extrae la transmisión del título
 */
function extractTransmission(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('manual') || lowerText.includes('speed') || lowerText.includes('5-speed') || lowerText.includes('4-speed') || lowerText.includes('6-speed')) {
    // Intentar extraer el número de velocidades
    const speedMatch = lowerText.match(/(\d)(?:-|\s)?speed/i);
    if (speedMatch) {
      return `Manual ${speedMatch[1]}-Velocidades`;
    }
    return 'Manual';
  }
  
  if (lowerText.includes('automatic') || lowerText.includes('auto')) {
    return 'Automático';
  }
  
  return null;
}

/**
 * Extrae el tipo de carrocería del título
 */
function extractBodyType(text: string): string | null {
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

// HTML de ejemplo con listados de Ford Mustang renderizados
// Este HTML proviene de los ejemplos proporcionados por el usuario
const EXAMPLE_HTML = `
<div class="search-result-live-listings" id="search-result-live-listings">
        <div class="search-result-listings" id="search-result-listings" data-bind="fastForEach: itemsFiltered">
                        
<a class="listing-card bg-white-transparent" data-bind="attr: { href: url, &quot;data-pusher&quot;: pusher}, fadeVisible: isVisible" style="" href="https://bringatrailer.com/listing/1969-ford-mustang-boss-429-35/" data-pusher="post;list;92873241">
    <div class="thumbnail">
        <img data-bind="attr: { src: thumbnailUrl, alt: title }" src="https://bringatrailer.com/wp-content/uploads/2025/04/1969_ford_mustang-boss-429_ai3a7229-low-res-60083.jpg?resize=470%2C318" alt="1969 Ford Mustang Boss 429">
        <div class="image-overlay"></div>
        <div class="icon-item-watch" data-bind="css: { &quot;item-watched&quot;: watched }, attr: { &quot;data-watch-url&quot;: watchUrl }, click: toggleListingWatch" data-watch-url="https://bringatrailer.com/wp-admin/admin-ajax.php?action=bat_listing_watch&amp;listing=92873241"></div>
        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="73386"></progress>
    </div>

    <div class="content">
        <div class="content-main">
            <div class="icon-live" data-bind="visible: showLive" style="display: none;"></div>
            <h3 data-bind="html: title">1969 Ford Mustang Boss 429</h3>

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
                <div class="item-tag item-tag-noreserve" data-bind="visible: noreserve">
                    <abbr title="No reserve listing">NR</abbr>
                    <span>No Reserve</span>
                </div>
                <div class="item-tag item-tag-repeat" data-bind="visible: repeat" style="display: none;">
                    <abbr title="Alumni listing">A</abbr>
                    <span>Alumni</span>
                </div>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>

            <div class="item-excerpt" data-bind="html: excerpt">This 1969 Ford Mustang Boss 429 is one of approximately 850 produced for the model year and was built on March 7th. Assigned Kar Kraft number KK1485, the car was originally delivered to Kirk Ford in Hancock, Maryland, and it is believe to have been restored on a rotisserie c. 2003. It is finished in Black Jade over Black vinyl and is powered by a…</div>

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
                    <span class="bid-formatted bold" data-bind="text: currentBidFormatted">USD $277,500</span>
                </span>

                <span class="bidding-countdown">
                    <span class="icon-clock"></span>
                    <span class="countdown-text final-countdown" data-bind="css: { &quot;final-countdown&quot;: 86400 > secondsToEnd() }, text: countdownText">20:23:06</span>
                </span>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>
        </div>

        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="73386"></progress>
    </div>
</a>
        
                        
<a class="listing-card bg-white-transparent" data-bind="attr: { href: url, &quot;data-pusher&quot;: pusher}, fadeVisible: isVisible" style="" href="https://bringatrailer.com/listing/1969-ford-mustang-boss-429-27-2/" data-pusher="post;list;93076105">
    <div class="thumbnail">
        <img data-bind="attr: { src: thumbnailUrl, alt: title }" src="https://bringatrailer.com/wp-content/uploads/2025/04/1969_ford_mustang-boss-429_ACA88676-893B-4B36-9421-893A7371A49F-39780-scaled.jpeg?resize=470%2C318" alt="Kaase 572-Powered 1969 Ford Mustang Boss 429 Continuation by Classic Recreations">
        <div class="image-overlay"></div>
        <div class="icon-item-watch" data-bind="css: { &quot;item-watched&quot;: watched }, attr: { &quot;data-watch-url&quot;: watchUrl }, click: toggleListingWatch" data-watch-url="https://bringatrailer.com/wp-admin/admin-ajax.php?action=bat_listing_watch&amp;listing=93076105"></div>
        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="418686"></progress>
    </div>

    <div class="content">
        <div class="content-main">
            <div class="icon-live" data-bind="visible: showLive" style="display: none;"></div>
            <h3 data-bind="html: title">Kaase 572-Powered 1969 Ford Mustang Boss 429 Continuation by Classic Recreations</h3>

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

            <div class="item-excerpt" data-bind="html: excerpt">This 1969 Ford Mustang is one of a claimed 17 produced as an officially licensed Boss 429 continuation by Classic Recreations. Each began with a 1969 Mustang body that was modified in the style of a Boss 429, while under the bodywork of this example a Jon Kaase Racing Engines 572ci "Boss Nine" V8 was installed and mated to a six-speed…</div>

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
                    <span class="bid-formatted bold" data-bind="text: currentBidFormatted">USD $150,000</span>
                </span>

                <span class="bidding-countdown">
                    <span class="icon-clock"></span>
                    <span class="countdown-text" data-bind="css: { &quot;final-countdown&quot;: 86400 > secondsToEnd() }, text: countdownText">5 days</span>
                </span>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>
        </div>

        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="418686"></progress>
    </div>
</a>
        </div>

        <div data-bind="if: moreItemsAvailable"></div>
    </div>
`;