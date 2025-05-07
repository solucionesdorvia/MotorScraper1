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
}

/**
 * Extrae todas las subastas activas de Bring a Trailer usando un enfoque simplificado
 * que se centra en las tarjetas de listados visibles
 */
export async function scrapeBringATrailerSimple(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  const query = year ? `${make} ${model} ${year}` : `${make} ${model}`;
  const searchUrl = `https://bringatrailer.com/search/?s=${encodeURIComponent(query)}`;
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  try {
    console.log(`Consultando URL simplificada: ${searchUrl}`);
    const { data: html } = await axios.get(searchUrl, { headers });
    const listings = extractListings(html);

    console.log(`Encontrados ${listings.length} listados en la versión simplificada`);

    // Convertir los listados de BaT a formato InsertVehicle
    const vehicles: InsertVehicle[] = listings
      .filter(listing => isRelevant(listing.title, make, model, year))
      .map(listing => {
        // Extraer año del título
        const yearMatch = listing.title.match(/(19\d{2}|20\d{2})/);
        const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);

        // Extraer precio/oferta si está disponible en la descripción
        const priceMatch = listing.description.match(/\$(\d+,\d+|\d+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null;

        return {
          title: listing.title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: listing.link.startsWith('http') ? listing.link : `https://bringatrailer.com${listing.link}`,
          imageUrl: listing.image,
          year: extractedYear,
          price,
          isAuction: true,
          currentBid: price,
          endsIn: 'En curso', // Todas las subastas mostradas en BaT están activas
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

    console.log(`Convertidos ${vehicles.length} vehículos relevantes de ${listings.length} listados`);
    return vehicles;
  } catch (error) {
    console.error('Error scraping Bring a Trailer (simple):', error);
    return [];
  }
}

/**
 * Extrae los listados de Bring a Trailer desde el HTML usando selectores directos
 */
function extractListings(html: string): BaTListing[] {
  const $ = cheerio.load(html);
  const listings: BaTListing[] = [];

  // Intentar varios selectores para encontrar tarjetas de listado
  console.log('Buscando tarjetas de listado con múltiples selectores...');
  
  // Selector 1: Buscar directamente tarjetas de listado
  const listingCards = $('a.listing-card, .search-result-grid-item, a[href*="/listing/"], a[href*="/auctions/"]');
  console.log(`Encontradas ${listingCards.length} tarjetas con selector principal`);
  
  // Selector 2: Buscar cualquier enlace que contenga un título
  const titleLinks = $('a').filter(function() {
    return $(this).find('h3').length > 0;
  });
  console.log(`Encontrados ${titleLinks.length} enlaces con títulos`);
  
  // Combinar resultados de ambos selectores
  const allListingElements = [...listingCards.toArray(), ...titleLinks.toArray()].filter(
    (el, index, self) => self.indexOf(el) === index // Eliminar duplicados
  );
  console.log(`Total de ${allListingElements.length} elementos de listado encontrados`);
  
  // Procesar todos los elementos encontrados
  allListingElements.forEach((el, index) => {
    const $el = $(el);
    
    // Debug - Mostrar el HTML del elemento
    console.log(`Elemento ${index + 1}:`);
    console.log(`HTML: ${$el.html()?.substring(0, 150)}...`);
    
    // Intentar extraer el título de varias maneras
    let title = $el.find('h3').text().trim();
    if (!title) {
      console.log(`No se encontró título con h3, buscando con otros selectores...`);
      title = $el.find('h2').text().trim() || 
              $el.find('.title').text().trim() ||
              $el.find('[class*="title"]').text().trim();
    }
    
    // Búsqueda más amplia de imágenes
    const image = $el.find('img').attr('src') || 
                  $el.find('img').attr('data-src') || 
                  $el.find('.listing-image img').attr('src') || '';
    
    // Asegurarse de obtener el enlace completo
    let link = '';
    if ($el.is('a')) {
      link = $el.attr('href') || '';
      console.log(`Elemento es un enlace con href: ${link}`);
    } else {
      link = $el.find('a').attr('href') || '';
      console.log(`Elemento no es un enlace, encontrado href interno: ${link}`);
    }
    
    // Buscar descripción en varios lugares
    const description = $el.find('.item-excerpt, .listing-results, .listing-stats, .listing-bid-status, .bid-price').text().trim();

    console.log(`Título extraído: "${title}"`);
    console.log(`Enlace extraído: "${link}"`);
    console.log(`Imagen extraída: "${image}"`);
    console.log(`Descripción extraída: "${description}"`);
    
    // Si no tenemos título pero tenemos enlace, intentar extraer título del enlace
    if (!title && link) {
      const titleFromLink = link.split('/').filter(part => part.trim() !== '').pop() || '';
      if (titleFromLink) {
        title = titleFromLink.replace(/-/g, ' ').trim();
        console.log(`Título extraído del enlace: "${title}"`);
      }
    }

    if (title && link) {
      console.log(`✅ Tarjeta válida encontrada: ${title} - ${link}`);
      listings.push({ 
        title, 
        image: image || 'https://bringatrailer.com/wp-content/themes/bringatrailer/images/bat-logo.png', 
        link, 
        description 
      });
    } else {
      console.log(`❌ Tarjeta descartada: Título=${!!title}, Link=${!!link}`);
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