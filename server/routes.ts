import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeEbay } from "./scraper/ebay";
import { scrapeEdmunds } from "./scraper/edmunds";
import { scrapeCars } from "./scraper/cars";
import { scrapeHemmings } from "./scraper/hemmings";
import { scrapeBringATrailer } from "./scraper/bat";
import { scrapeBringATrailerWithAI } from "./scraper/bringatrailer-ai";
import { scrapeBringATrailerFocused } from "./scraper/bat-focused";
import { emergencyScrapeBringATrailer } from "./scraper/bat-emergency";
import { scrapeClassicCars } from "./scraper/classiccars";
import { searchParamsSchema, filterSchema, insertSearchHistorySchema, InsertVehicle } from "@shared/schema";
import { z } from "zod";
import NodeCache from "node-cache";
import { openAIService } from "./services/openai-service";

// Cache for search results (TTL: 5 minutes)
const searchCache = new NodeCache({ stdTTL: 300 });

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for searching vehicles
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      // Parse and validate search parameters
      const searchParamsResult = searchParamsSchema.safeParse(req.query);
      
      if (!searchParamsResult.success) {
        return res.status(400).json({ 
          message: "Invalid search parameters", 
          errors: searchParamsResult.error.errors 
        });
      }
      
      const searchParams = searchParamsResult.data;
      
      // Agregamos logs para depurar
      console.log('Query params recibidos:', req.query);
      console.log('SearchParams procesados:', JSON.stringify(searchParams));
      
      // Parse and validate filter parameters
      const filterParamsResult = filterSchema.safeParse(req.query);
      const filterParams = filterParamsResult.success ? filterParamsResult.data : {};
      
      // Build cache key from query parameters
      const cacheKey = JSON.stringify({ ...req.query });
      
      // Temporarily disable cache to ensure we get fresh results
      /*
      // Check if we have cached results
      const cachedResults = searchCache.get(cacheKey);
      if (cachedResults) {
        return res.json(cachedResults);
      }
      */
      
      // Log search to history
      const timestamp = new Date().toISOString();
      
      // Use query parameter if available, otherwise construct from make, model, and year
      const searchQuery = searchParams.query || 
                         `${searchParams.make || ''} ${searchParams.model || ''} ${searchParams.year || ''}`.trim();
      
      await storage.logSearch({
        query: searchQuery,
        make: searchParams.make,
        model: searchParams.model,
        year: searchParams.year,
        timestamp
      });
      
      // Always fetch new results temporarily to fix the issue with edmunds
      let needFetch = true;
      
      // Get current vehicles from storage
      const storedResults = await storage.getVehicles(searchParams, filterParams);
      
      // No longer checking result count since we always fetch
      console.log(`Found ${storedResults.totalResults} stored results before fetching`)
      
      if (needFetch) {
        // Clear existing vehicles to avoid duplicates
        await storage.clearVehicles();
        
        // Fetch vehicles from sources based on search parameters
        let ebayResults: InsertVehicle[] = [];
        let edmundsResults: InsertVehicle[] = [];
        let carsResults: InsertVehicle[] = [];
        let hemmingsResults: InsertVehicle[] = [];
        let bringATrailerResults: InsertVehicle[] = [];
        let classicCarsResults: InsertVehicle[] = [];
        
        // Extract make and model from query or use direct parameters
        let make = searchParams.make || '';
        let model = searchParams.model || '';
        let year = searchParams.year ? searchParams.year.toString() : undefined;
        
        // Caso especial para Mustang: si 'make' es Mustang, lo cambiamos a Ford y el modelo a Mustang
        if (make.toLowerCase() === 'mustang' && !model) {
          console.log('Caso especial: detectado Mustang como marca, corrigiendo a Ford Mustang');
          model = make; // Mustang pasa a ser el modelo
          make = 'Ford'; // Ford es la marca correcta
        }
        
        // Si tenemos una consulta, usamos OpenAI para mejorarla
        if (searchParams.query && searchParams.query.trim() !== '') {
          try {
            console.log(`Usando OpenAI para mejorar la consulta: ${searchParams.query}`);
            const enhancedQuery = await openAIService.enhanceSearchQuery(searchParams.query);
            console.log(`Consulta original: "${searchParams.query}" → Mejorada: marca="${enhancedQuery.make}", modelo="${enhancedQuery.model}", año="${enhancedQuery.year || 'no especificado'}"`);
            
            // Solo actualizamos los campos si no fueron proporcionados directamente
            if (!make && enhancedQuery.make) make = enhancedQuery.make;
            if (!model && enhancedQuery.model) model = enhancedQuery.model;
            if (!year && enhancedQuery.year) year = enhancedQuery.year;
          } catch (error) {
            console.error('Error al mejorar la consulta con OpenAI:', error);
            // Si falla OpenAI, usamos el método tradicional
            const queryParts = searchParams.query.split(' ').filter(part => part.trim() !== '');
            if (queryParts.length > 0 && !make) {
              make = queryParts[0];
              
              if (queryParts.length > 1 && !model) {
                model = queryParts.slice(1).join(' ');
              }
            }
          }
        }
        
        // Ya manejamos la búsqueda de eBay Motors más abajo
        
        // Según la solicitud del usuario, ahora incluimos eBay Motors y Bring a Trailer
        console.log(`Parámetros de búsqueda - ebay: ${searchParams.ebay}, bringatrailer: ${searchParams.bringatrailer}`);
        
        // Buscamos en eBay Motors si está seleccionado y tenemos marca
        if (searchParams.ebay && make) {
          console.log(`Solicitando resultados de eBay Motors para: ${make} ${model} ${searchParams.year?.toString() || ''}`);
          try {
            ebayResults = await scrapeEbay(
              make, 
              model,
              searchParams.year?.toString()
            );
            console.log(`Obtenidos ${ebayResults.length} resultados de eBay Motors`);
          } catch (error) {
            console.error('Error al obtener resultados de eBay Motors:', error);
            ebayResults = [];
          }
        } else {
          console.log('No se solicitan resultados de eBay Motors');
        }
        
        // Buscamos en Bring a Trailer si está seleccionado y tenemos marca
        if (searchParams.bringatrailer && make) {
          console.log(`Solicitando resultados de Bring a Trailer para: ${make} ${model} ${searchParams.year?.toString() || ''}`);
          try {
            // SOLUCIÓN DE EMERGENCIA: Usamos el scraper de emergencia primero
            console.log('⚠️ USANDO SCRAPER DE EMERGENCIA para BringATrailer ⚠️');
            bringATrailerResults = await emergencyScrapeBringATrailer(
              make, 
              model,
              searchParams.year?.toString()
            );
            
            // Si el scraper de emergencia encuentra resultados, los usamos
            if (bringATrailerResults.length > 0) {
              console.log(`✅ ÉXITO TOTAL con scraper de EMERGENCIA: ${bringATrailerResults.length} subastas ACTIVAS encontradas`);
            } else {
              // Si el de emergencia falla, probamos con el enfocado
              console.log('El scraper de emergencia no encontró resultados, intentando con scraper enfocado...');
              bringATrailerResults = await scrapeBringATrailerFocused(
                make, 
                model,
                searchParams.year?.toString()
              );
              
              // Si el scraper enfocado encuentra resultados, los usamos
              if (bringATrailerResults.length > 0) {
                console.log(`✅ Éxito con scraper ENFOCADO: ${bringATrailerResults.length} subastas ACTIVAS encontradas`);
              } else {
                // Si no hay resultados con el enfocado, intentamos el normal
                console.log('El scraper enfocado no encontró resultados, intentando con scraper normal...');
                bringATrailerResults = await scrapeBringATrailer(
                  make, 
                  model,
                  searchParams.year?.toString()
                );
                
                // Si el normal tampoco encuentra, usamos OpenAI
                if (bringATrailerResults.length === 0) {
                  console.log('No se encontraron resultados con el scraper normal, intentando con OpenAI...');
                  bringATrailerResults = await scrapeBringATrailerWithAI(
                    make, 
                    model,
                    searchParams.year?.toString()
                  );
                  console.log(`Obtenidos ${bringATrailerResults.length} resultados de Bring a Trailer con OpenAI`);
                } else {
                  console.log(`Obtenidos ${bringATrailerResults.length} resultados de Bring a Trailer con scraper normal`);
                }
              }
            }
          } catch (error) {
            console.error('Error al obtener resultados de Bring a Trailer:', error);
            // Intento de respaldo con OpenAI si fallaron los scrapers normales
            try {
              console.log('Intentando obtener resultados con OpenAI como respaldo...');
              bringATrailerResults = await scrapeBringATrailerWithAI(
                make, 
                model,
                searchParams.year?.toString()
              );
              console.log(`Obtenidos ${bringATrailerResults.length} resultados de Bring a Trailer con OpenAI (respaldo)`);
            } catch (backupError) {
              console.error('Error al obtener resultados de Bring a Trailer con OpenAI:', backupError);
              bringATrailerResults = [];
            }
          }
        } else {
          console.log('No se solicitan resultados de Bring a Trailer');
        }
        
        console.log(`Obtained results: ${ebayResults.length} from eBay Motors, ${bringATrailerResults.length} from Bring a Trailer`);
        
        // Combinar resultados de eBay Motors y Bring a Trailer
        let allResults = [
          ...ebayResults,
          ...bringATrailerResults
        ];
        console.log(`Combined ${allResults.length} total results from eBay Motors and Bring a Trailer`);
        
        // Log para depurar BringATrailer resultados en detalle
        if (bringATrailerResults.length > 0) {
          console.log('Listado de vehículos de Bring a Trailer:');
          bringATrailerResults.forEach((vehicle, index) => {
            console.log(`Vehículo ${index + 1}: ${vehicle.title} - Precio: ${vehicle.price} - Tiempo: ${vehicle.endsIn}`);
          });
        }
        
        // Temporalmente deshabilitamos el filtro de no-vehículos ya que está eliminando resultados válidos
        // Comentario: el filtro OpenAI está eliminando todos los vehículos válidos, lo que sugiere que
        // necesitamos mejorar el prompt o replantearlo - por ahora lo deshabilitamos
        /*
        if (allResults.length > 0) {
          try {
            console.log('Filtrando resultados para eliminar repuestos o artículos que no sean autos...');
            const filteredResults = await openAIService.filterNonVehicles(allResults);
            console.log(`Filtrado completado: ${allResults.length} resultados totales → ${filteredResults.length} vehículos válidos (${allResults.length - filteredResults.length} eliminados)`);
            // Solo aplicamos el filtrado si quedan algunos resultados
            if (filteredResults.length > 0) {
              allResults = filteredResults;
            } else {
              console.log('El filtro eliminó todos los resultados, manteniendo los originales');
            }
          } catch (error) {
            console.error('Error al filtrar no-vehículos:', error);
            // En caso de error, continuamos con los resultados sin filtrar
          }
        }
        */
        
        if (allResults.length > 0) {
          await storage.saveVehicles(allResults);
        } else {
          console.log('No results to save');
        }
      }
      
      // Get filtered results from storage with pagination
      const results = await storage.getVehicles(searchParams, filterParams);
      
      // Cache the results
      searchCache.set(cacheKey, results);
      
      res.json(results);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      res.status(500).json({ message: 'An error occurred while searching for vehicles' });
    }
  });
  
  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
