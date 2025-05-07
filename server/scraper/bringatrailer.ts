/**
 * Scraper unificado para Bring a Trailer
 * Extrae subastas activas de https://bringatrailer.com/auctions/
 * Utiliza un navegador real (Puppeteer) para acceder al sitio
 */
import { type InsertVehicle } from "@shared/schema";
import { scrapeBringATrailerRealTime } from "./bringatrailer-puppeteer";

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
    
    // Utilizar el scraper con navegación real
    const results = await scrapeBringATrailerRealTime(make, model, year);
    
    if (results.length > 0) {
      console.log(`✅ Éxito: Se encontraron ${results.length} subastas activas en BringATrailer`);
      
      // Mostrar detalles de los resultados
      results.forEach((vehicle, index) => {
        console.log(`📌 Vehículo ${index + 1}: ${vehicle.title}`);
        console.log(`   Precio: $${vehicle.price || 'N/A'} | Finaliza en: ${vehicle.endsIn || 'N/A'}`);
      });
    } else {
      console.log(`ℹ️ No se encontraron subastas activas en BringATrailer para: ${make} ${model} ${year || ''}`);
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error al extraer datos de BringATrailer:`, error);
    return [];
  }
}