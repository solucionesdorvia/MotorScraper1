/**
 * ENDPOINT PARA PROBAR EL NUEVO SCRAPER DE RESULTADOS DE BÚSQUEDA GENERAL
 */

import { scrapeBringATrailerSearchResults } from './bat-search-results';
import express from 'express';

export function registerBatSearchEndpoint(app: express.Express) {
  // Endpoint para probar el nuevo scraper de resultados de búsqueda general
  app.get("/api/bat/search-results", async (req: express.Request, res: express.Response) => {
    try {
      // Obtener parámetros de búsqueda
      const make = req.query.make as string || 'Ford';
      const model = req.query.model as string || 'Mustang';
      const year = req.query.year as string || '1966';
      
      console.log(`Probando scraper de resultados de búsqueda general para: ${make} ${model} ${year || ''}`);
      
      // Llamar al scraper de resultados de búsqueda general
      const results = await scrapeBringATrailerSearchResults(make, model, year);
      
      console.log(`Resultados encontrados: ${results.length}`);
      
      // Devolver resultados
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error: any) {
      console.error('Error al procesar con scraper de resultados de búsqueda general:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar con scraper de resultados de búsqueda general',
        message: error.message
      });
    }
  });
}