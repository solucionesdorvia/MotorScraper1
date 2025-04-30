import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

/**
 * Scraper para Bring a Trailer - sitio premium de subastas para vehículos de colección
 */
export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    // Construye la URL de búsqueda para Bring a Trailer
    const searchUrl = buildBringATrailerUrl(make, model, year);
    
    // Realiza la petición HTTP para obtener el HTML
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    
    // Extrae los vehículos del HTML utilizando Cheerio
    return extractVehicleListings(response.data, make, model, year);
  } catch (error) {
    console.error(`Error al obtener datos de Bring a Trailer:`, error);
    // Fallback a la generación de datos de ejemplo (solo para desarrollo)
    return [];
  }
}

/**
 * Extrae listados de vehículos del HTML de Bring a Trailer
 */
function extractVehicleListings(
  html: string,
  make: string,
  model: string,
  year?: string
): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = cheerio.load(html);
  
  // Selecciona los elementos que contienen listados de vehículos
  // Usamos la clase 'listing-card' que identificamos en el HTML
  $('.listing-card').each((index, element) => {
    try {
      // Extrae datos clave
      const title = $(element).find('h3').text().trim();
      
      // Solo procesa si el título es relevante para la búsqueda
      if (isRelevantListing(title, make, model, year)) {
        const sourceUrl = $(element).attr('href') || '';
        const imageUrl = $(element).find('.thumbnail img').attr('src') || '';
        
        // Extrae información de la subasta (precio actual y tiempo restante)
        const currentBidText = $(element).find('.bid-formatted').text().trim();
        const currentBid = extractPrice(currentBidText);
        
        const endsInText = $(element).find('.countdown-text').text().trim();
        const endsIn = endsInText || null;
        
        // Extrae el año del título si está disponible
        const extractedYear = extractYear(title);
        
        // Crea el objeto del vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl,
          imageUrl,
          year: extractedYear,
          price: currentBid || null, // Usamos el precio actual como precio si está disponible
          isAuction: true,
          currentBid: currentBid,
          endsIn: endsIn,
        };
        
        vehicles.push(vehicle);
      }
    } catch (error) {
      console.error('Error al procesar un listado de Bring a Trailer:', error);
    }
  });
  
  return vehicles;
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildBringATrailerUrl(make: string, model: string, year?: string): string {
  // Base URL para búsquedas en Bring a Trailer
  const baseUrl = 'https://bringatrailer.com/search/';
  
  // Construye los parámetros de búsqueda
  let searchTerms = `${make} ${model}`;
  if (year) {
    searchTerms = `${year} ${searchTerms}`;
  }
  
  // Codifica los parámetros para la URL
  const encodedSearch = encodeURIComponent(searchTerms);
  return `${baseUrl}?s=${encodedSearch}`;
}

/**
 * Comprueba si un listado es relevante para los criterios de búsqueda
 */
function isRelevantListing(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Debe contener la marca
  const hasMake = titleLower.includes(makeLower);
  if (!hasMake) return false;
  
  // Debe contener el modelo (o ser suficientemente similar)
  const hasModel = titleLower.includes(modelLower);
  if (!hasModel) return false;
  
  // Si se especificó un año, debe contenerlo
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
  
  // Extrae dígitos y comas, ignora el símbolo de dólar y otros caracteres
  const priceMatch = text.match(/\$([\d,]+)/i);
  if (priceMatch && priceMatch[1]) {
    // Elimina comas y convierte a número
    return parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }
  
  return null;
}

/**
 * Extrae el año del texto del título
 */
function extractYear(text: string): number | null {
  if (!text) return null;
  
  // Busca números de 4 dígitos que podrían ser años (1900-2099)
  const yearMatch = text.match(/(19\d{2}|20\d{2})/);
  if (yearMatch && yearMatch[0]) {
    const year = parseInt(yearMatch[0], 10);
    // Verifica que sea un año razonable para un auto clásico
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return year;
    }
  }
  
  return null;
}
