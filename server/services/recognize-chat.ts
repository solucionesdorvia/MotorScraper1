/**
 * Reconocimiento vía chat conversacional. El usuario describe qué busca
 * en lenguaje natural y la IA recomienda hasta 5 vehículos.
 *
 * Mantiene un historial pasado por el cliente (sin persistencia server-side
 * en v1). El sistema prompt está orientado a recomendaciones para importar
 * a Argentina, considerando usos típicos (familiar, ciudad, off-road, etc.)
 * y categorías nuevas (eléctricos chinos, híbridos).
 */
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Recommendation {
  make: string;
  model: string;
  year?: number;
  reasoning: string;
}

export interface ChatRecognitionResult {
  reply: string;            // texto conversacional de respuesta
  recommendations: Recommendation[];
}

const SYSTEM_PROMPT = `Sos un asesor experto de ClasicAR — una plataforma que importa vehículos a Argentina junto con E-COMEX (cotización).
Tu rol: ayudar al usuario a descubrir vehículos que matchean su uso, presupuesto y preferencias.
Tenés que considerar:
- Clásicos (1900-1995): régimen argentino de vehículos de colección, 25+ años, aranceles ~60% FOB
- 0km importados: BYD, Tesla, marcas chinas, americanos modernos
- Eléctricos / híbridos: cupos arancelarios reducidos
- Comerciales / pickups

Cuando respondas, generá EXCLUSIVAMENTE un JSON válido con este schema:
{
  "reply": string,                       // 1-3 frases conversacionales en español rioplatense
  "recommendations": [                   // 1-5 items (0 si pediste más info)
    { "make": string, "model": string, "year": int | null, "reasoning": string }
  ]
}
Si necesitás más info para recomendar, devolvé recommendations vacío y haceé una pregunta en "reply".`;

export async function recognizeVehicleFromChat(
  message: string,
  history: ChatMessage[] = []
): Promise<ChatRecognitionResult> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 600,
  });

  const raw = response.choices[0]?.message?.content || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const reply = typeof parsed.reply === 'string' ? parsed.reply : 'Contame un poco más sobre qué buscás.';
  const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  const recommendations: Recommendation[] = recs
    .filter((r: any) => r && typeof r.make === 'string' && typeof r.model === 'string')
    .slice(0, 5)
    .map((r: any) => ({
      make: r.make,
      model: r.model,
      year: typeof r.year === 'number' ? r.year : undefined,
      reasoning: typeof r.reasoning === 'string' ? r.reasoning : '',
    }));

  return { reply, recommendations };
}
