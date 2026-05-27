import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeEbay } from "./scraper/ebay";
import { categorizeVehicle } from "./services/categorize";
import { buildEcomexQuoteLink } from "./services/ecomex-link";
import { recognizeVehicleFromPhoto } from "./services/recognize-photo";
import { recognizeVehicleFromChat } from "./services/recognize-chat";
import { decodeVin } from "./services/recognize-vin";
import multer from "multer";

// Multer en memoria — la imagen va directo a OpenAI Vision como base64,
// no necesitamos persistirla. Límite 8MB para evitar abuso (OpenAI igual
// recomienda <20MB y la calidad satura mucho antes).
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});
import { scrapeEdmunds } from "./scraper/edmunds";
import { scrapeCars } from "./scraper/cars";
import { scrapeHemmings } from "./scraper/hemmings";
import { scrapeBringATrailer } from "./scraper/bringatrailer";
import { scrapeClassicCars } from "./scraper/classiccars";
import { takeScreenshotOfBaT, diagnosticGetHTML } from "./scraper/bringatrailer-screenshot";
import { searchParamsSchema, filterSchema, insertSearchHistorySchema, insertUserSchema, userLoginSchema, InsertVehicle } from "@shared/schema";
import { z } from "zod";
import NodeCache from "node-cache";
import { openAIService } from "./services/openai-service";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import cookieParser from "cookie-parser";
import passport from "passport";
import { configurePassport } from "./passport-config";

// Cache for search results (TTL: 5 minutes)
const searchCache = new NodeCache({ stdTTL: 300 });

/**
 * Función para intercalar los resultados de las diferentes fuentes
 * @param list1 Primera lista de vehículos
 * @param list2 Segunda lista de vehículos
 * @returns Lista intercalada de vehículos
 */
function interleaveResults(list1: InsertVehicle[], list2: InsertVehicle[]): InsertVehicle[] {
  const maxLength = Math.max(list1.length, list2.length);
  const result: InsertVehicle[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    // Añadir de la primera lista si existe un elemento en esa posición
    if (i < list1.length) {
      result.push(list1[i]);
    }
    
    // Añadir de la segunda lista si existe un elemento en esa posición
    if (i < list2.length) {
      result.push(list2[i]);
    }
  }
  
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar middleware para sesiones
  const PgSession = connectPg(session);
  app.use(cookieParser());
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'clasicarsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  }));
  
  // Configurar Passport para autenticación social
  const passportInstance = configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // API route for user registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.safeParse(req.body);
      
      if (!userData.success) {
        return res.status(400).json({ 
          success: false,
          message: "Datos de usuario inválidos", 
          errors: userData.error.errors 
        });
      }
      
      // Verificar si el correo ya existe
      const existingUser = await storage.getUserByEmail(userData.data.email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: "El correo electrónico ya está registrado" 
        });
      }
      
      // Crear el usuario
      const user = await storage.createUser(userData.data);
      
      // Iniciar sesión
      req.session.userId = user.id;
      
      // Responder con datos del usuario (excepto contraseña)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        message: "Usuario registrado correctamente",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al registrar el usuario" 
      });
    }
  });
  
  // API route for user login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const loginData = userLoginSchema.safeParse(req.body);
      
      if (!loginData.success) {
        return res.status(400).json({ 
          success: false,
          message: "Datos de inicio de sesión inválidos", 
          errors: loginData.error.errors 
        });
      }
      
      // Verificar credenciales
      const user = await storage.verifyUser(loginData.data.email, loginData.data.password);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Correo electrónico o contraseña incorrectos" 
        });
      }
      
      // Iniciar sesión
      req.session.userId = user.id;
      
      // Responder con datos del usuario (excepto contraseña)
      const { password, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: "Inicio de sesión exitoso",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al iniciar sesión" 
      });
    }
  });
  
  // API route for user logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: "Error al cerrar sesión" 
        });
      }
      
      res.json({ 
        success: true,
        message: "Sesión cerrada correctamente" 
      });
    });
  });
  
  // Rutas de autenticación social
  // Twitter
  app.get('/api/auth/twitter', passport.authenticate('twitter'));
  app.get('/api/auth/twitter/callback', 
    passport.authenticate('twitter', { 
      successRedirect: '/',
      failureRedirect: '/login'
    })
  );
  
  // Google
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { 
      successRedirect: '/', 
      failureRedirect: '/login' 
    })
  );
  
  // Apple
  app.get('/api/auth/apple', passport.authenticate('apple'));
  app.get('/api/auth/apple/callback', 
    passport.authenticate('apple', { 
      successRedirect: '/', 
      failureRedirect: '/login' 
    })
  );

  // API route to get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // Verificar si hay una sesión activa
      if (!req.session.userId && !req.user) {
        return res.status(401).json({ 
          success: false,
          message: "No hay sesión activa" 
        });
      }
      
      // Obtener datos del usuario (sesión local o passport)
      let user;
      if (req.user) {
        user = req.user;
      } else if (req.session.userId) {
        user = await storage.getUser(req.session.userId);
      }
      
      if (!user) {
        // Eliminar sesión si el usuario no existe
        req.session.destroy(() => {});
        return res.status(401).json({ 
          success: false,
          message: "Usuario no encontrado" 
        });
      }
      
      // Responder con datos del usuario (excepto contraseña)
      const { password, ...userWithoutPassword } = user as any;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al obtener información del usuario" 
      });
    }
  });
  
  // API route for favorites
  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false,
          message: "Debe iniciar sesión para guardar favoritos" 
        });
      }
      
      const { vehicleId } = req.body;
      
      if (!vehicleId) {
        return res.status(400).json({ 
          success: false,
          message: "ID de vehículo no proporcionado" 
        });
      }
      
      const favorite = await storage.addFavorite(req.session.userId, vehicleId);
      
      res.status(201).json({
        success: true,
        message: "Vehículo guardado en favoritos",
        favorite
      });
    } catch (error) {
      console.error('Error al guardar favorito:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al guardar en favoritos" 
      });
    }
  });
  
  // API route to remove a favorite
  app.delete("/api/favorites/:vehicleId", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false,
          message: "Debe iniciar sesión para eliminar favoritos" 
        });
      }
      
      const vehicleId = parseInt(req.params.vehicleId);
      
      if (isNaN(vehicleId)) {
        return res.status(400).json({ 
          success: false,
          message: "ID de vehículo inválido" 
        });
      }
      
      await storage.removeFavorite(req.session.userId, vehicleId);
      
      res.json({
        success: true,
        message: "Vehículo eliminado de favoritos"
      });
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al eliminar de favoritos" 
      });
    }
  });
  
  // API route to get user favorites
  app.get("/api/favorites", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false,
          message: "Debe iniciar sesión para ver favoritos" 
        });
      }
      
      const favorites = await storage.getUserFavorites(req.session.userId);
      
      res.json({
        success: true,
        favorites
      });
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      res.status(500).json({ 
        success: false,
        message: "Error al obtener favoritos" 
      });
    }
  });
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
        
        // Intercalar resultados de eBay Motors y Bring a Trailer
        let allResults = interleaveResults(ebayResults, bringATrailerResults);
        
        console.log(`Combined and interleaved ${allResults.length} total results from eBay Motors and Bring a Trailer`);
        
        // Mostrar primeros 10 resultados intercalados para verificar
        if (allResults.length > 0) {
          console.log('📊 Muestra de resultados intercalados (primeros 10):');
          allResults.slice(0, Math.min(10, allResults.length)).forEach((vehicle: InsertVehicle, index: number) => {
            console.log(`  ${index + 1}. [${vehicle.source}] ${vehicle.title}`);
          });
        }
        
        // Log para depurar BringATrailer resultados en detalle
        if (bringATrailerResults.length > 0) {
          console.log('Listado de vehículos de Bring a Trailer:');
          bringATrailerResults.forEach((vehicle: InsertVehicle, index: number) => {
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
          // Backfill de vehicleCategory para cualquier scraper que no lo haya seteado.
          // categorizeVehicle es heurístico y barato; corre por todos por consistencia.
          allResults = allResults.map(v => ({
            ...v,
            vehicleCategory: v.vehicleCategory || categorizeVehicle({
              year: v.year ?? undefined,
              fuelType: v.fuelType ?? undefined,
              title: v.title ?? undefined,
              make: v.make ?? undefined,
              bodyType: v.bodyType ?? undefined,
            }),
          }));
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

  // === VARIANTES DE UN MODELO ===
  // Devuelve hasta 12 vehículos similares (mismo make + model, distintos años / sources)
  // ordenados por precio. Reusa la data ya cacheada en storage: la idea es que el usuario
  // entra a variantes desde una card que viene de una búsqueda reciente, así que ya hay
  // listings recientes en memoria/DB. Si está vacío, devuelve [] (no triggerea scrapeo
  // adicional para mantener la respuesta rápida).
  app.get("/api/variants", async (req: Request, res: Response) => {
    try {
      const { make, model } = req.query;
      if (!make || typeof make !== 'string') {
        return res.status(400).json({ error: 'Falta el query param "make"' });
      }
      if (!model || typeof model !== 'string') {
        return res.status(400).json({ error: 'Falta el query param "model"' });
      }

      // Construimos searchParams mínimos para reusar storage.getVehicles.
      // Habilitamos todas las fuentes para maximizar resultados; sin year (queremos variantes
      // de todos los años); sort por precio ascendente; limit 12.
      const sp = await searchParamsSchema.parseAsync({
        query: `${make} ${model}`,
        make,
        model,
        ebay: true,
        edmunds: true,
        hemmings: true,
        bringatrailer: true,
        classiccars: true,
        page: 1,
        limit: 12,
        sort: 'price_asc',
      });
      const fp = await filterSchema.parseAsync({});
      const result = await storage.getVehicles(sp as any, fp as any);
      res.json(result);
    } catch (error) {
      console.error('Error en /api/variants:', error);
      res.status(500).json({ error: 'No se pudieron obtener variantes.' });
    }
  });

  // === RECONOCIMIENTO DE VEHÍCULOS (3 modalidades) ===

  // POST /api/recognize/photo (multipart): subir 1 imagen, devuelve identificación.
  app.post("/api/recognize/photo", photoUpload.single("image"), async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: 'Falta el archivo de imagen (campo "image")' });
      }
      const result = await recognizeVehicleFromPhoto(file.buffer, file.mimetype);
      res.json(result);
    } catch (error) {
      console.error('Error en /api/recognize/photo:', error);
      res.status(500).json({ error: 'No se pudo identificar el vehículo desde la foto.' });
    }
  });

  // POST /api/recognize/chat (JSON): {message, history?} → reply + recommendations.
  app.post("/api/recognize/chat", async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body || {};
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Falta el campo "message" (string)' });
      }
      const result = await recognizeVehicleFromChat(message, Array.isArray(history) ? history : []);
      res.json(result);
    } catch (error) {
      console.error('Error en /api/recognize/chat:', error);
      res.status(500).json({ error: 'El asesor no pudo responder. Intentá de nuevo.' });
    }
  });

  // POST /api/recognize/vin (JSON): {vin} → especificaciones del vehículo via NHTSA.
  app.post("/api/recognize/vin", async (req: Request, res: Response) => {
    try {
      const { vin } = req.body || {};
      if (!vin || typeof vin !== 'string') {
        return res.status(400).json({ error: 'Falta el campo "vin" (string)' });
      }
      const result = await decodeVin(vin);
      res.json(result);
    } catch (error) {
      console.error('Error en /api/recognize/vin:', error);
      res.status(500).json({ error: 'No se pudo decodificar el VIN.' });
    }
  });

  // === PARTNERSHIP E-COMEX ===
  // Devuelve la URL al cotizador de ecomex prefijada con los datos del vehículo.
  // El cliente abre esa URL en una nueva tab (target=_blank) desde la ficha.
  app.get("/api/ecomex/quote-link", (req: Request, res: Response) => {
    const { make, model, year } = req.query;
    const url = buildEcomexQuoteLink({
      make: typeof make === 'string' ? make : undefined,
      model: typeof model === 'string' ? model : undefined,
      year: typeof year === 'string' ? year : undefined,
    });
    res.json({ url });
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