/**
 * Decodificación de VIN usando la API pública gratuita de NHTSA (US).
 *
 * https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json
 *
 * Cobertura: muy completa para vehículos vendidos en US (incluso los importados
 * a Argentina vienen frecuentemente con VIN US). Cobertura parcial para
 * vehículos exclusivos de mercados europeos/asiáticos. Si el resultado viene
 * vacío informamos al usuario en el cliente.
 *
 * No requiere API key.
 */
import { categorizeVehicle } from './categorize';
import type { VehicleCategory } from '@shared/schema';

export interface VinDecodeResult {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  bodyType: string | null;
  fuelType: string | null;
  engine: string | null;
  manufacturer: string | null;
  category: VehicleCategory | null;
  errorMessage?: string;
}

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin';

interface NhtsaResult {
  Value: string | null;
  Variable: string;
}

function pick(results: NhtsaResult[], variable: string): string | null {
  const r = results.find(x => x.Variable === variable);
  if (!r || !r.Value || r.Value === 'Not Applicable' || r.Value === '') return null;
  return r.Value;
}

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const trimmed = vin.trim().toUpperCase();
  if (trimmed.length !== 17) {
    return {
      vin: trimmed,
      make: null, model: null, year: null,
      bodyType: null, fuelType: null, engine: null, manufacturer: null,
      category: null,
      errorMessage: 'El VIN debe tener exactamente 17 caracteres.',
    };
  }

  const url = `${NHTSA_BASE}/${encodeURIComponent(trimmed)}?format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'clasicar/1.0' },
  });

  if (!res.ok) {
    return {
      vin: trimmed,
      make: null, model: null, year: null,
      bodyType: null, fuelType: null, engine: null, manufacturer: null,
      category: null,
      errorMessage: `NHTSA respondió ${res.status}`,
    };
  }

  const data = await res.json() as { Results?: NhtsaResult[] };
  const results = data.Results || [];

  const make = pick(results, 'Make');
  const model = pick(results, 'Model');
  const yearStr = pick(results, 'Model Year');
  const year = yearStr ? parseInt(yearStr, 10) : null;
  const bodyType = pick(results, 'Body Class');
  const fuelType = pick(results, 'Fuel Type - Primary');
  const engine = pick(results, 'Engine Model') || pick(results, 'Displacement (L)');
  const manufacturer = pick(results, 'Manufacturer Name');

  // Si no obtuvimos make ni model, NHTSA no reconoció el VIN.
  if (!make && !model) {
    const errorCode = pick(results, 'Error Code');
    return {
      vin: trimmed,
      make: null, model: null, year: null,
      bodyType: null, fuelType: null, engine: null, manufacturer: null,
      category: null,
      errorMessage: errorCode
        ? `NHTSA no pudo decodificar este VIN (código ${errorCode}). Puede ser un vehículo de mercado europeo/asiático.`
        : 'NHTSA no devolvió datos para este VIN.',
    };
  }

  const category = categorizeVehicle({
    year: year ?? undefined,
    fuelType: fuelType ?? undefined,
    title: [make, model].filter(Boolean).join(' '),
    make: make ?? undefined,
    bodyType: bodyType ?? undefined,
  });

  return { vin: trimmed, make, model, year, bodyType, fuelType, engine, manufacturer, category };
}
