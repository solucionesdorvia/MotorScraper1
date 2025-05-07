/**
 * Scraper unificado para Bring a Trailer
 * Extrae subastas activas de https://bringatrailer.com/auctions/
 */

import axios from 'axios';
import { load } from 'cheerio';
import { InsertVehicle } from '@shared/schema';

/**
 * Extrae subastas activas de Bring a Trailer
 * Se enfoca en la sección de auctions, que muestra vehículos con subastas en curso
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    // Construir la URL de búsqueda
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
    
    console.log(`🔍 Buscando subastas activas en Bring a Trailer`);
    console.log(`URL: ${searchUrl}`);
    
    // Realizar la solicitud HTTP con cabeceras para simular un navegador
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000 // 10 segundos de timeout
    });
    
    // Verificar si la respuesta es exitosa
    if (response.status !== 200) {
      console.error(`Error al obtener la página: ${response.status}`);
      return [];
    }
    
    console.log(`✅ HTML obtenido (${response.data.length} bytes)`);
    
    // Cargar el HTML en Cheerio para analizarlo
    const $ = load(response.data);
    
    // Buscar el contenedor principal de auctions
    const auctionsContainer = $('#auctions-current-container');
    
    if (!auctionsContainer.length) {
      console.log('⚠️ No se encontró el contenedor principal de subastas');
      return [];
    }
    
    console.log(`✅ Contenedor de subastas encontrado: ${auctionsContainer.length} elementos`);
    // Depurar la estructura del HTML
    console.log('Estructura del contenedor:', auctionsContainer.html().substring(0, 200) + '...');
    
    // Array para almacenar los vehículos encontrados
    const vehicles: InsertVehicle[] = [];
    
    // Contador para asignar IDs únicos a los vehículos
    let idCounter = 1;
    
    // Buscar todas las tarjetas de listado dentro del contenedor
    const listingCards = auctionsContainer.find('.listing-card');
    console.log(`Encontradas ${listingCards.length} tarjetas de listado`);
    
    // Imprimir el HTML para analizar la estructura
    if (listingCards.length > 0) {
      console.log('HTML de la primera tarjeta:', $(listingCards[0]).html().substring(0, 200) + '...');
    } else {
      console.log('No se encontraron tarjetas de listado');
    }
    
    // Iterar sobre cada tarjeta para extraer la información
    listingCards.each((i, card) => {
      console.log(`Procesando tarjeta #${i+1}:`);
      try {
        console.log('Procesando HTML de la tarjeta:', $(card).html().substring(0, 100));
      
        // La tarjeta es un enlace <a>, así que el href es el atributo del elemento actual
        const url = $(card).attr('href');
        console.log('URL extraída:', url);
        if (!url) {
          console.log('Sin URL, saltando');
          return; // Saltar si no hay URL
        }
        
        // Extraer título del vehículo
        const title = $(card).find('h3').text().trim();
        console.log('Título extraído:', title);
        if (!title) {
          console.log('Sin título, saltando');
          return; // Saltar si no hay título
        }
        
        // Extraer precio actual (puja)
        const bidElement = $(card).find('.bid-formatted');
        console.log('Elemento de puja encontrado:', bidElement.length);
        const bidText = bidElement.text().trim();
        console.log('Texto de puja extraído:', bidText);
        
        let currentBid: number | null = null;
        if (bidText) {
          // Extraer el número del texto del precio (ej: "USD $25,000" -> 25000)
          const priceMatch = bidText.match(/\$\s*([\d,]+)/);
          if (priceMatch && priceMatch[1]) {
            currentBid = parseInt(priceMatch[1].replace(/,/g, ''), 10);
            console.log('Puja actual (número):', currentBid);
          }
        }
        
        // Extraer tiempo restante
        const countdownElement = $(card).find('.countdown-text');
        console.log('Elemento de cuenta regresiva encontrado:', countdownElement.length);
        const timeText = countdownElement.text().trim();
        console.log('Texto de tiempo restante:', timeText);
        
        let endsIn: string | null = null;
        if (timeText) {
          endsIn = timeText;
        }
        
        // Extraer imagen del vehículo
        const imgElement = $(card).find('.thumbnail img');
        console.log('Elemento de imagen encontrado:', imgElement.length);
        const imageUrl = imgElement.attr('src') || null;
        console.log('URL de imagen:', imageUrl);
        
        // Extraer ubicación (siempre es Estados Unidos para BaT)
        const location = "Estados Unidos";
        
        // Determinar si es No Reserve
        const noReserveElement = $(card).find('.item-tag-noreserve');
        console.log('Elemento No Reserve encontrado:', noReserveElement.length);
        const isNoReserve = noReserveElement.length > 0;
        
        // Extraer la descripción
        const excerpt = $(card).find('.item-excerpt').text().trim();
        
        // Analizar el título para obtener información adicional
        const { extractedYear, extractedMake, extractedModel, transmission, bodyType } = 
          extractInfoFromTitle(title, make, model, year);
        
        // Crear el objeto del vehículo
        const vehicle: InsertVehicle = {
          title,
          make: extractedMake || make,
          model: extractedModel || model,
          year: extractedYear,
          price: currentBid || 0,
          transmission,
          bodyType,
          sourceUrl: url,
          imageUrl,
          source: "bringatrailer",
          location,
          mileage: null,
          isAuction: true,
          currentBid,
          endsIn: endsIn || (isNoReserve ? "No Reserve" : null),
          color: null,
          vin: null,
          fuelType: null,
          dealerName: null,
          hasDeals: false
        };
        
        // Verificar si el vehículo es relevante para la búsqueda
        if (isRelevantVehicle(vehicle, make, model, year)) {
          console.log(`✅ Vehículo encontrado: ${title} - Precio: ${currentBid || 'No disponible'} - Tiempo: ${endsIn || 'No disponible'}`);
          vehicles.push(vehicle);
        } else {
          console.log(`⚠️ Vehículo no relevante: ${title}`);
        }
      } catch (error) {
        console.error('Error al procesar tarjeta de listado:', error);
      }
    });
    
    console.log(`Total: ${vehicles.length} vehículos relevantes encontrados`);
    return vehicles;
  } catch (error) {
    console.error('Error al obtener datos de Bring a Trailer:', error);
    return [];
  }
}

/**
 * Extrae información de año, transmisión y tipo de carrocería del título
 */
function extractInfoFromTitle(
  title: string,
  make: string,
  model: string,
  year?: string
): {
  extractedYear: number | null,
  extractedMake: string | null,
  extractedModel: string | null,
  transmission: string | null,
  bodyType: string | null
} {
  // Valores por defecto
  let extractedYear: number | null = null;
  let extractedMake: string | null = null;
  let extractedModel: string | null = null;
  let transmission: string | null = null;
  let bodyType: string | null = null;
  
  // Extraer año
  const yearMatch = title.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch && yearMatch[1]) {
    extractedYear = parseInt(yearMatch[1], 10);
  }
  
  // Extraer marca si está en el título
  const makeRegex = new RegExp(`\\b${make}\\b`, 'i');
  if (makeRegex.test(title)) {
    extractedMake = make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
  }
  
  // Extraer modelo si está en el título
  const modelRegex = new RegExp(`\\b${model}\\b`, 'i');
  if (modelRegex.test(title)) {
    extractedModel = model.charAt(0).toUpperCase() + model.slice(1).toLowerCase();
  }
  
  // Extraer transmisión
  if (title.includes('Manual') || title.includes('Speed') || title.includes('Velocidades')) {
    transmission = 'Manual';
    
    // Buscar número de velocidades
    const speedMatch = title.match(/(\d)[ -]?Speed/i);
    if (speedMatch && speedMatch[1]) {
      transmission = `Manual ${speedMatch[1]}-Velocidades`;
    }
  } else if (title.includes('Automatic')) {
    transmission = 'Automático';
  }
  
  // Extraer tipo de carrocería
  const bodyTypes = [
    { regex: /Fastback/i, value: 'Fastback' },
    { regex: /Coupe/i, value: 'Coupe' },
    { regex: /Convertible/i, value: 'Convertible' },
    { regex: /Sedan/i, value: 'Sedan' },
    { regex: /Hatchback/i, value: 'Hatchback' },
    { regex: /Wagon/i, value: 'Wagon' },
    { regex: /SUV/i, value: 'SUV' },
    { regex: /Roadster/i, value: 'Roadster' },
    { regex: /Pickup/i, value: 'Pickup' }
  ];
  
  for (const type of bodyTypes) {
    if (type.regex.test(title)) {
      bodyType = type.value;
      break;
    }
  }
  
  return {
    extractedYear,
    extractedMake,
    extractedModel,
    transmission,
    bodyType
  };
}

/**
 * Determina si un vehículo es relevante para los criterios de búsqueda
 * Utiliza criterios más flexibles para no perder resultados relevantes
 */
function isRelevantVehicle(
  vehicle: InsertVehicle,
  make: string,
  model: string,
  year?: string
): boolean {
  // Validar que el título contenga la marca y el modelo
  // Usamos una expresión regular insensible a mayúsculas/minúsculas
  const makeRegex = new RegExp(`\\b${make}\\b`, 'i');
  const modelRegex = new RegExp(`\\b${model}\\b`, 'i');
  
  // Debe contener la marca y el modelo en el título
  const hasMakeAndModel = makeRegex.test(vehicle.title) && modelRegex.test(vehicle.title);
  
  // Si se especificó un año, verificar si el vehículo está dentro de un rango de ±3 años
  let yearMatch = true;
  if (year && vehicle.year) {
    const targetYear = parseInt(year, 10);
    const yearDifference = Math.abs(vehicle.year - targetYear);
    yearMatch = yearDifference <= 3;
  }
  
  return hasMakeAndModel && yearMatch;
}