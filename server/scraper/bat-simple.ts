/**
 * Scraper simplificado para Bring a Trailer que se enfoca en extraer directamente las tarjetas de subastas activas
 * Basado en el código proporcionado por el usuario
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '@shared/schema';

interface BaTListing {
  title: string;
  image: string;
  link: string;
  description: string;
  price: number | null;
  timeRemaining?: string;
}

/**
 * Extrae todas las subastas activas de Bring a Trailer usando un enfoque simplificado
 * que se centra en las tarjetas de listados visibles
 */
export async function scrapeBringATrailerSimple(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  // Construir la consulta base
  const query = year ? `${make} ${model} ${year}` : `${make} ${model}`;
  
  // Consultar la URL principal para obtener resultados de búsqueda que incluyen subastas activas
  // URL principal de búsqueda
  const searchUrl = `https://bringatrailer.com/search/?s=${encodeURIComponent(query)}`;
  
  // URL directa a la página de subastas activas
  const auctionResultsUrl = `https://bringatrailer.com/search/auction-results/?s=${encodeURIComponent(query)}&status=open`;
  
  console.log(`URL de búsqueda para subastas activas en BaT (URL principal): ${searchUrl}`);
  console.log(`URL directa a subastas activas en BaT: ${auctionResultsUrl}`);
  
  // User-Agent realista para simular navegador
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  };

  try {
    console.log(`Consultando URL simplificada: ${searchUrl}`);
    const { data: html } = await axios.get(searchUrl, { headers });
    
    // Si no obtenemos resultados de la búsqueda principal, intentar con la URL de subastas activas
    let listings = extractListings(html);
    
    if (listings.length === 0) {
      console.log(`No se encontraron resultados en la URL principal, intentando URL directa a subastas activas: ${auctionResultsUrl}`);
      try {
        const { data: auctionHtml } = await axios.get(auctionResultsUrl, { headers });
        listings = extractListings(auctionHtml);
      } catch (auctionError) {
        console.error(`Error consultando URL de subastas activas: ${auctionError}`);
      }
    }

    console.log(`Encontrados ${listings.length} listados en la versión simplificada`);

    // Eliminar duplicados basados en la URL
    const uniqueListings = removeDuplicates(listings);
    console.log(`Después de eliminar duplicados: ${uniqueListings.length} listados únicos`);

    // Convertir los listados de BaT a formato InsertVehicle
    const vehicles: InsertVehicle[] = uniqueListings
      .filter(listing => isRelevant(listing.title, make, model, year))
      .map(listing => {
        // Extraer año del título
        const yearMatch = listing.title.match(/(19\d{2}|20\d{2})/);
        const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);

        // Todas las subastas en este div son ACTIVAS
        // Vamos a traducir el tiempo restante al español
        const timeRemaining = listing.timeRemaining || '';
        let endsIn = 'En curso';
        
        if (timeRemaining) {
          if (timeRemaining.includes('day')) {
            const days = timeRemaining.match(/(\d+)/);
            if (days && days[1]) {
              endsIn = days[1] === '1' ? '1 día' : `${days[1]} días`;
            }
          } else if (timeRemaining.includes('hour')) {
            const hours = timeRemaining.match(/(\d+)/);
            if (hours && hours[1]) {
              endsIn = hours[1] === '1' ? '1 hora' : `${hours[1]} horas`;
            }
          } else if (timeRemaining.includes('min')) {
            const mins = timeRemaining.match(/(\d+)/);
            if (mins && mins[1]) {
              endsIn = mins[1] === '1' ? '1 minuto' : `${mins[1]} minutos`;
            }
          }
        }

        return {
          title: listing.title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: listing.link.startsWith('http') ? listing.link : `https://bringatrailer.com${listing.link}`,
          imageUrl: listing.image || 'https://i.imgur.com/U45aNlT.jpg', // Imagen predeterminada en Imgur
          year: extractedYear,
          price: listing.price,
          isAuction: true,
          currentBid: listing.price,
          endsIn: endsIn, // Tiempo restante traducido al español
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
      });

    console.log(`Convertidos ${vehicles.length} vehículos relevantes de ${uniqueListings.length} listados`);
    
    // Registrar detalles de cada vehículo
    vehicles.forEach((vehicle, index) => {
      console.log(`Vehículo ${index + 1}: ${vehicle.title} - Precio: ${vehicle.price} - Tiempo: ${vehicle.endsIn}`);
    });
    
    if (vehicles.length === 0) {
      console.log('⚠️ No se encontraron subastas activas para esta búsqueda');
    } else {
      console.log('✅ ÉXITO: Encontradas ' + vehicles.length + ' subastas ACTIVAS con el scraper simplificado');
    }
    
    return vehicles;
  } catch (error) {
    console.error('Error scraping Bring a Trailer (simple):', error);
    return [];
  }
}

/**
 * Elimina listados duplicados basándose en la URL
 */
function removeDuplicates(listings: BaTListing[]): BaTListing[] {
  const uniqueUrls = new Set<string>();
  return listings.filter(listing => {
    const normalizedUrl = listing.link.toLowerCase();
    if (uniqueUrls.has(normalizedUrl)) {
      return false;
    }
    uniqueUrls.add(normalizedUrl);
    return true;
  });
}

/**
 * Extrae los listados de Bring a Trailer desde el HTML enfocándose específicamente en las
 * subastas en vivo dentro del div "search-result-listings", basándose en el HTML de ejemplo.
 */
function extractListings(html: string): BaTListing[] {
  const $ = cheerio.load(html);
  const listings: BaTListing[] = [];

  console.log('Analizando HTML para encontrar subastas ACTIVAS...');
  
  // Lógica de extracción 1: Buscar específicamente el div search-result-listings
  console.log('Método 1: Buscando div "search-result-listings"...');
  const searchResultListings = $('div.search-result-listings, #search-result-listings');
  
  if (searchResultListings.length > 0) {
    console.log('✅ Encontrado el div "search-result-listings"');
    
    // Buscar todas las tarjetas de listado dentro de search-result-listings
    const liveListingsCards = searchResultListings.find('a.listing-card');
    console.log(`Encontradas ${liveListingsCards.length} tarjetas de subastas ACTIVAS con Método 1`);
    
    if (liveListingsCards.length === 0) {
      console.log('⚠️ No se encontraron tarjetas dentro del div search-result-listings');
    }
    
    // Procesar cada tarjeta de subasta activa
    liveListingsCards.each((index, element) => {
      const $el = $(element);
      
      // Extraer el título exactamente como en el HTML de ejemplo
      const title = $el.find('h3').text().trim();
      
      // Extraer la imagen exactamente como en el HTML de ejemplo
      const image = $el.find('.thumbnail img').attr('src') || '';
      
      // Obtener el enlace completo exactamente como en el HTML de ejemplo
      const link = $el.attr('href') || '';
      
      // Buscar descripción exactamente como en el HTML de ejemplo
      const description = $el.find('.item-excerpt').text().trim();
      
      // Extraer precio/oferta actual exactamente como en el HTML de ejemplo
      let price: number | null = null;
      const bidText = $el.find('.bid-formatted').text().trim();
      
      if (bidText) {
        // Intentar extraer precio con formato "USD $XX,XXX" (formato exacto del ejemplo)
        const priceMatch = bidText.match(/USD\s+\$(\d{1,3}(,\d{3})*|\d+)/) || 
                           bidText.match(/\$(\d{1,3}(,\d{3})*|\d+)/);
        
        if (priceMatch && priceMatch[1]) {
          price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          console.log(`Precio extraído: $${price}`);
        }
      }
      
      // Extraer tiempo restante exactamente como en el HTML de ejemplo
      const timeRemaining = $el.find('.countdown-text').text().trim();
      
      console.log(`Subasta #${index + 1}:`);
      console.log(`Título: "${title}"`);
      console.log(`Enlace: "${link}"`);
      console.log(`Imagen: "${image}"`);
      console.log(`Descripción: "${description}"`);
      console.log(`Oferta actual: "${bidText}" => $${price || 'N/A'}`);
      console.log(`Tiempo restante: "${timeRemaining}"`);
      
      if (title && link) {
        console.log(`✅ Subasta ACTIVA encontrada: ${title} - ${price ? '$' + price : 'Sin oferta'} - ${timeRemaining}`);
        listings.push({ 
          title, 
          image: image || 'https://i.imgur.com/U45aNlT.jpg', 
          link, 
          description,
          price,
          timeRemaining
        });
      } else {
        console.log(`❌ Subasta descartada: Sin título o enlace`);
      }
      
      console.log('-----------------------------------');
    });
  } else {
    console.log('❌ No se encontró el div "search-result-listings"');
    
    // Lógica de extracción 2: Buscar directamente las tarjetas de listado independientemente del contenedor
    console.log('Método 2: Buscando directamente tarjetas de listado en la página...');
    const listingCards = $('a.listing-card').filter(function() {
      // Solo considerar tarjetas que tengan elementos de subasta activa
      return $(this).find('.bidding-countdown, .bid-formatted, .countdown-text').length > 0;
    });
    
    console.log(`Encontradas ${listingCards.length} tarjetas de subastas con Método 2`);
    
    // Procesar cada tarjeta encontrada
    listingCards.each((index, element) => {
      const $el = $(element);
      
      // Extraer datos de la misma manera que el método 1
      const title = $el.find('h3').text().trim();
      const image = $el.find('.thumbnail img, img').first().attr('src') || '';
      const link = $el.attr('href') || '';
      const description = $el.find('.item-excerpt').text().trim();
      
      let price: number | null = null;
      const bidText = $el.find('.bid-formatted, [class*="bid"]').text().trim();
      
      if (bidText) {
        const priceMatch = bidText.match(/USD\s+\$(\d{1,3}(,\d{3})*|\d+)/) || 
                           bidText.match(/\$(\d{1,3}(,\d{3})*|\d+)/);
        
        if (priceMatch && priceMatch[1]) {
          price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      const timeRemaining = $el.find('.countdown-text, [class*="countdown"]').text().trim();
      
      if (title && link) {
        console.log(`✅ Método 2: Subasta ACTIVA encontrada: ${title}`);
        listings.push({ 
          title, 
          image: image || 'https://i.imgur.com/U45aNlT.jpg', 
          link, 
          description,
          price,
          timeRemaining
        });
      }
    });
  }

  // Si no encontramos listados, aplicar método 3: búsqueda de código HTML específico
  if (listings.length === 0) {
    console.log('Método 3: Buscando patrones HTML específicos similares al ejemplo...');
    
    // Buscar cualquier elemento que tenga la estructura mínima para ser una subasta activa
    const potentialListingContainers = $('a[href*="/listing/"]').filter(function() {
      // Verificar que tenga al menos un título o algún indicador de precio/tiempo
      return $(this).find('h3, h2, .bid-formatted, .countdown-text, [class*="bid"], [class*="countdown"]').length > 0;
    });
    
    console.log(`Encontrados ${potentialListingContainers.length} contenedores potenciales con Método 3`);
    
    potentialListingContainers.each((index, element) => {
      const $el = $(element);
      
      // Extraer datos con selectores más flexibles
      const title = $el.find('h3, h2, .title, [class*="title"]').first().text().trim();
      const image = $el.find('img').first().attr('src') || '';
      const link = $el.attr('href') || '';
      const description = $el.find('.item-excerpt, .description, [class*="excerpt"], [class*="description"]').first().text().trim();
      
      let price: number | null = null;
      const bidText = $el.find('.bid-formatted, [class*="bid"], [class*="price"]').text().trim();
      
      if (bidText) {
        const priceMatch = bidText.match(/USD\s+\$(\d{1,3}(,\d{3})*|\d+)/) || 
                         bidText.match(/\$(\d{1,3}(,\d{3})*|\d+)/);
        
        if (priceMatch && priceMatch[1]) {
          price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      const timeRemaining = $el.find('.countdown-text, [class*="countdown"], [class*="timer"]').text().trim();
      
      if (title && link) {
        console.log(`✅ Método 3: Posible subasta encontrada: ${title}`);
        listings.push({ 
          title, 
          image: image || 'https://i.imgur.com/U45aNlT.jpg', 
          link, 
          description,
          price,
          timeRemaining
        });
      }
    });
  }
  
  // Si todavía no tenemos resultados, intentar un enfoque basado en el HTML de ejemplo
  if (listings.length === 0) {
    console.log('Método 4: Utilizando exactamente el formato del HTML proporcionado como ejemplo...');
    
    // Buscar cualquier elemento que contenga una estructura similar a la del ejemplo HTML
    const htmlExample = `
      <a class="listing-card bg-white-transparent" href="https://bringatrailer.com/listing/1967-ford-mustang-29-2/">
        <div class="thumbnail">
          <img src="https://bringatrailer.com/wp-content/uploads/2025/04/1967_ford_mustang-gt_img_0625-39159.jpg">
        </div>
        <div class="content">
          <div class="content-main">
            <h3>23-Years-Owned, 417 FE-Powered 1967 Ford Mustang Fastback 5-Speed</h3>
            <div class="item-excerpt">This 1967 Ford Mustang was built as a 289 fastback...</div>
          </div>
          <div class="content-secondary">
            <div class="item-bidding">
              <span class="bidding-bid">
                <span class="bid-formatted bold">USD $25,000</span>
              </span>
              <span class="bidding-countdown">
                <span class="countdown-text">4 days</span>
              </span>
            </div>
          </div>
        </div>
      </a>
    `;
    
    // Crear un objeto cheerio con el HTML de ejemplo para extracción de selectores
    const $example = cheerio.load(htmlExample);
    const selectors = {
      card: 'a.listing-card',
      title: 'h3',
      image: '.thumbnail img',
      excerpt: '.item-excerpt',
      bidFormatted: '.bid-formatted',
      countdown: '.countdown-text'
    };
    
    // Usar los selectores del ejemplo para encontrar elementos similares
    let cardElements = $(selectors.card);
    if (cardElements.length === 0) {
      // Si no encontramos tarjetas, buscar cualquier enlace a un listado
      cardElements = $('a[href*="/listing/"]');
    }
    
    console.log(`Encontradas ${cardElements.length} tarjetas usando los selectores del ejemplo HTML`);
    
    cardElements.each((index, card) => {
      const $card = $(card);
      const title = $card.find(selectors.title).text().trim();
      const image = $card.find(selectors.image).attr('src') || '';
      const link = $card.attr('href') || '';
      const description = $card.find(selectors.excerpt).text().trim();
      
      let price: number | null = null;
      const bidText = $card.find(selectors.bidFormatted).text().trim();
      
      if (bidText) {
        const priceMatch = bidText.match(/USD\s+\$(\d{1,3}(,\d{3})*|\d+)/) || 
                         bidText.match(/\$(\d{1,3}(,\d{3})*|\d+)/);
        
        if (priceMatch && priceMatch[1]) {
          price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      const timeRemaining = $card.find(selectors.countdown).text().trim();
      
      if (title && link && link.includes('/listing/')) {
        console.log(`✅ Método 4: Subasta encontrada usando selectores del ejemplo: ${title}`);
        listings.push({ 
          title, 
          image: image || 'https://i.imgur.com/U45aNlT.jpg', 
          link, 
          description,
          price,
          timeRemaining
        });
      }
    });
  }

  console.log(`Total de ${listings.length} subastas encontradas con todos los métodos.`);
  return listings;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  // El título debe contener la marca
  if (!titleLower.includes(makeLower)) {
    return false;
  }

  // Si el modelo está especificado, el título debe contenerlo
  // Algunos modelos pueden estar abreviados o escritos de manera diferente
  if (modelLower && modelLower !== 'any') {
    // Lista de variaciones comunes de modelos
    const modelVariations = [
      modelLower,
      modelLower.replace(/\s+/g, ''), // Sin espacios
      ...modelLower.split(/\s+/) // Palabras individuales
    ];

    // El título debe contener al menos una variación del modelo
    if (!modelVariations.some(v => titleLower.includes(v))) {
      return false;
    }
  }

  // Si el año está especificado, el título debe contenerlo
  if (year && !titleLower.includes(year.toLowerCase())) {
    return false;
  }

  return true;
}