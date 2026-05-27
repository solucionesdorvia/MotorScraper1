/**
 * Reconocimiento de vehículo por foto usando OpenAI Vision (gpt-4o).
 *
 * El cliente sube una imagen (multipart/form-data, campo "image").
 * Se envía como data URL base64 al modelo y se le pide que identifique
 * make/model/year/variante en formato JSON estructurado.
 *
 * Costo aprox: $0.01-0.04 por imagen según tamaño (gpt-4o tier).
 * Si hay abuso considerar rate limiting en routes.ts.
 */
import OpenAI from 'openai';
import { categorizeVehicle } from './categorize';
import type { VehicleCategory } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PhotoRecognitionResult {
  make: string | null;
  model: string | null;
  year: number | null;
  variant: string | null;
  category: VehicleCategory | null;
  confidence: number; // 0..1
  rawNotes?: string;
}

const SYSTEM_PROMPT = `Sos un asistente experto en identificación de vehículos para ClasicAR, una plataforma argentina de importación.
Te muestran una foto. Identificá el vehículo lo mejor posible y devolvé EXCLUSIVAMENTE un JSON válido sin texto extra.
Schema requerido:
{
  "make": string | null,         // marca, ej "Ford", "BYD", "Porsche"
  "model": string | null,        // modelo específico, ej "Mustang", "Dolphin", "911"
  "year": integer | null,        // año estimado, null si no se puede inferir
  "variant": string | null,      // versión/trim, ej "GT", "Carrera S", "Premium"
  "confidence": number,          // 0..1 — qué tan seguro estás
  "rawNotes": string             // 1-2 frases con lo que ves (color, estado, contexto)
}
Si NO ves un vehículo, devolvé make/model/year/variant en null y confidence 0.`;

export async function recognizeVehicleFromPhoto(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<PhotoRecognitionResult> {
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identificá este vehículo y devolvé el JSON.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  });

  const raw = response.choices[0]?.message?.content || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const make = typeof parsed.make === 'string' ? parsed.make : null;
  const model = typeof parsed.model === 'string' ? parsed.model : null;
  const year = typeof parsed.year === 'number' ? parsed.year : null;
  const variant = typeof parsed.variant === 'string' ? parsed.variant : null;
  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
  const rawNotes = typeof parsed.rawNotes === 'string' ? parsed.rawNotes : undefined;

  // Categorizamos también — útil para la UI y para prefiltrar /api/search posterior
  const category = make || model
    ? categorizeVehicle({
        year: year ?? undefined,
        title: [make, model, variant].filter(Boolean).join(' '),
        make: make ?? undefined,
      })
    : null;

  return { make, model, year, variant, category, confidence, rawNotes };
}
