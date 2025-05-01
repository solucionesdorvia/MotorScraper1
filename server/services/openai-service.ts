import OpenAI from 'openai';
import { InsertVehicle } from '../../shared/schema';

// Inicializamos el cliente de OpenAI con la clave API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class OpenAIService {
  
  /**
   * Mejora los términos de búsqueda para hacerlos más precisos
   */
  async enhanceSearchQuery(query: string): Promise<{ make: string; model: string; year?: string }> {
    // Mejoras especiales para modelos populares que se suelen buscar sin la marca
    const queryLower = query.toLowerCase();
    
    // Extraer el año si existe en la consulta (funciona para todos los casos)
    const yearMatch = queryLower.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[0] : undefined;
    
    // Ford Mustang
    if (queryLower.includes("mustang") && !queryLower.includes("ford")) {
      console.log(`Mejora especial: detectado Mustang sin marca Ford -> Añadiendo marca Ford`);
      return {
        make: "Ford",
        model: "Mustang",
        year
      };
    }
    
    // Dodge Challenger
    if (queryLower.includes("challenger") && !queryLower.includes("dodge")) {
      console.log(`Mejora especial: detectado Challenger sin marca Dodge -> Añadiendo marca Dodge`);
      return {
        make: "Dodge",
        model: "Challenger",
        year
      };
    }
    
    // Chevrolet Camaro
    if (queryLower.includes("camaro") && !queryLower.includes("chevrolet") && !queryLower.includes("chevy")) {
      console.log(`Mejora especial: detectado Camaro sin marca Chevrolet -> Añadiendo marca Chevrolet`);
      return {
        make: "Chevrolet",
        model: "Camaro",
        year
      };
    }
    
    // Chevrolet Corvette
    if (queryLower.includes("corvette") && !queryLower.includes("chevrolet") && !queryLower.includes("chevy")) {
      console.log(`Mejora especial: detectado Corvette sin marca Chevrolet -> Añadiendo marca Chevrolet`);
      return {
        make: "Chevrolet",
        model: "Corvette",
        year
      };
    }
    
    try {
      console.log(`Mejorando consulta de búsqueda: "${query}"`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // El modelo más reciente de OpenAI
        messages: [
          {
            role: "system",
            content: "Eres un asistente especializado en extraer información estructurada sobre automóviles a partir de consultas de búsqueda."
          },
          {
            role: "user",
            content: `Analiza esta consulta de búsqueda: "${query}". Identifica la marca, modelo y año del vehículo si están presentes. Responde en formato JSON con los campos 'make', 'model' y 'year'. El campo 'year' debe ser opcional. Si la consulta incluye términos que no son relevantes para coches clásicos (como 'repuestos', 'piezas', etc.), exclúyelos de tu análisis.`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const enhancedQuery = JSON.parse(response.choices[0].message.content || '{}');
      console.log('Consulta mejorada:', enhancedQuery);
      
      return enhancedQuery;
    } catch (error) {
      console.error('Error al mejorar la consulta con OpenAI:', error);
      // En caso de error, devolvemos la consulta original dividida en palabras
      const queryParts = query.split(' ').filter(p => p.trim() !== '');
      return {
        make: queryParts[0] || '',
        model: queryParts.slice(1).join(' ') || ''
      };
    }
  }
  
  /**
   * Filtra vehículos para eliminar repuestos o artículos que no sean autos
   */
  async filterNonVehicles(vehicles: InsertVehicle[]): Promise<InsertVehicle[]> {
    if (vehicles.length === 0) return vehicles;
    
    try {
      console.log(`Filtrando ${vehicles.length} resultados para eliminar no-vehículos...`);
      
      // Preparamos los datos para enviar a OpenAI
      const vehicleTitles = vehicles.map(v => v.title);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Eres un experto en automóviles clásicos y subastas de vehículos. Tu tarea es identificar qué listados corresponden a automóviles completos y cuáles son repuestos, accesorios u otros artículos que no son vehículos completos."
          },
          {
            role: "user",
            content: `Analiza estos títulos de listados y determina cuáles corresponden a vehículos completos y cuáles a repuestos o accesorios. Responde con un array de índices (comenzando desde 0) que representen solamente los listados que son vehículos completos. Proporciona tu respuesta en formato JSON.
            
            Títulos: ${JSON.stringify(vehicleTitles)}
            
            Ejemplos de repuestos (a excluir): llantas, ruedas, motores sueltos, carburadores, emblemas, etc.
            Ejemplos de vehículos (a incluir): cualquier coche completo, incluso si necesita restauración.
            `
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      const validIndices = result.indices || [];
      
      console.log(`Indices de vehículos válidos: ${validIndices.join(', ')}`);
      
      // Filtramos los vehículos basados en los índices devueltos
      const filteredVehicles = validIndices.map((index: number) => vehicles[index]);
      
      console.log(`Filtrados ${vehicles.length - filteredVehicles.length} no-vehículos`);
      return filteredVehicles;
    } catch (error) {
      console.error('Error al filtrar no-vehículos con OpenAI:', error);
      // En caso de error, devolvemos los vehículos originales
      return vehicles;
    }
  }
}

// Exportamos una instancia para ser utilizada en toda la aplicación
export const openAIService = new OpenAIService();
