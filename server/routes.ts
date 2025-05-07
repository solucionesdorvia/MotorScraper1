import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeEbay } from "./scraper/ebay";
import { scrapeEdmunds } from "./scraper/edmunds";
import { scrapeCars } from "./scraper/cars";
import { scrapeHemmings } from "./scraper/hemmings";
import { scrapeBringATrailerSimple } from "./scraper/bat-simple";
import { scrapeBringATrailerFromExample } from "./scraper/bat-html-example";
import { scrapeBringATrailerPattern } from "./scraper/bat-pattern";
import { scrapeBringATrailerUniversal } from "./scraper/bat-universal";
import { scrapeBringATrailerAuctions } from "./scraper/bat-auctions";
import { scrapeBringATrailerAuctionsV2 } from "./scraper/bat-auctions-v2";
import { scrapeBringATrailerDirectAuctions } from "./scraper/bat-direct-auctions";
import { scrapeBringATrailerDirectOptimized } from "./scraper/bat-direct-optimized";
import { scrapeBringATrailerDirectMatch } from "./scraper/bat-direct-match";
import { scrapeBringATrailerDodge } from "./scraper/bat-dodge-improved";
import { scrapeBringATrailerDirectFixed } from "./scraper/bat-direct-fixed";
import { scrapeBringATrailerSearchResults } from "./scraper/bat-search-results";
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
      console.log(`Found ${storedResults.totalResults} stored results before fetching`);
      
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
            // Utilizamos un sistema de cascada de scrapers, probando en orden hasta obtener resultados
            
            // 1. Comenzamos con el nuevo scraper mejorado (coincidencia directa y mejor extracción)
            console.log('1. Intentando scraper directo mejorado...');
            bringATrailerResults = await scrapeBringATrailerDirectFixed(
              make, 
              model,
              searchParams.year?.toString()
            );
            
            // 2. Si no hay resultados, intentamos con el scraper de coincidencia directa anterior
            if (bringATrailerResults.length === 0) {
              console.log('2. Intentando scraper de coincidencia directa...');
              bringATrailerResults = await scrapeBringATrailerDirectMatch(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // 3. Si todavía no hay resultados, probamos con el scraper optimizado
            if (bringATrailerResults.length === 0) {
              console.log('3. Intentando scraper optimizado...');
              bringATrailerResults = await scrapeBringATrailerDirectOptimized(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // 4. Si sigue sin haber resultados, probamos con el scraper directo
            if (bringATrailerResults.length === 0) {
              console.log('4. Intentando scraper directo de auctions...');
              bringATrailerResults = await scrapeBringATrailerDirectAuctions(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // 5. Para modelos Dodge, probamos con el scraper especializado para Dodge
            if (bringATrailerResults.length === 0 && make.toLowerCase() === 'dodge') {
              console.log('5. Detectada búsqueda de Dodge, usando scraper especializado...');
              bringATrailerResults = await scrapeBringATrailerDodge(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // 6. Si todavía no hay resultados, probamos con el scraper de HTML de ejemplo
            if (bringATrailerResults.length === 0) {
              console.log('6. Intentando scraper basado en HTML ejemplo...');
              bringATrailerResults = await scrapeBringATrailerFromExample(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // 7. Intentamos con el nuevo scraper de resultados de búsqueda general
            if (bringATrailerResults.length === 0) {
              console.log('7. Intentando scraper de resultados de búsqueda general...');
              bringATrailerResults = await scrapeBringATrailerSearchResults(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // 8. Como último recurso, usamos el scraper universal
            if (bringATrailerResults.length === 0) {
              console.log('8. Intentando scraper universal (último recurso)...');
              bringATrailerResults = await scrapeBringATrailerUniversal(
                make, 
                model,
                searchParams.year?.toString()
              );
            }
            
            // Informar sobre los resultados
            if (bringATrailerResults.length > 0) {
              console.log(`✅ ÉXITO: Encontradas ${bringATrailerResults.length} subastas ACTIVAS de Bring a Trailer`);
            } else {
              console.log('⚠️ No se encontraron subastas activas en Bring a Trailer para esta búsqueda');
            }
            
          } catch (error) {
            console.error('Error al obtener resultados de Bring a Trailer:', error);
            bringATrailerResults = [];
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
          bringATrailerResults.forEach((vehicle: InsertVehicle, index) => {
            console.log(`Vehículo ${index + 1}: ${vehicle.title} - Precio: ${vehicle.price} - Tiempo: ${vehicle.endsIn || "En curso"}`);
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
  
  // Endpoint especializado para probar el scraper de HTML renderizado
  app.get("/api/bat/html-example", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Mustang';
      const year = req.query.year as string;
      
      console.log(`Probando scraper HTML renderizado para: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper especializado
      const results = await scrapeBringATrailerFromExample(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar HTML de ejemplo:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar HTML de ejemplo',
        message: error.message
      });
    }
  });
  
  // Endpoint para probar el nuevo scraper directo de subastas
  app.get("/api/bat/direct-auctions", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Mustang';
      const year = req.query.year as string;
      
      console.log(`Probando scraper directo de auctions para: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper directo
      const results = await scrapeBringATrailerDirectAuctions(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar página de auctions:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar página de auctions',
        message: error.message
      });
    }
  });
  
  // Endpoint para probar el scraper optimizado de subastas
  app.get("/api/bat/optimized", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Mustang';
      const year = req.query.year as string;
      
      console.log(`Probando scraper optimizado para: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper optimizado
      const results = await scrapeBringATrailerDirectOptimized(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar con scraper optimizado:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar con scraper optimizado',
        message: error.message
      });
    }
  });
  
  // Endpoint para probar el scraper de coincidencia directa con el HTML exacto
  app.get("/api/bat/direct-match", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Mustang';
      const year = req.query.year as string;
      
      console.log(`Probando scraper de coincidencia directa para: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper de coincidencia directa
      const results = await scrapeBringATrailerDirectMatch(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar con scraper de coincidencia directa:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar con scraper de coincidencia directa',
        message: error.message
      });
    }
  });
  
  // Endpoint para probar el scraper especializado para Dodge
  app.get("/api/bat/dodge", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Dodge';
      const model = req.query.model as string || 'Challenger';
      const year = req.query.year as string;
      
      console.log(`Probando scraper especializado para Dodge: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper especializado para Dodge
      const results = await scrapeBringATrailerDodge(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar con scraper especializado para Dodge:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar con scraper especializado para Dodge',
        message: error.message
      });
    }
  });
  
  // Endpoint para probar el nuevo scraper directo mejorado (FIXED)
  app.get("/api/bat/fixed", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Ranchero';
      const year = req.query.year as string || '1971';
      
      console.log(`Probando scraper directo MEJORADO para: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper directo mejorado
      const results = await scrapeBringATrailerDirectFixed(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar con scraper directo mejorado:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar con scraper directo mejorado',
        message: error.message
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}