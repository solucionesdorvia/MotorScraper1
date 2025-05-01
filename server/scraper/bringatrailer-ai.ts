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
      // Utilizaremos una estrategia más robusta: analizar tanto secciones específicas como generales
      
      // Primero, intentamos extraer la sección "Live Listings" si existe
      const liveListingsSection = extractLiveListingsSection(html);
      console.log(`¿Se encontró sección Live Listings?: ${liveListingsSection.length > 0} (${liveListingsSection.length} caracteres)`);
      
      // Luego, la sección general de resultados
      const resultsSection = extractResultsSection(html);
      console.log(`¿Se encontró sección de resultados?: ${resultsSection.length > 0} (${resultsSection.length} caracteres)`);
      
      // Combinar resultados de ambas secciones
      // 1. Siempre procesamos primero la seccion de "Live Listings" si existe
      if (liveListingsSection.length > 0) {
        const liveVehicles = await extractVehiclesWithAI(liveListingsSection, make, model, year);
        vehicles = [...vehicles, ...liveVehicles];
        console.log(`Encontrados ${liveVehicles.length} vehículos en la sección Live Listings`);
      }
      
      // 2. Procesamos también la sección general de resultados
      if (resultsSection.length > 0) {
        const resultsVehicles = await extractVehiclesWithAI(resultsSection, make, model, year);
        vehicles = [...vehicles, ...resultsVehicles];
        console.log(`Encontrados ${resultsVehicles.length} vehículos en la sección de resultados`);
      }
      
      // 3. Si ningún método anterior funcionó, usamos parte del HTML completo
      if (vehicles.length === 0) {
        console.log('Intentando con una porción grande del HTML completo...');
        // Tomamos una porción más grande para no perder información importante
        const partialHtml = html.substring(0, Math.min(html.length, 25000)); // Ampliamos a 25K caracteres
        const extractedVehicles = await extractVehiclesWithAI(partialHtml, make, model, year);
        vehicles = [...vehicles, ...extractedVehicles];
        console.log(`Encontrados ${extractedVehicles.length} vehículos en el análisis de HTML completo`);
      }
    } catch (error) {
      console.error('Error al procesar HTML con OpenAI:', error);
    }
    
    // Filtramos vehículos obviamente finalizados, pero somos más permisivos
    console.log(`Filtrando ${vehicles.length} vehículos encontrados por OpenAI`);
    
    const activeVehicles = vehicles.filter(v => {
      // Lo único que rechazamos explicitamente son subastas marcadas como finalizadas
      if (v.endsIn) {
        const endsInLower = v.endsIn.toLowerCase();
        
        // Rechazar solo si está explícitamente marcado como terminado
        if (endsInLower.includes('ended') || 
            endsInLower.includes('sold') ||
            endsInLower.includes('complete') ||
            endsInLower.includes('finalizada') ||
            endsInLower.includes('terminada')) {
          console.log(`OpenAI - Rechazando subasta finalizada: ${v.title}`);
          return false;
        }
        
        // Verificar indicadores positivos de actividad
        const hasTimeIndicators = (
          endsInLower.includes('day') ||
          endsInLower.includes('hour') ||
          endsInLower.includes('min') ||
          endsInLower.includes('second') ||
          endsInLower.includes('seconds') ||
          endsInLower.includes(':') ||
          endsInLower.includes('ending soon') ||
          endsInLower.includes('en curso') ||
          /\d+[dhms]/.test(endsInLower) // Formato como "5d" o "2h"
        );
        
        if (hasTimeIndicators) {
          console.log(`OpenAI - Aceptando subasta activa con tiempo: ${v.title} - ${v.endsIn}`);
          return true;
        }
      }
      
      // Si tiene precio y no ha sido rechazado explicitamente, lo incluimos
      // como potencialmente activo (enfoque más permisivo)
      if (v.price && v.price > 0) {
        console.log(`OpenAI - Aceptando listing con precio: ${v.title} - ${v.price}`);
        return true;
      }
      
      // Si no hay ni precio ni tiempo, lo rechazamos
      return false;
    });
    
    console.log(`Total vehículos BaT: ${vehicles.length} (${activeVehicles.length} activos)`);
    return activeVehicles;
  } catch (error) {
    console.error('Error en scraper BaT con AI:', error);
    return [];
  }
}

/**
 * Extrae solo la sección "Live Listings" del HTML
 */
function extractLiveListingsSection(html: string): string {
  try {
    // Buscar encabezado "Live Listings"
    const liveListingsH2Index = html.indexOf('Live Listings');
    if (liveListingsH2Index === -1) {
      return '';
    }
    
    // Buscar div contenedor de Live Listings
    // El patrón típico es un div con clase "search-result-live-listings"
    const liveListingsDiv = '<div class="search-result-live-listings"';
    const liveDivIndex = html.indexOf(liveListingsDiv);
    
    if (liveDivIndex !== -1) {
      // Encontrar cierre del div para obtener toda la sección
      let openTags = 1;
      let currentPos = liveDivIndex + liveListingsDiv.length;
      
      while (openTags > 0 && currentPos < html.length) {
        const nextOpenTag = html.indexOf('<div', currentPos);
        const nextCloseTag = html.indexOf('</div>', currentPos);
        
        if (nextCloseTag === -1) break;
        
        if (nextOpenTag !== -1 && nextOpenTag < nextCloseTag) {
          openTags++;
          currentPos = nextOpenTag + 4;
        } else {
          openTags--;
          currentPos = nextCloseTag + 6;
          if (openTags === 0) {
            // Capturar la sección completa
            return html.substring(liveDivIndex, currentPos);
          }
        }
      }
    }
    
    // Segundo intento: buscar contenedor general que incluya "Live Listings"
    const h2Tag = '<h2';
    let h2StartIndex = -1;
    let h2EndIndex = -1;
    
    // Buscar h2 que contenga "Live Listings"
    let tempPos = 0;
    while (tempPos < html.length) {
      const h2Start = html.indexOf(h2Tag, tempPos);
      if (h2Start === -1) break;
      
      const h2End = html.indexOf('</h2>', h2Start);
      if (h2End === -1) break;
      
      const h2Content = html.substring(h2Start, h2End + 5);
      if (h2Content.includes('Live Listings')) {
        h2StartIndex = h2Start;
        h2EndIndex = h2End;
        break;
      }
      
      tempPos = h2End + 5;
    }
    
    if (h2StartIndex !== -1) {
      // Encontrar div padre de este h2
      const divStartBeforeH2 = html.lastIndexOf('<div', h2StartIndex);
      if (divStartBeforeH2 !== -1) {
        // Encontrar grid que sigue al título
        const gridStart = html.indexOf('<div class="grid', h2EndIndex);
        if (gridStart !== -1) {
          const gridEnd = html.indexOf('</div>', gridStart + 100);
          if (gridEnd !== -1) {
            // Devolver la sección desde el título hasta el final del grid
            return html.substring(divStartBeforeH2, gridEnd + 6);
          }
        }
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error al extraer sección Live Listings:', error);
    return '';
  }
}

/**
 * Extrae la sección de resultados del HTML
 */
function extractResultsSection(html: string): string {
  try {
    // Primero intentamos encontrar "Live Listings" por su texto específico
    const liveListingsTextIndex = html.indexOf('Live Listings');
    if (liveListingsTextIndex !== -1) {
      console.log('Encontrado texto "Live Listings" en el HTML');
      
      // Buscar el div que contiene este texto hacia atrás
      const divStartBeforeText = html.lastIndexOf('<div', liveListingsTextIndex);
      if (divStartBeforeText !== -1) {
        // Encontrar el div padre que contiene toda la sección
        const containerStartIndex = html.lastIndexOf('<div', divStartBeforeText - 10);
        if (containerStartIndex !== -1) {
          // Buscar varios divs de cierre para capturar la sección completa
          let depth = 0;
          let currentPos = containerStartIndex;
          let foundOpeningDiv = false;
          
          // Contar apertura y cierre de divs para encontrar el cierre correcto
          while (currentPos < html.length) {
            const openingTag = html.indexOf('<div', currentPos + 1);
            const closingTag = html.indexOf('</div>', currentPos + 1);
            
            if (closingTag === -1) break;
            
            if (openingTag !== -1 && openingTag < closingTag) {
              depth++;
              currentPos = openingTag;
              foundOpeningDiv = true;
            } else {
              if (foundOpeningDiv) depth--;
              currentPos = closingTag;
              if (depth < 0) {
                // Encontramos el cierre del div contenedor
                return html.substring(containerStartIndex, closingTag + 6);
              }
            }
          }
        }
      }
    }
    
    // Si no podemos extraer mediante el método anterior, usar el método original
    const liveListingsStart = html.indexOf('<div class="search-result-live-listings"');
    const listingsStart = html.indexOf('<div class="search-result-listings"');
    
    // Si encontramos alguna de las secciones
    if (liveListingsStart !== -1) {
      console.log('Encontrada sección "search-result-live-listings"');
      // Encontrar el final de esta sección
      const endIndex = html.indexOf('</div>', liveListingsStart + 100);
      if (endIndex !== -1) {
        return html.substring(liveListingsStart, endIndex + 6);
      }
    } else if (listingsStart !== -1) {
      console.log('Encontrada sección "search-result-listings"');
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
    Analiza este HTML de Bring a Trailer y extrae SOLO los listados de vehículos con subastas ACTIVAS.
    
    REQUISITO CRÍTICO: SOLO QUIERO SUBASTAS ACTIVAS/EN VIVO/ONGOING. 
    NO EXTRAIGAS listados que digan "SOLD" o listados terminados sin indicación de tiempo restante.
    
    Parámetros de búsqueda:
    - Marca: ${make}
    - Modelo: ${model}
    ${year ? `- Año: ${year}` : ''}
    
    Busca listados en secciones como:
    1. "Live Listings" o "Current Auctions" - estas son las más importantes
    2. Elementos con clase "search-result-live-listings"
    3. Elementos que contengan barras de progreso o contadores de tiempo
    
    Para cada vehículo relevante, extrae:
    1. Título del vehículo - debe contener el modelo "${model}" y el año "${year || ''}" si se especifica
    2. URL del listado (href del enlace)
    3. URL de la imagen (atributo src de la imagen dentro del listado)
    4. Precio actual de la oferta (número entero sin símbolos)
    5. Tiempo restante (texto indicando cuánto queda para terminar la subasta)
    
    ESTOS SON INDICADORES DE SUBASTA ACTIVA:
    - Texto como "X days left", "X hours left", "ending soon", "ending in"
    - Barras de progreso (elementos <progress>)
    - Contadores de tiempo (spans o divs con clases que contengan "countdown")
    
    Es muy importante que extraigas la URL correcta para cada listado y la URL de la imagen.
    
    Devuelve los resultados en formato JSON como un array de objetos con las propiedades:
    "title", "sourceUrl", "imageUrl", "price" (número entero), "endsIn" (string).
    
    Si no encuentras vehículos relevantes ACTIVOS, devuelve un array vacío.
    
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
  const search = year ? `${terms} ${year}` : terms;
  // Usamos el parámetro view=all para obtener todos los resultados y no solo los destacados
  return `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`;
}
