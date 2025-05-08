/**
 * Scraper para Bring a Trailer usando un servicio de navegación real externo
 * 
 * IMPORTANTE: Este scraper utiliza una API de browser as a service para ejecutar un navegador
 * real en la nube y extraer datos dinámicos que solo están disponibles después de ejecutar
 * JavaScript en el cliente.
 */
import { type InsertVehicle } from "@shared/schema";
import axios from 'axios';

/**
 * Extrae subastas activas de Bring a Trailer en tiempo real usando un servicio externo
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailerWithBrowserlessAPI(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`🔍 Iniciando scraper con navegación real externa para Bring a Trailer - Búsqueda: ${make} ${model} ${year || ''}`);
    
    // Array para almacenar los vehículos encontrados
    const vehicles: InsertVehicle[] = [];
    
    // Construir URL de búsqueda para Bring a Trailer
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
    
    console.log(`📡 Preparando solicitud a browserless.io para: ${searchUrl}`);
    
    // Script para ejecutar en el navegador remoto
    // Este script extraerá los datos de la página después de que se cargue completamente
    const scriptToExecute = `
      // Esperar a que Knockout.js termine de renderizar la página
      const waitForKnockout = async () => {
        // Esperar a que el contenedor tenga listados visibles
        return new Promise(resolve => {
          // Verificar cada 500ms si hay tarjetas visibles
          const checkInterval = setInterval(() => {
            const cards = document.querySelectorAll('.listing-card');
            let visibleCards = 0;
            
            cards.forEach(card => {
              if (window.getComputedStyle(card).display !== 'none') {
                visibleCards++;
              }
            });
            
            if (visibleCards > 0) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 500);
          
          // Timeout después de 15 segundos
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 15000);
        });
      };
      
      // Extraer datos de un listado
      const extractListingData = (card) => {
        // Solo procesar tarjetas visibles (renderizadas por Knockout)
        if (window.getComputedStyle(card).display === 'none') {
          return null;
        }
        
        // Extraer título
        const titleElement = card.querySelector('h3');
        const title = titleElement ? titleElement.textContent.trim() : "";
        
        // Extraer URL
        const href = card.getAttribute('href') || "";
        
        // Extraer imagen
        const imgElement = card.querySelector('.thumbnail img');
        const imageUrl = imgElement ? imgElement.getAttribute('src') : "";
        
        // Extraer puja actual
        const bidElement = card.querySelector('.bidding-bid .bid-formatted');
        let currentBid = null;
        if (bidElement) {
          const bidText = bidElement.textContent;
          const bidMatch = bidText.match(/\\$([0-9,]+)/);
          if (bidMatch && bidMatch[1]) {
            currentBid = parseInt(bidMatch[1].replace(/,/g, ''), 10);
          }
        }
        
        // Extraer tiempo restante
        const countdownElement = card.querySelector('.bidding-countdown .countdown-text');
        const endsIn = countdownElement ? countdownElement.textContent.trim() : null;
        
        // Extraer estado "No Reserve"
        const noReserveElement = card.querySelector('.item-tag-noreserve');
        const hasNoReserve = !!noReserveElement;
        
        return {
          title,
          href,
          imageUrl,
          currentBid,
          endsIn,
          hasNoReserve
        };
      };
      
      // Función principal
      const extractData = async () => {
        await waitForKnockout();
        
        const results = [];
        
        // Obtener el contenedor de listados actuales
        const container = document.querySelector('#auctions-current-container');
        if (!container) {
          return { error: "No se encontró el contenedor de subastas" };
        }
        
        // Obtener todas las tarjetas de listado
        const cards = container.querySelectorAll('.listing-card');
        console.log('Total de tarjetas encontradas:', cards.length);
        
        // Procesar cada tarjeta
        cards.forEach(card => {
          const data = extractListingData(card);
          if (data) {
            results.push(data);
          }
        });
        
        return { 
          results,
          count: results.length,
          pageTitle: document.title,
          url: window.location.href
        };
      };
      
      // Ejecutar la extracción
      return await extractData();
    `;
    
    // Verificar si tenemos una API key para browserless.io
    if (!process.env.BROWSERLESS_API_KEY) {
      console.error(`❌ Error: No se encontró API key para browserless.io`);
      console.log(`⚠️ Se requiere una API key de browserless.io para extraer datos dinámicos de Bring a Trailer`);
      return [];
    }
    
    // URL de la API de browserless.io
    const browserlessUrl = `https://chrome.browserless.io/function?token=${process.env.BROWSERLESS_API_KEY}`;
    
    // Configuración de la solicitud
    const requestBody = {
      code: `module.exports = async ({ page, context }) => {
        // Navegar a la URL
        await page.goto('${searchUrl}', { waitUntil: 'networkidle2' });
        
        // Esperar a que se carguen las tarjetas (máximo 15 segundos)
        await page.waitForSelector('.listing-card', { timeout: 15000 }).catch(() => {});
        
        // Esperar unos segundos adicionales para que Knockout.js renderice todo
        await page.waitForTimeout(5000);
        
        // Ejecutar script para extraer datos
        return await page.evaluate(() => {
          ${scriptToExecute}
          return extractData();
        });
      }`,
      context: {}
    };
    
    // Enviar solicitud a browserless.io
    console.log(`🔭 Ejecutando extracción con navegador real remoto...`);
    const response = await axios.post(browserlessUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos de timeout
    });
    
    // Verificar respuesta
    console.log(`✅ Respuesta recibida de browserless.io con status: ${response.status}`);
    
    // Procesar la respuesta
    const data = response.data;
    
    // Verificar si hay un error
    if (data.error) {
      console.error(`❌ Error en la extracción: ${data.error}`);
      return [];
    }
    
    // Verificar si hay resultados
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      console.log(`ℹ️ No se encontraron resultados en la extracción`);
      return [];
    }
    
    console.log(`✅ Extracción exitosa: ${data.count} listados encontrados`);
    
    // Procesar cada resultado
    for (const item of data.results) {
      // Verificar que el título sea relevante para la búsqueda
      if (!isRelevant(item.title, make, model, year)) {
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
        price: item.currentBid,
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
        sourceUrl: item.href.startsWith('http') ? item.href : `https://bringatrailer.com${item.href}`,
        imageUrl: item.imageUrl,
        hasDeals: item.hasNoReserve,
        isAuction: true,
        currentBid: item.currentBid,
        endsIn: item.endsIn
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