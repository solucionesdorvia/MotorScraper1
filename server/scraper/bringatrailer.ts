/**
 * Scraper en tiempo real para Bring a Trailer
 * Extrae subastas activas de https://bringatrailer.com/auctions/ en tiempo real
 * 
 * IMPORTANTE: 
 * Este scraper siempre realiza una solicitud en vivo a BringATrailer.com para extraer
 * los datos más recientes en el momento exacto de la búsqueda. Los datos nunca son
 * pregenerados o almacenados en caché.
 */
import { type InsertVehicle } from "@shared/schema";
import { scrapeBringATrailerRealTime } from "./bringatrailer-puppeteer";
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
    
    // Intentar primero con el método de navegación real
    try {
      const puppeteerResults = await scrapeBringATrailerRealTime(make, model, year);
      
      if (puppeteerResults.length > 0) {
        console.log(`✅ Éxito con navegación real: Se encontraron ${puppeteerResults.length} subastas activas en BringATrailer`);
        
        // Mostrar detalles de los resultados
        puppeteerResults.forEach((vehicle, index) => {
          console.log(`📌 Vehículo ${index + 1}: ${vehicle.title}`);
          console.log(`   Precio: $${vehicle.price || 'N/A'} | Finaliza en: ${vehicle.endsIn || 'N/A'}`);
        });
        
        return puppeteerResults;
      }
    } catch (puppeteerError) {
      console.log(`⚠️ Navegación real no disponible, usando método HTTP directo...`);
      // Continuar con el siguiente método
    }
    
    // Usar el método HTTP directo
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