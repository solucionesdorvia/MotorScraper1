import axios from 'axios';
import { load } from 'cheerio';
import { InsertVehicle } from '@shared/schema';

/**
 * SCRAPER ESPECIALIZADO PARA DODGE CHALLENGER DE BRING A TRAILER
 * 
 * Basado en el HTML proporcionado por el usuario:
 * - Correctamente extrae elementos dentro de div.listings-container.auctions-grid#auctions-current-container
 * - Procesa el formato exacto observado para títulos, precios y contadores de tiempo
 */

// Ejemplo HTML guardado para respaldo
const DODGE_CHALLENGER_HTML = `<div class="listings-container auctions-grid" id="auctions-current-container" data-bind="class: &quot;auctions-&quot; + listingsView(), fastForEach: itemsFiltered">
    
<a class="listing-card bg-white-transparent" data-bind="attr: { href: url, &quot;data-pusher&quot;: pusher}, fadeVisible: isVisible" style="" href="https://bringatrailer.com/listing/1970-dodge-challenger-t-a-16/" data-pusher="post;list;92840388">
    <div class="thumbnail">
        <img data-bind="attr: { src: thumbnailUrl, alt: title }" src="https://bringatrailer.com/wp-content/uploads/2025/04/1970_dodge_challenger-ta_dsc09061-66921.jpg?resize=470%2C318" alt="1970 Dodge Challenger T/A 340 Six Pack">
        <div class="image-overlay"></div>
        <div class="icon-item-watch" data-bind="css: { &quot;item-watched&quot;: watched }, attr: { &quot;data-watch-url&quot;: watchUrl }, click: toggleListingWatch" data-watch-url="https://bringatrailer.com/wp-admin/admin-ajax.php?action=bat_listing_watch&amp;listing=92840388"></div>
        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="78361"></progress>
    </div>

    <div class="content">
        <div class="content-main">
            <div class="icon-live" data-bind="visible: showLive" style="display: none;"></div>
            <h3 data-bind="html: title">1970 Dodge Challenger T/A 340 Six Pack</h3>

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

            <div class="item-excerpt" data-bind="html: excerpt">This 1970 Dodge Challenger T/A coupe is one of approximately 2,400 produced to homologate the model for competition in the SCCA's Trans-Am series. T/A-specific equipment included a flat-black fiberglass hood with a functional scoop as well as a rear spoiler, longitudinal black stripes, uprated suspension components, and a side-outlet dual…</div>

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
                    <span class="bid-formatted bold" data-bind="text: currentBidFormatted">USD $31,000</span>
                </span>

                <span class="bidding-countdown">
                    <span class="icon-clock"></span>
                    <span class="countdown-text final-countdown" data-bind="css: { &quot;final-countdown&quot;: 86400 > secondsToEnd() }, text: countdownText">21:46:01</span>
                </span>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>
        </div>

        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="78361"></progress>
    </div>
</a>
    
    
<a class="listing-card bg-white-transparent" data-bind="attr: { href: url, &quot;data-pusher&quot;: pusher}, fadeVisible: isVisible" style="" href="https://bringatrailer.com/listing/1970-dodge-charger-41/" data-pusher="post;list;85762587">
    <div class="thumbnail">
        <img data-bind="attr: { src: thumbnailUrl, alt: title }" src="https://bringatrailer.com/wp-content/uploads/2024/11/1970_dodge_charger_001_5-26380.jpg?resize=470%2C318" alt="Hellcat-Powered 1970 Dodge Charger">
        <div class="image-overlay"></div>
        <div class="icon-item-watch" data-bind="css: { &quot;item-watched&quot;: watched }, attr: { &quot;data-watch-url&quot;: watchUrl }, click: toggleListingWatch" data-watch-url="https://bringatrailer.com/wp-admin/admin-ajax.php?action=bat_listing_watch&amp;listing=85762587"></div>
        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="158341"></progress>
    </div>

    <div class="content">
        <div class="content-main">
            <div class="icon-live" data-bind="visible: showLive" style="display: none;"></div>
            <h3 data-bind="html: title">Hellcat-Powered 1970 Dodge Charger</h3>

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

            <div class="item-excerpt" data-bind="html: excerpt">This 1970 Dodge Charger was acquired by the seller in 2023 as a rolling shell that became the basis for a custom build displayed at SEMA later that year. The body was modified with flared fenders and a carbon-fiber roof overlay, and a supercharged 6.2-liter Hemi V8 and eight-speed TorqueFlite automatic transmission sourced from a 2016 Challenger…</div>

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
                    <span class="bid-formatted bold" data-bind="text: currentBidFormatted">USD $80,000</span>
                </span>

                <span class="bidding-countdown">
                    <span class="icon-clock"></span>
                    <span class="countdown-text" data-bind="css: { &quot;final-countdown&quot;: 86400 > secondsToEnd() }, text: countdownText">2 days</span>
                </span>
            </div>

            <div class="item-distance" data-bind="visible: showDistance" style="display: none;"><span data-bind="text: distanceText">United States</span> <span class="item-distance-from" data-bind="text: distanceFrom"></span></div>
        </div>

        <progress max="120" data-bind="css: { &quot;progress-counting&quot;: 121 > secondsToEnd() &amp;&amp; 0 < secondsToEnd(), &quot;progress-final-min&quot;: 61 > secondsToEnd() }, value: secondsToEnd()" value="158341"></progress>
    </div>
</a>
    </div>`;

// Patrón de búsqueda actualizado para extraer elementos apropiados 
export async function scrapeBringATrailerDodge(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`🔎 Buscando con scraper ESPECIALIZADO para Dodge: ${make} ${model} ${year || ''}`);
  
  try {
    // Primero intentamos hacer una solicitud HTTP real
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    try {
      // Usar un timeout más generoso (10 segundos) para evitar problemas de conectividad
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000 // 10 segundos máximo
      });
      
      if (response.status === 200 && response.data) {
        console.log(`✅ HTML obtenido (${response.data.length} bytes) de la URL real`);
        
        // Extraer vehículos del HTML
        const vehicles = extractVehiclesFromHTML(response.data, make, model, year);
        
        if (vehicles.length > 0) {
          console.log(`✅ Encontrados ${vehicles.length} vehículos relevantes en el HTML real.`);
          return vehicles;
        } else {
          console.log('⚠️ No se encontraron vehículos relevantes en el HTML real.');
        }
      } else {
        console.error(`❌ Respuesta no válida: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error al obtener datos de Bring a Trailer: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
    
    // Si no se pudieron obtener resultados o hubo errores, intentamos con una URL alternativa
    try {
      console.log('⚠️ Intentando con URL alternativa...');
      const alternativeUrl = `https://bringatrailer.com/search/?s=${encodeURIComponent(searchQuery)}`;
      console.log(`URL alternativa: ${alternativeUrl}`);
      
      const response = await axios.get(alternativeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data) {
        console.log(`✅ HTML alternativo obtenido (${response.data.length} bytes)`);
        
        // Extraer vehículos del HTML alternativo
        const vehicles = extractVehiclesFromHTML(response.data, make, model, year);
        
        if (vehicles.length > 0) {
          console.log(`✅ Encontrados ${vehicles.length} vehículos relevantes en el HTML alternativo.`);
          return vehicles;
        } else {
          console.log('⚠️ No se encontraron vehículos relevantes en el HTML alternativo.');
        }
      }
    } catch (error) {
      console.error(`❌ Error al obtener datos alternativos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
    
    // Si todas las opciones fallaron, devolvemos array vacío
    console.log('❌ No se pudieron obtener datos reales de Bring a Trailer');
    return [];
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error general en scraper de Dodge: ${error.message}`);
    } else {
      console.error('Error desconocido en scraper de Dodge');
    }
    return [];
  }
}

/**
 * Extrae vehículos del HTML de BaT, con énfasis en el contenedor específico de listados
 */
function extractVehiclesFromHTML(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = load(html);
  
  console.log(`Analizando HTML con selector actualizado para encontrar subastas de ${make} ${model} ${year || ''}`);
  
  // Buscar el contenedor específico basado en el ejemplo del usuario
  // El contenedor es el que tiene las clases "listings-container auctions-grid" y ID "auctions-current-container"
  const listingsContainer = $('.listings-container.auctions-grid#auctions-current-container');
  
  if (listingsContainer.length === 0) {
    console.log('❌ No se encontró el contenedor #auctions-current-container.listings-container.auctions-grid');
    
    // Intentar con un selector más simple como respaldo
    const simpleFallback = $('.listings-container');
    if (simpleFallback.length > 0) {
      console.log(`✅ Encontrado contenedor simple: ${simpleFallback.length} contenedores`);
    } else {
      console.log('❌ Tampoco se encontró contenedor simple .listings-container');
      return vehicles;
    }
  } else {
    console.log(`✅ Encontrado contenedor principal con ${listingsContainer.find('a.listing-card').length} tarjetas de listado`);
  }
  
  // Buscar todas las tarjetas de listado usando distintos selectores
  let cards = $();
  
  // Estrategia 1: Buscar en el contenedor específico
  const cardsInContainer = $(listingsContainer).find('a.listing-card');
  if (cardsInContainer.length > 0) {
    console.log(`Encontradas ${cardsInContainer.length} tarjetas en el contenedor principal`);
    cards = cardsInContainer;
  } else {
    // Estrategia 2: Buscar en cualquier contenedor de listings
    const cardsInGenericContainer = $('.listings-container a.listing-card');
    if (cardsInGenericContainer.length > 0) {
      console.log(`Encontradas ${cardsInGenericContainer.length} tarjetas en contenedores genéricos`);
      cards = cardsInGenericContainer;
    } else {
      // Estrategia 3: Buscar cualquier tarjeta de listado en toda la página
      console.log('⚠️ No se encontraron tarjetas en los contenedores, buscando en toda la página');
      cards = $('a.listing-card');
      
      // Estrategia 4: Buscar resultados de búsqueda generales
      if (cards.length === 0) {
        console.log('⚠️ No se encontraron tarjetas estándar, buscando resultados generales');
        cards = $('.search-result-items .listing-card, .search-results .auction-item, .search-results-loop a.tile, .search-result-live-listings a');
      }
    }
  }
  
  console.log(`Encontradas ${cards.length} tarjetas de listado en total`);
  
  // Procesar cada tarjeta
  cards.each(function(index, element) {
    try {
      const card = $(element);
      
      // Extraer URL del listado
      const url = card.attr('href') || '';
      
      // Extraer título usando diferentes selectores posibles
      let title = '';
      const h3 = card.find('h3');
      if (h3.length > 0) {
        title = h3.text().trim();
      } else {
        const h4 = card.find('h4, .item-title, .listing-title, .auction-title');
        if (h4.length > 0) {
          title = h4.text().trim();
        } else {
          // Última opción: intentar encontrar cualquier elemento que parezca un título
          const possibleTitle = card.find('strong, .title, .name').first();
          if (possibleTitle.length > 0) {
            title = possibleTitle.text().trim();
          }
        }
      }
      
      console.log(`Analizando listado #${index + 1}: "${title}" (${url})`);
      
      if (!title) {
        console.log('  ⚠️ Listado sin título, omitiendo');
        return;
      }
      
      // Extraer imagen con diferentes selectores posibles
      let imageUrl = '';
      const imgInThumbnail = card.find('.thumbnail img');
      if (imgInThumbnail.length > 0) {
        imageUrl = imgInThumbnail.attr('src') || '';
      } else {
        const anyImg = card.find('img');
        if (anyImg.length > 0) {
          imageUrl = anyImg.attr('src') || '';
        } else {
          const imgContainer = card.find('.image-container, .listing-image, .auction-image');
          if (imgContainer.length > 0) {
            const imgInContainer = imgContainer.find('img');
            if (imgInContainer.length > 0) {
              imageUrl = imgInContainer.attr('src') || '';
            } else {
              // Intentar encontrar un background-image
              const style = imgContainer.attr('style') || '';
              const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
              if (bgMatch) {
                imageUrl = bgMatch[1];
              }
            }
          }
        }
      }
      
      // Extraer descripción con diferentes selectores posibles
      let description = '';
      const excerpt = card.find('.item-excerpt, .description, .auction-excerpt');
      if (excerpt.length > 0) {
        description = excerpt.text().trim();
      }
      
      // Extraer precio actual (oferta) con diferentes selectores posibles
      let bidText = '';
      let currentBid = null;
      
      const bidFormatted = card.find('.bid-formatted, .current-bid, .price, .auction-price');
      if (bidFormatted.length > 0) {
        bidText = bidFormatted.text().trim();
        currentBid = extractPrice(bidText);
      } else {
        // Buscar cualquier texto que parezca un precio
        const possiblePriceElements = card.find('*').filter(function() {
          const text = $(this).text().trim();
          return /\$\d+|\d+\s*USD/i.test(text);
        });
        
        if (possiblePriceElements.length > 0) {
          bidText = possiblePriceElements.first().text().trim();
          currentBid = extractPrice(bidText);
        }
      }
      
      console.log(`  💰 Puja actual: ${bidText} (${currentBid || 'desconocido'})`);
      
      // Extraer tiempo restante con diferentes selectores posibles
      let timeRemaining = '';
      const countdownText = card.find('.countdown-text, .countdown, .time-left, .auction-end-time');
      if (countdownText.length > 0) {
        timeRemaining = countdownText.text().trim();
      } else {
        // Buscar cualquier texto que parezca un tiempo
        const possibleTimeElements = card.find('*').filter(function() {
          const text = $(this).text().trim();
          return /\d+d|\d+h|\d+m|days?|hours?|mins?|ending|ends/i.test(text);
        });
        
        if (possibleTimeElements.length > 0) {
          timeRemaining = possibleTimeElements.first().text().trim();
        }
      }
      
      console.log(`  ⏱️ Tiempo restante: ${timeRemaining}`);
      
      // Verificar si el título es relevante para la búsqueda
      // Para Dodge Challenger, aceptamos tanto "Dodge Challenger" como "Challenger" a secas
      let isRelevant = false;
      
      const titleLower = title.toLowerCase();
      const makeLower = make.toLowerCase();
      const modelLower = model.toLowerCase();
      
      if (makeLower === 'dodge' && modelLower === 'challenger') {
        if (titleLower.includes('dodge') && titleLower.includes('challenger')) {
          isRelevant = true;
        } else if (titleLower.includes('challenger')) {
          isRelevant = true;
        }
      } else if (makeLower === 'dodge' && modelLower === 'charger') {
        if (titleLower.includes('dodge') && titleLower.includes('charger')) {
          isRelevant = true;
        } else if (titleLower.includes('charger')) {
          isRelevant = true;
        }
      } else {
        // Para otros modelos
        isRelevant = titleLower.includes(makeLower) && titleLower.includes(modelLower);
      }
      
      // Si se especificó un año, verificar si el título contiene el año
      if (year && !titleLower.includes(year)) {
        isRelevant = false;
      }
      
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
  
  if (lowerText.includes('automatic') || lowerText.includes('auto') || lowerText.includes('automático') || lowerText.includes('torqueflit')) {
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