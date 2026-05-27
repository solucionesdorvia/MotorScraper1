/**
 * Helper para categorizar vehículos provenientes de los scrapers.
 *
 * Reglas (heurísticas — quedan ajustables sin migration, se aplica al insertar):
 *   - `clasico`    → año < 1996 (régimen argentino de vehículos de colección 25+ años).
 *   - `electrico`  → fuelType === 'electric' o nombres conocidos en el título.
 *   - `hibrido`    → fuelType === 'hybrid' o "hybrid/híbrido/prius" en el título.
 *   - `moto`       → bodyType o título indica moto/motorcycle.
 *   - `comercial`  → bodyType o título indica truck/van/pickup heavy duty.
 *   - default      → `moderno`.
 *
 * NOTA: si tenemos un campo `category` en la fuente original, la heurística no se aplica.
 */
import type { VehicleCategory } from "@shared/schema";

interface CategorizeInput {
  year?: number | null;
  fuelType?: string | null;
  title?: string | null;
  make?: string | null;
  bodyType?: string | null;
}

const ELECTRIC_KEYWORDS = /\b(tesla|byd|kia ev[0-9]?|ioniq|leaf|model [3sxy]|polestar|rivian|lucid|electric|eléctric)/i;
const HYBRID_KEYWORDS = /\b(hybrid|h[ií]brido|prius|insight|niro hybrid)\b/i;
const MOTO_KEYWORDS = /\b(motorcycle|moto\b|scooter|harley|ducati|yamaha r[1-9]|kawasaki ninja)\b/i;
const COMERCIAL_KEYWORDS = /\b(truck|cami[oó]n|van\b|pickup|utility|cargo|sprinter|transit)\b/i;

export function categorizeVehicle(input: CategorizeInput): VehicleCategory {
  const { year, fuelType, title, make, bodyType } = input;
  const haystack = [title, make, bodyType].filter(Boolean).join(" ").toLowerCase();

  // Año primero: clásicos del régimen argentino
  if (year && year < 1996) return "clasico";

  // Eléctrico: por fuelType o por make/model
  if (fuelType && /electric|el[eé]ctrico|ev\b/i.test(fuelType)) return "electrico";
  if (ELECTRIC_KEYWORDS.test(haystack)) return "electrico";

  // Híbrido: idem
  if (fuelType && /hybrid|h[ií]brido/i.test(fuelType)) return "hibrido";
  if (HYBRID_KEYWORDS.test(haystack)) return "hibrido";

  // Moto
  if (bodyType && /motorcycle|moto/i.test(bodyType)) return "moto";
  if (MOTO_KEYWORDS.test(haystack)) return "moto";

  // Comercial / utility
  if (bodyType && /truck|van|pickup|cargo/i.test(bodyType)) return "comercial";
  if (COMERCIAL_KEYWORDS.test(haystack)) return "comercial";

  return "moderno";
}
