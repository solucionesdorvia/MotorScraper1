import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the vehicle schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  price: integer("price"),
  year: integer("year"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage"),
  location: text("location"),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"),
  source: text("source").notNull(), // 'ebay' or 'edmunds'
  transmission: text("transmission"),
  fuelType: text("fuel_type"),
  bodyType: text("body_type"),
  color: text("color"),
  vin: text("vin"),
  hasDeals: boolean("has_deals").default(false),
  dealerName: text("dealer_name"),
});

// Define the search history schema
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  timestamp: text("timestamp").notNull(),
});

// Define the filter schema
export const filters = pgTable("filters", {
  id: serial("id").primaryKey(),
  minPrice: integer("min_price"),
  maxPrice: integer("max_price"),
  minYear: integer("min_year"),
  maxYear: integer("max_year"),
  minMileage: integer("min_mileage"),
  maxMileage: integer("max_mileage"),
  make: text("make"),
  model: text("model"),
  transmission: text("transmission"),
  bodyType: text("body_type"),
  color: text("color"),
});

// Zod schemas for validation
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
});

export const insertFilterSchema = createInsertSchema(filters).omit({
  id: true,
});

// Search parameters schema
export const searchParamsSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  ebay: z.boolean().optional().default(true),
  edmunds: z.boolean().optional().default(true),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(9),
  sort: z.string().optional().default("relevance"),
});

// Filter schema
export const filterSchema = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minMileage: z.number().optional(),
  maxMileage: z.number().optional(),
  bodyType: z.string().array().optional(),
  transmission: z.string().array().optional(),
  color: z.string().array().optional(),
});

// Type definitions
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type Filter = typeof filters.$inferSelect;
export type InsertFilter = z.infer<typeof insertFilterSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type FilterParams = z.infer<typeof filterSchema>;
