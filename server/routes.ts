import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeEbay } from "./scraper/ebay";
import { scrapeEdmunds } from "./scraper/edmunds";
import { scrapeCars } from "./scraper/cars";
import { scrapeHemmings } from "./scraper/hemmings";
import { scrapeBringATrailer } from "./scraper/bringatrailer";
import { scrapeClassicCars } from "./scraper/classiccars";
import { takeScreenshotOfBaT, diagnosticGetHTML } from "./scraper/bringatrailer-screenshot";
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
            // Usando el nuevo y único scraper de BaT
            console.log('Ejecutando nuevo scraper unificado de Bring a Trailer...');
            bringATrailerResults = await scrapeBringATrailer(
              make, 
              model,
              searchParams.year?.toString()
            );
            
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
  
  // Endpoint para probar el nuevo scraper unificado de Bring a Trailer con navegación real
  app.get("/api/bat/test", async (req: Request, res: Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Mustang';
      const year = req.query.year as string;
      
      console.log(`🚀 Probando scraper con navegación real de Bring a Trailer para: ${make} ${model} ${year || ''}`);
      
      // Llamar al nuevo scraper con navegación real
      const results = await scrapeBringATrailer(make, model, year);
      
      console.log(`✅ Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('❌ Error al procesar con scraper de navegación real de Bring a Trailer:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar con scraper de navegación real de Bring a Trailer',
        message: error.message
      });
    }
  });
  
  // Rutas de diagnóstico para BaT
  
  // Ruta para tomar capturas de pantalla de BaT
  app.get("/api/bat/screenshot", async (req: Request, res: Response) => {
    try {
      const make = req.query.make as string || "porsche";
      const model = req.query.model as string || "911";
      const year = req.query.year as string;
      
      const screenshotPath = await takeScreenshotOfBaT(make, model, year);
      
      if (!screenshotPath) {
        return res.status(500).json({
          success: false,
          error: "No se pudo tomar la captura de pantalla"
        });
      }
      
      // Enviar el archivo de imagen
      return res.sendFile(screenshotPath);
    } catch (error) {
      console.error("Error al tomar captura de pantalla:", error);
      return res.status(500).json({
        success: false,
        error: "Error al tomar captura de pantalla"
      });
    }
  });
  
  // Ruta para diagnóstico de HTML
  app.get("/api/bat/html", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({
          success: false,
          error: "Se requiere el parámetro url"
        });
      }
      
      const html = await diagnosticGetHTML(url);
      
      if (!html) {
        return res.status(500).json({
          success: false,
          error: "No se pudo obtener el HTML"
        });
      }
      
      return res.type("text/html").send(html);
    } catch (error) {
      console.error("Error al obtener HTML:", error);
      return res.status(500).json({
        success: false,
        error: "Error al obtener HTML"
      });
    }
  });
  
  // Página de diagnóstico para BaT
  app.get("/bat-diagnostic", (req: Request, res: Response) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Diagnóstico de Bring a Trailer</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2 {
          color: #333;
        }
        form {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input, button {
          padding: 8px;
          margin-bottom: 10px;
        }
        button {
          background-color: #4a65a3;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          padding: 8px 15px;
        }
        button:hover {
          background-color: #3a5293;
        }
        #results {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          display: none;
        }
        img {
          max-width: 100%;
          margin-top: 10px;
          border: 1px solid #ddd;
        }
        pre {
          background-color: #f9f9f9;
          padding: 10px;
          overflow: auto;
          border: 1px solid #ddd;
          border-radius: 5px;
          max-height: 300px;
        }
        .tab {
          overflow: hidden;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
          margin-top: 20px;
          border-radius: 5px 5px 0 0;
        }
        .tab button {
          background-color: inherit;
          float: left;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 10px 16px;
          transition: 0.3s;
          color: #000;
        }
        .tab button:hover {
          background-color: #ddd;
        }
        .tab button.active {
          background-color: #4a65a3;
          color: white;
        }
        .tabcontent {
          display: none;
          padding: 15px;
          border: 1px solid #ccc;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
      </style>
    </head>
    <body>
      <h1>Diagnóstico de Scraper de Bring a Trailer</h1>
      <p>Esta herramienta permite diagnosticar el scraper de Bring a Trailer verificando su comportamiento con navegación real.</p>
      
      <h2>Tomar captura de pantalla</h2>
      <form id="screenshotForm">
        <div>
          <label for="make">Marca:</label>
          <input type="text" id="make" name="make" value="porsche" required>
        </div>
        <div>
          <label for="model">Modelo:</label>
          <input type="text" id="model" name="model" value="911" required>
        </div>
        <div>
          <label for="year">Año (opcional):</label>
          <input type="text" id="year" name="year" value="1980">
        </div>
        <button type="submit">Tomar captura</button>
      </form>
      
      <div class="tab">
        <button class="tablinks active" onclick="openTab(event, 'screenshotTab')">Captura de pantalla</button>
        <button class="tablinks" onclick="openTab(event, 'htmlTab')">HTML renderizado</button>
        <button class="tablinks" onclick="openTab(event, 'jsonTab')">Datos extraídos</button>
      </div>
      
      <div id="screenshotTab" class="tabcontent" style="display:block">
        <h3>Captura de Bring a Trailer</h3>
        <div id="screenshotResult"></div>
      </div>
      
      <div id="htmlTab" class="tabcontent">
        <h3>HTML renderizado</h3>
        <button id="getHtmlBtn" disabled>Obtener HTML</button>
        <div id="htmlResult"></div>
      </div>
      
      <div id="jsonTab" class="tabcontent">
        <h3>Datos extraídos</h3>
        <button id="getDataBtn">Extraer datos</button>
        <div id="jsonResult"></div>
      </div>
      
      <script>
        // Variable para almacenar la URL actual
        let currentSearchUrl = '';
        
        // Manejar el envío del formulario de captura
        document.getElementById('screenshotForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const make = document.getElementById('make').value;
          const model = document.getElementById('model').value;
          const year = document.getElementById('year').value;
          
          // Crear URL de búsqueda para referencia
          const searchQuery = [make, model, year].filter(Boolean).join('+');
          currentSearchUrl = \`https://bringatrailer.com/auctions/?search=\${encodeURIComponent(searchQuery)}\`;
          
          // Actualizar UI
          document.getElementById('screenshotResult').innerHTML = '<p>Tomando captura...</p>';
          document.getElementById('getHtmlBtn').disabled = false;
          
          try {
            // Construir la URL con los parámetros
            let url = \`/api/bat/screenshot?make=\${encodeURIComponent(make)}&model=\${encodeURIComponent(model)}\`;
            if (year) {
              url += \`&year=\${encodeURIComponent(year)}\`;
            }
            
            // Mostrar la imagen en tiempo real
            const timestamp = new Date().getTime(); // Para evitar caché
            document.getElementById('screenshotResult').innerHTML = \`
              <p>URL de búsqueda: <a href="\${currentSearchUrl}" target="_blank">\${currentSearchUrl}</a></p>
              <img src="\${url}&t=\${timestamp}" alt="Captura de BaT">
            \`;
            
            // Mostrar pestaña de captura
            openTab(null, 'screenshotTab');
          } catch (error) {
            document.getElementById('screenshotResult').innerHTML = \`<p>Error: \${error.message}</p>\`;
          }
        });
        
        // Botón para obtener HTML
        document.getElementById('getHtmlBtn').addEventListener('click', async function() {
          if (!currentSearchUrl) {
            alert('Primero tome una captura de pantalla');
            return;
          }
          
          document.getElementById('htmlResult').innerHTML = '<p>Obteniendo HTML...</p>';
          
          try {
            const response = await fetch(\`/api/bat/html?url=\${encodeURIComponent(currentSearchUrl)}\`);
            const html = await response.text();
            
            document.getElementById('htmlResult').innerHTML = \`
              <p>HTML de la página (renderizado con JavaScript):</p>
              <pre>\${escapeHtml(html)}</pre>
            \`;
            
            // Mostrar pestaña de HTML
            openTab(null, 'htmlTab');
          } catch (error) {
            document.getElementById('htmlResult').innerHTML = \`<p>Error: \${error.message}</p>\`;
          }
        });
        
        // Botón para extraer datos
        document.getElementById('getDataBtn').addEventListener('click', async function() {
          const make = document.getElementById('make').value;
          const model = document.getElementById('model').value;
          const year = document.getElementById('year').value;
          
          document.getElementById('jsonResult').innerHTML = '<p>Extrayendo datos...</p>';
          
          try {
            // Construir la URL con los parámetros
            let url = \`/api/bat/test?make=\${encodeURIComponent(make)}&model=\${encodeURIComponent(model)}\`;
            if (year) {
              url += \`&year=\${encodeURIComponent(year)}\`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            document.getElementById('jsonResult').innerHTML = \`
              <p>Resultados extraídos (\${data.count} vehículos):</p>
              <pre>\${JSON.stringify(data, null, 2)}</pre>
            \`;
            
            // Mostrar pestaña de JSON
            openTab(null, 'jsonTab');
          } catch (error) {
            document.getElementById('jsonResult').innerHTML = \`<p>Error: \${error.message}</p>\`;
          }
        });
        
        // Función para cambiar entre pestañas
        function openTab(evt, tabName) {
          var i, tabcontent, tablinks;
          
          // Ocultar todas las pestañas
          tabcontent = document.getElementsByClassName("tabcontent");
          for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
          }
          
          // Quitar la clase "active" de todos los botones
          tablinks = document.getElementsByClassName("tablinks");
          for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
          }
          
          // Mostrar la pestaña actual y añadir la clase "active" al botón
          document.getElementById(tabName).style.display = "block";
          if (evt) {
            evt.currentTarget.className += " active";
          } else {
            // Si no hay evento, activar el botón por su ID
            document.querySelector(\`button[onclick*="\${tabName}"]\`).className += " active";
          }
        }
        
        // Función para escapar HTML
        function escapeHtml(html) {
          return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }
      </script>
    </body>
    </html>
    `;
    
    res.type('text/html').send(html);
  });

  const httpServer = createServer(app);

  return httpServer;
}