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
    const listings = extractListings(html);

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
 * Extrae los listados de Bring a Trailer desde el HTML enfocándose en las subastas en vivo
 * dentro del div "search-result-listings" específicamente
 */
function extractListings(html: string): BaTListing[] {
  const $ = cheerio.load(html);
  const listings: BaTListing[] = [];

  console.log('Buscando subastas ACTIVAS en el div "search-result-listings"...');
  
  // Buscar específicamente el div search-result-listings que contiene las subastas activas
  const searchResultListings = $('#search-result-listings');
  
  if (searchResultListings.length === 0) {
    console.log('❌ No se encontró el div "search-result-listings" que contiene las subastas activas');
    return listings;
  }
  
  console.log('✅ Encontrado el div "search-result-listings"');
  
  // Buscar todas las tarjetas de listado dentro de search-result-listings
  const liveListingsCards = searchResultListings.find('a.listing-card');
  console.log(`Encontradas ${liveListingsCards.length} tarjetas de subastas ACTIVAS`);
  
  // Procesar cada tarjeta de subasta activa
  liveListingsCards.each((index, element) => {
    const $el = $(element);
    
    // Extraer el título
    const title = $el.find('h3').text().trim();
    
    // Extraer la imagen
    const image = $el.find('.thumbnail img').attr('src') || '';
    
    // Obtener el enlace completo
    const link = $el.attr('href') || '';
    
    // Buscar descripción
    const description = $el.find('.item-excerpt').text().trim();
    
    // Extraer precio/oferta actual
    let price: number | null = null;
    const bidText = $el.find('.bid-formatted').text().trim();
    
    if (bidText) {
      // Intentar extraer precio con formato "USD $XX,XXX"
      const priceMatch = bidText.match(/USD\s+\$(\d{1,3}(,\d{3})*|\d+)/) || 
                         bidText.match(/\$(\d{1,3}(,\d{3})*|\d+)/);
      
      if (priceMatch && priceMatch[1]) {
        price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        console.log(`Precio extraído: $${price}`);
      }
    }
    
    // Extraer tiempo restante
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