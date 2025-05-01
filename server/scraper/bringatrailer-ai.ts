/**
 * Scraper para Bring a Trailer utilizando OpenAI para extraer datos
 */

import OpenAI from 'openai';
import { InsertVehicle } from '../../shared/schema';

// Inicializamos el cliente de OpenAI con la clave API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Scraper para Bring a Trailer utilizando OpenAI
 */
export async function scrapeBringATrailerWithAI(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Iniciando scraping de Bring a Trailer con AI para ${make} ${model} ${year || ''}`);
  
  try {
    // Construye URL para buscar en Bring a Trailer
    const searchUrl = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Obtiene HTML de la página de resultados
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`Error al obtener la página de Bring a Trailer: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`HTML obtenido: ${html.length} caracteres`);
    
    // Utilizamos OpenAI para extraer información de vehículos
    console.log('Analizando HTML con OpenAI...');
    
    // Procesamos el HTML en fragmentos si es muy largo
    let vehicles: InsertVehicle[] = [];
    
    try {
      // Extraer solo la sección de resultados para reducir el tamaño
      const resultsSection = extractResultsSection(html);
      console.log(`Tamaño de la sección de resultados: ${resultsSection.length} caracteres`);
      
      // Si encontramos la sección de resultados
      if (resultsSection.length > 0) {
        const extractedVehicles = await extractVehiclesWithAI(resultsSection, make, model, year);
        vehicles = [...vehicles, ...extractedVehicles];
      } else {
        // Si no podemos extraer la sección, enviamos una parte del HTML completo
        const partialHtml = html.substring(0, Math.min(html.length, 15000)); // Limitamos a 15K caracteres
        const extractedVehicles = await extractVehiclesWithAI(partialHtml, make, model, year);
        vehicles = [...vehicles, ...extractedVehicles];
      }
    } catch (error) {
      console.error('Error al procesar HTML con OpenAI:', error);
    }
    
    // Filtramos solo vehículos con subastas activas
    const activeVehicles = vehicles.filter(v => {
      return v.isAuction === true && 
             v.endsIn !== null && 
             v.endsIn !== undefined &&
             !v.endsIn.toLowerCase().includes('ended') &&
             !v.endsIn.toLowerCase().includes('sold');
    });
    
    console.log(`Total vehículos BaT: ${vehicles.length} (${activeVehicles.length} activos)`);
    return activeVehicles;
  } catch (error) {
    console.error('Error en scraper BaT con AI:', error);
    return [];
  }
}

/**
 * Extrae la sección de resultados del HTML
 */
function extractResultsSection(html: string): string {
  try {
    // Buscar elementos que contengan listados
    const liveListingsStart = html.indexOf('<div class="search-result-live-listings"');
    const listingsStart = html.indexOf('<div class="search-result-listings"');
    
    // Si encontramos alguna de las secciones
    if (liveListingsStart !== -1) {
      // Encontrar el final de esta sección
      const endIndex = html.indexOf('</div>', liveListingsStart + 100);
      if (endIndex !== -1) {
        return html.substring(liveListingsStart, endIndex + 6);
      }
    } else if (listingsStart !== -1) {
      // Encontrar el final de esta sección
      const endIndex = html.indexOf('</div>', listingsStart + 100);
      if (endIndex !== -1) {
        return html.substring(listingsStart, endIndex + 6);
      }
    }
  } catch (error) {
    console.error('Error al extraer sección de resultados:', error);
  }
  
  return '';
}

/**
 * Utiliza OpenAI para extraer vehículos del HTML
 */
async function extractVehiclesWithAI(html: string, make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    // Crear un prompt para OpenAI que extraiga la información de los vehículos
    const prompt = `
    Analiza este HTML de Bring a Trailer y extrae todos los vehículos relevantes con estos criterios:
    - Marca: ${make}
    - Modelo: ${model}
    ${year ? `- Año: ${year}` : ''}
    
    Busca elementos con clase "listing-card" que contienen las subastas.
    Para cada subasta relevante, extrae:
    1. Título del vehículo
    2. URL del listado (href del enlace principal)
    3. URL de la imagen (atributo src de la imagen)
    4. Precio actual de la oferta (número entero sin símbolos)
    5. Tiempo restante (texto indicando cuánto queda para terminar la subasta)
    
    Sólo incluye vehículos cuya subasta esté activa (con tiempo restante).
    Devuelve los resultados en formato JSON como un array de objetos con las propiedades:
    "title", "sourceUrl", "imageUrl", "price" (número entero), "endsIn" (string).
    
    Si no encuentras vehículos relevantes, devuelve un array vacío.
    
    HTML:
    ${html}
    `;
    
    // Realizar la llamada a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // El modelo más reciente de OpenAI
      messages: [
        {
          role: "system",
          content: "Eres un experto en extracción de datos HTML. Extrae información precisa sobre vehículos en subasta de Bring a Trailer."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });
    
    const content = response.choices[0].message.content || '{"vehicles": []}';
    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Error al parsear resultado JSON de OpenAI:', error);
      return [];
    }
    
    const extractedVehicles = result.vehicles || [];
    console.log(`OpenAI extrajo ${extractedVehicles.length} vehículos de Bring a Trailer`);
    
    // Convertir los resultados al formato InsertVehicle
    return extractedVehicles.map((vehicle: any) => {
      // Asegurarse de que las URLs son absolutas
      let sourceUrl = vehicle.sourceUrl || '';
      if (sourceUrl && !sourceUrl.startsWith('http')) {
        sourceUrl = `https://bringatrailer.com${sourceUrl}`;
      }
      
      // Extraer año del título si existe
      const yearMatch = vehicle.title?.match(/(19\d{2}|20\d{2})/);
      const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : null;
      
      return {
        title: vehicle.title || `${make} ${model} ${year || ''}`.trim(),
        make,
        model,
        source: 'bringatrailer',
        sourceUrl,
        imageUrl: vehicle.imageUrl || '',
        year: extractedYear,
        price: typeof vehicle.price === 'number' ? vehicle.price : null,
        isAuction: true,
        currentBid: typeof vehicle.price === 'number' ? vehicle.price : null,
        endsIn: vehicle.endsIn || null,
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
  } catch (error) {
    console.error('Error al extraer vehículos con OpenAI:', error);
    return [];
  }
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildUrl(make: string, model: string, year?: string): string {
  const terms = make === model ? make : `${make} ${model}`;
  const search = year ? `${terms}+${year}` : terms;
  return `https://bringatrailer.com/search/?s=${search.replace(/ /g, '+')}&order=end_date`;
}
