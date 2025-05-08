/**
 * Scraper en tiempo real para Bring a Trailer
 * Extrae subastas activas de https://bringatrailer.com/auctions/ en tiempo real
 * 
 * IMPORTANTE: 
 * Este scraper siempre realiza una solicitud en vivo a BringATrailer.com para extraer
 * los datos más recientes en el momento exacto de la búsqueda. Los datos nunca son
 * pregenerados o almacenados en caché.
 * 
 * Se utilizan múltiples métodos de scraping para maximizar la posibilidad de éxito:
 * 1. Navegación real con Puppeteer (preferido)
 * 2. Navegación real con Playwright (alternativa 1)
 * 3. Navegación real con API externa (alternativa 2)
 * 4. Extracción directa HTML/HTTP (último recurso)
 */
import { type InsertVehicle } from "@shared/schema";
import { scrapeBringATrailerRealTime } from "./bringatrailer-puppeteer";
import { scrapeBringATrailerWithPlaywright } from "./bringatrailer-playwright";
import { scrapeBringATrailerWithBrowserlessAPI } from "./bringatrailer-browserless";
import { scrapeBringATrailerDirect } from "./bringatrailer-direct";

/**
 * Extrae subastas activas de Bring a Trailer en tiempo real
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`🚀 Iniciando extracción de datos en tiempo real de BringATrailer para: ${make} ${model} ${year || ''}`);
    
    // 1. Intentar primero con Puppeteer
    try {
      console.log(`🔍 Intentando con Puppeteer (Chrome)...`);
      const puppeteerResults = await scrapeBringATrailerRealTime(make, model, year);
      
      if (puppeteerResults.length > 0) {
        console.log(`✅ Éxito con Puppeteer: Se encontraron ${puppeteerResults.length} subastas activas en BringATrailer`);
        
        // Mostrar detalles de los resultados
        puppeteerResults.forEach((vehicle, index) => {
          console.log(`📌 Vehículo ${index + 1}: ${vehicle.title}`);
          console.log(`   Precio: $${vehicle.price || 'N/A'} | Finaliza en: ${vehicle.endsIn || 'N/A'}`);
        });
        
        return puppeteerResults;
      }
    } catch (error) {
      const puppeteerError = error as Error;
      console.log(`⚠️ Puppeteer no disponible: ${puppeteerError.message}`);
    }
    
    // 2. Intentar con Playwright
    try {
      console.log(`🔍 Intentando con Playwright...`);
      const playwrightResults = await scrapeBringATrailerWithPlaywright(make, model, year);
      
      if (playwrightResults.length > 0) {
        console.log(`✅ Éxito con Playwright: Se encontraron ${playwrightResults.length} subastas activas en BringATrailer`);
        
        // Mostrar detalles de los resultados
        playwrightResults.forEach((vehicle, index) => {
          console.log(`📌 Vehículo ${index + 1}: ${vehicle.title}`);
          console.log(`   Precio: $${vehicle.price || 'N/A'} | Finaliza en: ${vehicle.endsIn || 'N/A'}`);
        });
        
        return playwrightResults;
      }
    } catch (error) {
      const playwrightError = error as Error;
      console.log(`⚠️ Playwright no disponible: ${playwrightError.message}`);
    }
    
    // 3. Intentar con API de navegación externa (si está configurada)
    if (process.env.BROWSERLESS_API_KEY) {
      try {
        console.log(`🔍 Intentando con API de navegación externa...`);
        const browserlessResults = await scrapeBringATrailerWithBrowserlessAPI(make, model, year);
        
        if (browserlessResults.length > 0) {
          console.log(`✅ Éxito con API externa: Se encontraron ${browserlessResults.length} subastas activas en BringATrailer`);
          
          // Mostrar detalles de los resultados
          browserlessResults.forEach((vehicle, index) => {
            console.log(`📌 Vehículo ${index + 1}: ${vehicle.title}`);
            console.log(`   Precio: $${vehicle.price || 'N/A'} | Finaliza en: ${vehicle.endsIn || 'N/A'}`);
          });
          
          return browserlessResults;
        }
      } catch (error) {
        const browserlessError = error as Error;
        console.log(`⚠️ API externa no disponible: ${browserlessError.message}`);
      }
    } else {
      console.log(`ℹ️ No hay API key para navegación externa configurada.`);
    }
    
    // 4. Como último recurso, intentar con extracción HTTP directa
    console.log(`🔍 Intentando extracción HTTP directa (último recurso)...`);
    console.log(`⚠️ ADVERTENCIA: Este método no ejecuta JavaScript, por lo que Knockout.js no generará el contenido dinámico.`);
    const directResults = await scrapeBringATrailerDirect(make, model, year);
    
    if (directResults.length > 0) {
      console.log(`✅ Éxito con HTTP directo: Se encontraron ${directResults.length} subastas activas en BringATrailer`);
      
      // Mostrar detalles de los resultados
      directResults.forEach((vehicle, index) => {
        console.log(`📌 Vehículo ${index + 1}: ${vehicle.title}`);
        console.log(`   Precio: $${vehicle.price || 'N/A'} | Finaliza en: ${vehicle.endsIn || 'N/A'}`);
      });
      
      return directResults;
    }
    
    console.log(`ℹ️ No se encontraron subastas activas en BringATrailer para: ${make} ${model} ${year || ''}`);
    return [];
  } catch (error) {
    console.error(`❌ Error al extraer datos de BringATrailer:`, error);
    return [];
  }
}