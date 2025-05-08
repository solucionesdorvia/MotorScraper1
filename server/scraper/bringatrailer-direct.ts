/**
 * Scraper directo para Bring a Trailer
 * Este script utiliza peticiones HTTP directas para extraer datos en tiempo real
 * en lugar de usar un navegador completo.
 * 
 * IMPORTANTE: Todos los datos son extraídos en tiempo real con cada consulta.
 */
import { type InsertVehicle } from "@shared/schema";
import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Extrae subastas activas de Bring a Trailer usando peticiones HTTP directas
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailerDirect(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`🔍 Iniciando scraper directo para Bring a Trailer - Búsqueda: ${make} ${model} ${year || ''}`);
    
    // Array para almacenar los vehículos encontrados
    const vehicles: InsertVehicle[] = [];
    
    // Construir URL de búsqueda - IMPORTANTE: BaT requiere "+" como separador en lugar de "%2B"
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${searchQuery}`;
    
    console.log(`📡 Accediendo a URL: ${searchUrl}`);
    
    // Configurar headers para simular un navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Realizar solicitud HTTP con timeout extendido
    const response = await axios.get(searchUrl, {
      headers,
      timeout: 30000
    });
    
    console.log(`✅ Respuesta recibida con status: ${response.status}`);
    
    // Guardar el HTML para análisis
    const htmlContent = response.data;
    
    // Mostrar un pequeño fragmento para depuración
    console.log(`🔍 Fragmento de HTML: ${htmlContent.substring(0, 150)}...`);
    
    // Analizar estructura básica HTML
    if (htmlContent.includes('auctions-current-container')) {
      console.log(`✅ HTML contiene el ID del contenedor de subastas activas`);
    } else {
      console.log(`⚠️ HTML no contiene el ID del contenedor de subastas activas`);
    }
    
    if (htmlContent.includes('listing-card')) {
      console.log(`✅ HTML contiene la clase de tarjetas de listado`);
    } else {
      console.log(`⚠️ HTML no contiene la clase de tarjetas de listado`);
    }
    
    // Crear DOM a partir del HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Verificar estructura del DOM
    console.log(`🔎 DOM creado, verificando estructura...`);
    console.log(`🔎 Título de la página: ${document.title}`);
    
    // Intentar extraer datos de listados desde scripts de Knockout
    console.log(`🔎 Buscando datos en scripts...`);
    const scriptElements = document.querySelectorAll('script');
    let listingsData = null;
    
    // Itera a través de todos los scripts buscando datos de Knockout.js
    for (const script of Array.from(scriptElements)) {
      const content = script.textContent || '';
      if (content.includes('bat.currentListings = ') || content.includes('var viewModel = {')) {
        console.log(`🔍 Encontrado script con posibles datos de listados`);
        
        // Buscar datos de listados en el script
        const matchCurrentListings = content.match(/bat\.currentListings\s*=\s*(\[.*?\]);/s);
        if (matchCurrentListings && matchCurrentListings[1]) {
          try {
            // Intentar parsear los datos JSON encontrados
            listingsData = JSON.parse(matchCurrentListings[1]);
            console.log(`✅ Datos de listados encontrados: ${listingsData.length} subastas en script`);
            
            // Procesar los datos extraídos del script
            if (listingsData && Array.isArray(listingsData) && listingsData.length > 0) {
              console.log(`🔄 Procesando ${listingsData.length} listados desde datos de script`);
              
              // Procesar cada listado encontrado
              for (const item of listingsData) {
                if (item && item.title) {
                  const isItemRelevant = isRelevant(item.title, make, model, year);
                  if (!isItemRelevant) {
                    console.log(`⚠️ Listado no relevante: ${item.title}`);
                    continue;
                  }
                  
                  console.log(`✅ Listado relevante encontrado: ${item.title}`);
                  
                  // Extraer información adicional del título
                  const { extractedYear, transmission, bodyType } = extractInfoFromTitle(item.title);
                  
                  // Crear objeto de vehículo
                  const vehicle: InsertVehicle = {
                    title: item.title,
                    make: make,
                    model: model,
                    price: item.currentBid || null,
                    year: extractedYear || (year ? parseInt(year, 10) : null),
                    mileage: null,
                    transmission: transmission,
                    bodyType: bodyType,
                    color: null,
                    fuelType: null,
                    location: "Estados Unidos",
                    vin: null,
                    dealerName: null,
                    source: "bringatrailer",
                    sourceUrl: item.url ? (item.url.startsWith('http') ? item.url : `https://bringatrailer.com${item.url}`) : "",
                    imageUrl: item.image || item.thumbImage || "",
                    hasDeals: item.noReserve === true,
                    isAuction: true,
                    currentBid: item.currentBid || null,
                    endsIn: item.timeLeft || null
                  };
                  
                  console.log(`✅ Vehículo procesado desde script: ${vehicle.title} (Puja: $${vehicle.price}, Tiempo: ${vehicle.endsIn})`);
                  vehicles.push(vehicle);
                }
              }
              
              // Si hemos encontrado vehículos relevantes, podemos terminar aquí
              if (vehicles.length > 0) {
                console.log(`✅ Procesamiento completado desde script: Encontrados ${vehicles.length} vehículos relevantes`);
                return vehicles;
              } else {
                console.log(`ℹ️ No se encontraron vehículos relevantes en los datos del script, probando método DOM`);
              }
            }
          } catch (e) {
            console.log(`⚠️ Error al parsear datos de listados: ${e.message}`);
          }
        }
      }
    }
    
    // Si no se encontraron datos en los scripts, continuamos con extracción por DOM
    console.log(`🔎 Usando método alternativo: Buscando contenedor de subastas actuales...`);
    
    // Contenedor principal de subastas activas
    let auctionsContainer = document.querySelector('#auctions-current-container');
    
    if (!auctionsContainer) {
      console.log(`⚠️ No se encontró el contenedor de subastas actuales mediante querySelector`);
      
      // Intentar encontrar por ID directamente
      const containerById = document.getElementById('auctions-current-container');
      if (containerById) {
        console.log(`✅ Contenedor encontrado mediante getElementById`);
        // Usar este contenedor en lugar del anterior
        auctionsContainer = containerById;
      } else {
        console.log(`⚠️ No se encontró el contenedor ni siquiera con getElementById`);
        return [];
      }
    } else {
      console.log(`✅ Contenedor encontrado mediante querySelector`);
    }
    
    // Verificar estructura antes de extraer tarjetas
    console.log(`🔎 Estructura HTML del contenedor: ${auctionsContainer?.outerHTML?.substring(0, 200)}...`);
    
    // Extraer tarjetas de listado
    const listingCards = auctionsContainer.querySelectorAll('.listing-card');
    
    if (!listingCards || listingCards.length === 0) {
      console.log(`⚠️ No se encontraron tarjetas de listado`);
      return [];
    }
    
    console.log(`✅ Encontradas ${listingCards.length} tarjetas de listado`);
    
    // Mostrar información detallada de la primera tarjeta
    if (listingCards.length > 0) {
      const firstCard = listingCards[0];
      console.log(`🔍 Primera tarjeta HTML: ${firstCard.outerHTML.substring(0, 200)}...`);
    }
    
    // Procesar cada tarjeta de listado
    for (let i = 0; i < listingCards.length; i++) {
      const card = listingCards[i];
      
      // Extraer título
      const titleElement = card.querySelector('h3');
      const title = titleElement ? titleElement.textContent || "" : "";
      
      let titleValue = title;
      if (!titleValue || titleValue.trim() === "") {
        console.log(`⚠️ No se pudo extraer el título del listado #${i + 1}`);
        console.log(`⚠️ HTML de la tarjeta: ${card.outerHTML.substring(0, 150)}...`);
        
        try {
          // Intentar extraer directamente el texto del atributo alt de la imagen
          const imgElement = card.querySelector('.thumbnail img');
          if (imgElement) {
            const altText = imgElement.getAttribute('alt');
            if (altText && altText.trim() !== "") {
              console.log(`✅ Se extrajo título alternativo: ${altText}`);
              titleValue = altText;
            }
          }
        } catch (e) {
          console.error(`❌ Error al intentar extraer título alternativo: ${e}`);
        }
      }
      
      // Verificar si el título es relevante para la búsqueda
      if (!isRelevant(titleValue, make, model, year)) {
        console.log(`⚠️ Listado no relevante: ${titleValue}`);
        continue;
      }
      
      console.log(`✅ Listado relevante encontrado: ${titleValue}`);
      
      // URL de la subasta
      const href = card.getAttribute('href');
      
      // Imagen
      const imgElement = card.querySelector('.thumbnail img');
      let imageUrl = "";
      if (imgElement) {
        imageUrl = imgElement.getAttribute('src') || "";
      }
      
      // Puja actual
      const bidElement = card.querySelector('.bidding-bid .bid-formatted');
      let currentBid: number | null = null;
      if (bidElement) {
        const bidText = bidElement.textContent || "";
        const bidMatch = bidText.match(/\$([0-9,]+)/);
        if (bidMatch && bidMatch[1]) {
          currentBid = parseInt(bidMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      // Tiempo restante
      const countdownElement = card.querySelector('.bidding-countdown .countdown-text');
      const endsIn = countdownElement ? countdownElement.textContent || null : null;
      
      // Estado "No Reserve"
      const noReserveElement = card.querySelector('.item-tag-noreserve');
      const hasNoReserve = !!noReserveElement;
      
      // Extraer información adicional del título
      const { extractedYear, transmission, bodyType } = extractInfoFromTitle(titleValue);
      
      // Crear objeto de vehículo
      const vehicle: InsertVehicle = {
        title: titleValue,
        make: make,
        model: model,
        price: currentBid,
        year: extractedYear || (year ? parseInt(year, 10) : null),
        mileage: null,
        transmission: transmission,
        bodyType: bodyType,
        color: null,
        fuelType: null,
        location: "Estados Unidos",
        vin: null,
        dealerName: null,
        source: "bringatrailer",
        sourceUrl: href || `https://bringatrailer.com/search/${searchQuery}`,
        imageUrl: imageUrl,
        hasDeals: hasNoReserve,
        isAuction: true,
        currentBid: currentBid,
        endsIn: endsIn
      };
      
      console.log(`✅ Vehículo procesado: ${vehicle.title} (Puja: $${vehicle.price}, Tiempo: ${vehicle.endsIn})`);
      vehicles.push(vehicle);
    }
    
    console.log(`✅ Procesamiento completado: Encontrados ${vehicles.length} vehículos relevantes`);
    return vehicles;
    
  } catch (error) {
    console.error(`❌ Error al extraer datos de Bring a Trailer:`, error);
    return [];
  }
}

/**
 * Determina si un título de subasta es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Verificar marca
  if (!titleLower.includes(makeLower)) {
    return false;
  }
  
  // Verificar modelo con más flexibilidad
  // Para modelos como "911", verificamos que esté presente como palabra completa
  if (modelLower.length <= 3) {
    // Para modelos cortos, buscar como palabra completa
    const modelRegex = new RegExp(`\\b${modelLower}\\b`);
    if (!modelRegex.test(titleLower)) {
      return false;
    }
  } else {
    // Para modelos más largos, es suficiente con que esté incluido
    if (!titleLower.includes(modelLower)) {
      return false;
    }
  }
  
  // Verificar año si se proporciona
  if (year) {
    return titleLower.includes(year);
  }
  
  return true;
}

/**
 * Extrae información adicional del título (año, transmisión, tipo de carrocería)
 */
function extractInfoFromTitle(
  title: string
): { extractedYear: number | null; transmission: string | null; bodyType: string | null } {
  const result = {
    extractedYear: null as number | null,
    transmission: null as string | null,
    bodyType: null as string | null
  };
  
  // Extraer año
  const yearMatch = title.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    result.extractedYear = parseInt(yearMatch[0], 10);
  }
  
  // Extraer tipo de transmisión
  if (title.includes('4-Speed') || title.includes('4-speed') || title.includes('Four-Speed')) {
    result.transmission = 'Manual 4-Velocidades';
  } else if (title.includes('5-Speed') || title.includes('5-speed') || title.includes('Five-Speed')) {
    result.transmission = 'Manual 5-Velocidades';
  } else if (title.includes('6-Speed') || title.includes('6-speed') || title.includes('Six-Speed')) {
    result.transmission = 'Manual 6-Velocidades';
  } else if (title.includes('Manual')) {
    result.transmission = 'Manual';
  } else if (title.includes('Automatic')) {
    result.transmission = 'Automático';
  }
  
  // Extraer tipo de carrocería
  const bodyTypes = [
    { keywords: ['convertible', 'cabriolet', 'roadster', 'spyder', 'spider'], type: 'Convertible' },
    { keywords: ['coupe', 'coupé'], type: 'Coupe' },
    { keywords: ['sedan'], type: 'Sedan' },
    { keywords: ['hatchback'], type: 'Hatchback' },
    { keywords: ['wagon', 'estate', 'avant', 'touring'], type: 'Wagon' },
    { keywords: ['suv', 'crossover'], type: 'SUV' },
    { keywords: ['pickup', 'truck'], type: 'Pickup' },
    { keywords: ['fastback'], type: 'Fastback' },
    { keywords: ['targa'], type: 'Targa' }
  ];
  
  const titleLower = title.toLowerCase();
  for (const body of bodyTypes) {
    for (const keyword of body.keywords) {
      if (titleLower.includes(keyword)) {
        result.bodyType = body.type;
        break;
      }
    }
    if (result.bodyType) break;
  }
  
  return result;
}