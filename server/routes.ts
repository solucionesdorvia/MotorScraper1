import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeEbay } from "./scraper/ebay";
import { scrapeEdmunds } from "./scraper/edmunds";
import { scrapeCars } from "./scraper/cars";
import { searchParamsSchema, filterSchema, insertSearchHistorySchema, InsertVehicle } from "@shared/schema";
import { z } from "zod";
import NodeCache from "node-cache";

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
        
        // Extract make and model from query or use direct parameters
        let make = searchParams.make || '';
        let model = searchParams.model || '';
        
        // If query parameter is provided, try to extract make and model
        if (searchParams.query) {
          const queryParts = searchParams.query.split(' ').filter(part => part.trim() !== '');
          if (queryParts.length > 0 && !make) {
            make = queryParts[0];
            
            if (queryParts.length > 1 && !model) {
              model = queryParts.slice(1).join(' ');
            }
          }
        }
        
        if (searchParams.ebay && make) {
          ebayResults = await scrapeEbay(
            make, 
            model,
            searchParams.year?.toString()
          );
        }
        
        if (searchParams.edmunds && make) {
          // Use Cars.com instead of Edmunds since Edmunds is having issues
          carsResults = await scrapeCars(
            make, 
            model,
            searchParams.year?.toString()
          );
        }
        
        console.log(`Obtained ${ebayResults.length} results from eBay and ${carsResults.length} results from Cars.com`);
        
        // Combine results and save to storage
        const allResults = [...ebayResults, ...carsResults];
        console.log(`Combined ${allResults.length} total results to save`);
        
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
