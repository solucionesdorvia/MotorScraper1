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

  // Usar el selector directo proporcionado por el usuario
  $('a.listing-card').each((_, el) => {
    const title = $(el).find('h3').text().trim();
    const image = $(el).find('img').attr('src') || '';
    const link = $(el).attr('href') || '';
    const description = $(el).find('.item-excerpt').text().trim();

    if (title && image && link) {
      listings.push({ title, image, link, description });
    }
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