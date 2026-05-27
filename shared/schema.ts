import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, varchar } from "drizzle-orm/pg-core";
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
  source: text("source").notNull(), // 'ebay', 'edmunds', 'hemmings.com', etc.
  transmission: text("transmission"),
  fuelType: text("fuel_type"),
  bodyType: text("body_type"),
  color: text("color"),
  vin: text("vin"),
  hasDeals: boolean("has_deals").default(false),
  dealerName: text("dealer_name"),
  isAuction: boolean("is_auction").default(false),
  currentBid: integer("current_bid"),
  endsIn: text("ends_in"),
  // Categoría del vehículo: 'clasico' | 'moderno' | 'electrico' | 'hibrido' | 'moto' | 'comercial'
  // Inferida por server/services/categorize.ts. Nullable para compatibilidad con filas existentes.
  vehicleCategory: text("vehicle_category"),
});

// Categorías válidas — usadas en filtros y en categorize.ts
export const VEHICLE_CATEGORIES = ["clasico", "moderno", "electrico", "hibrido", "moto", "comercial"] as const;
export type VehicleCategory = typeof VEHICLE_CATEGORIES[number];

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
}).extend({
  auctionData: z.object({
    isAuction: z.boolean().default(false),
    currentBid: z.number().nullable().default(null),
    endsIn: z.string().nullable().default(null)
  }).optional(),
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
});

export const insertFilterSchema = createInsertSchema(filters).omit({
  id: true,
});

// Search parameters schema
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  ebay: z.union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform(val => val !== 'false' && val !== false)
    .default(true),
  edmunds: z.union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform(val => val !== 'false' && val !== false)
    .default(true),
  hemmings: z.union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform(val => val !== 'false' && val !== false)
    .default(true),
  bringatrailer: z.union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform(val => val !== 'false' && val !== false)
    .default(true),
  classiccars: z.union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform(val => val !== 'false' && val !== false)
    .default(true),
  // Rango de año opcional — si no se manda, no se filtra (post-pivot v1).
  minYear: z.union([z.number(), z.string()])
    .optional()
    .transform(val => {
      if (val === undefined || val === '') return undefined;
      return typeof val === 'string' ? parseInt(val, 10) : val;
    }),
  maxYear: z.union([z.number(), z.string()])
    .optional()
    .transform(val => {
      if (val === undefined || val === '') return undefined;
      return typeof val === 'string' ? parseInt(val, 10) : val;
    }),
  // Categoría(s) del vehículo. Acepta una sola o lista separada por coma.
  category: z.union([
    z.string().array(),
    z.string().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : [])
  ]).optional(),
  page: z.union([z.number(), z.string()])
    .optional()
    .transform(val => typeof val === 'string' ? parseInt(val, 10) : val)
    .default(1),
  limit: z.union([z.number(), z.string()])
    .optional()
    .transform(val => typeof val === 'string' ? parseInt(val, 10) : val)
    .default(9),
  sort: z.string().optional().default("relevance"),
});

// Filter schema
export const filterSchema = z.object({
  minPrice: z.union([z.number(), z.string()])
    .optional()
    .transform(val => typeof val === 'string' && val ? parseInt(val, 10) : val),
  maxPrice: z.union([z.number(), z.string()])
    .optional()
    .transform(val => typeof val === 'string' && val ? parseInt(val, 10) : val),
  minMileage: z.union([z.number(), z.string()])
    .optional()
    .transform(val => typeof val === 'string' && val ? parseInt(val, 10) : val),
  maxMileage: z.union([z.number(), z.string()])
    .optional()
    .transform(val => typeof val === 'string' && val ? parseInt(val, 10) : val),
  bodyType: z.union([
    z.string().array(),
    z.string().transform(val => val ? val.split(',') : [])
  ]).optional(),
  transmission: z.union([
    z.string().array(),
    z.string().transform(val => val ? val.split(',') : [])
  ]).optional(),
  color: z.union([
    z.string().array(),
    z.string().transform(val => val ? val.split(',') : [])
  ]).optional(),
  // Rango de año del vehículo (UI lo expone en FilterPanel).
  minYear: z.union([z.number(), z.string()])
    .optional()
    .transform(val => {
      if (val === undefined || val === '') return undefined;
      return typeof val === 'string' ? parseInt(val, 10) : val;
    }),
  maxYear: z.union([z.number(), z.string()])
    .optional()
    .transform(val => {
      if (val === undefined || val === '') return undefined;
      return typeof val === 'string' ? parseInt(val, 10) : val;
    }),
  // Categoría(s) — mismo formato que en searchParamsSchema.
  vehicleCategory: z.union([
    z.string().array(),
    z.string().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : [])
  ]).optional(),
});

// Session storage table - necesario para la autenticación
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// Define users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  nombre: varchar("nombre"),
  apellido: varchar("apellido"),
  profileImageUrl: text("profile_image_url"),
  socialProvider: varchar("social_provider"), // 'twitter', 'google', 'apple', null para usuarios locales
  socialId: varchar("social_id"), // ID de usuario en el proveedor social
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create user schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const userLoginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

// User favorite vehicles
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
