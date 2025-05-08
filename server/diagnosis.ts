import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import axios from 'axios';

/**
 * Registra las rutas de diagnóstico para la aplicación
 */
export function registerDiagnosticRoutes(app: Express): void {
  // Ruta para la página de diagnóstico (HTML)
  app.get("/bat-diagnostic", (_req: Request, res: Response) => {
    try {
      const htmlPath = path.join(process.cwd(), "bat-diagnostic-page.html");
      const html = fs.readFileSync(htmlPath, "utf-8");
      res.type("text/html").send(html);
    } catch (error) {
      console.error("Error al servir la página de diagnóstico:", error);
      res.status(500).send("Error al cargar la página de diagnóstico");
    }
  });

  // Ruta para tomar capturas de pantalla de BaT
  app.get("/api/bat/screenshot", async (req: Request, res: Response) => {
    try {
      const make = req.query.make as string || "porsche";
      const model = req.query.model as string || "911";
      const year = req.query.year as string;
      
      // Construir URL de búsqueda
      const searchQuery = [make, model, year].filter(Boolean).join("+");
      const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
      
      console.log(`📸 Tomando captura de pantalla de BaT para: ${searchUrl}`);
      
      // Verificar si tenemos una API key para browserless.io
      if (!process.env.BROWSERLESS_API_KEY) {
        console.error(`❌ Error: No se encontró API key para browserless.io`);
        return res.status(500).json({
          success: false,
          error: "No se encontró API key para browserless.io"
        });
      }
      
      // URL de la API de browserless.io para captura de pantalla
      const browserlessUrl = `https://chrome.browserless.io/screenshot?token=${process.env.BROWSERLESS_API_KEY}`;
      
      // Configuración de la solicitud
      const requestBody = {
        url: searchUrl,
        options: {
          fullPage: true,
          type: "jpeg",
          quality: 80,
          omitBackground: true
        },
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 30000
        }
      };
      
      const response = await axios.post(browserlessUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer', 
        timeout: 60000 // 60 segundos
      });
      
      // Enviar la imagen directamente como respuesta
      res.type('image/jpeg').send(response.data);
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
      
      console.log(`🔍 Obteniendo HTML renderizado de: ${url}`);
      
      // Verificar si tenemos una API key para browserless.io
      if (!process.env.BROWSERLESS_API_KEY) {
        console.error(`❌ Error: No se encontró API key para browserless.io`);
        return res.status(500).json({
          success: false,
          error: "No se encontró API key para browserless.io"
        });
      }
      
      // URL de la API de browserless.io
      const browserlessUrl = `https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_API_KEY}`;
      
      // Configuración de la solicitud
      const requestBody = {
        url: url,
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 30000
        }
      };
      
      const response = await axios.post(browserlessUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 segundos
      });
      
      // Devolver el HTML como texto
      res.type("text/html").send(response.data);
    } catch (error) {
      console.error("Error al obtener HTML:", error);
      return res.status(500).json({
        success: false,
        error: "Error al obtener HTML"
      });
    }
  });
  
  // Ruta para probar el scraper de BaT
  app.get("/api/bat/test", async (req: Request, res: Response) => {
    try {
      const make = req.query.make as string || "porsche";
      const model = req.query.model as string || "911";
      const year = req.query.year as string;
      
      console.log(`🔍 Prueba de scraper para BaT - Marca: ${make}, Modelo: ${model}, Año: ${year || 'cualquiera'}`);
      
      // Importar el scraper dinámicamente para evitar problemas de dependencia circular
      const { scrapeBringATrailer } = await import("./scraper/bringatrailer");
      const vehicles = await scrapeBringATrailer(make, model, year);
      
      return res.json({
        success: true,
        count: vehicles.length,
        results: vehicles
      });
    } catch (error) {
      console.error("Error al ejecutar prueba del scraper:", error);
      return res.status(500).json({
        success: false,
        error: "Error al ejecutar prueba del scraper"
      });
    }
  });
}