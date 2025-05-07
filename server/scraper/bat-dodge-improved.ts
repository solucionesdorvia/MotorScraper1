import axios from 'axios';
import { load } from 'cheerio';
import { InsertVehicle } from '@shared/schema';

/**
 * SCRAPER ESPECIALIZADO PARA MODELOS DODGE - VERSIÓN MEJORADA
 * 
 * Esta versión:
 * 1. Usa un enfoque múltiple para extraer datos de BaT
 * 2. Tiene mayor robustez frente a cambios en la estructura HTML
 * 3. Extrae ÚNICAMENTE subastas activas
 */
export async function scrapeBringATrailerDodge(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`🔎 Buscando con scraper ESPECIALIZADO para Dodge: ${make} ${model} ${year || ''}`);
  
  const vehicles: InsertVehicle[] = [];
  let success = false;
  
  // URL a intentar (en orden de prioridad)
  const urls = [
    // URL específica para subastas activas
    `https://bringatrailer.com/auctions/?search=${encodeURIComponent([make, model, year].filter(Boolean).join('+'))}`,
    
    // URL alternativa para búsqueda general
    `https://bringatrailer.com/search/?s=${encodeURIComponent([make, model, year].filter(Boolean).join('+'))}`,
    
    // URL específica para subastas sin filtros en caso de búsqueda de Dodge Challenger
    ...(make.toLowerCase() === 'dodge' && model.toLowerCase() === 'challenger' ? ['https://bringatrailer.com/auctions/'] : []),
    
    // URL específica para Dodge Challenger/Charger (solo como última opción)
    ...(make.toLowerCase() === 'dodge' && ['challenger', 'charger'].includes(model.toLowerCase()) ? 
        [`https://bringatrailer.com/dodge/${model.toLowerCase()}/`] : [])
  ];
  
  for (const url of urls) {
    if (vehicles.length > 0) {
      break; // Ya tenemos resultados, no necesitamos seguir intentando
    }
    
    try {
      console.log(`Intentando URL: ${url}`);
      
      // Usar configuración mejorada
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 8000 // 8 segundos de timeout
      });
      
      if (response.status === 200 && response.data) {
        console.log(`✅ Obtenido HTML (${response.data.length} bytes) de ${url}`);
        
        try {
          // Extraer vehículos del HTML
          const foundVehicles = extractVehiclesFromHTML(response.data, make, model, year);
          
          // Solo tomar aquellos que son realmente relevantes
          const relevantVehicles = foundVehicles.filter(vehicle => {
            const titleLower = vehicle.title.toLowerCase();
            const makeLower = make.toLowerCase();
            const modelLower = model.toLowerCase();
            
            let isMatch = false;
            
            // Reglas especiales para Dodge Challenger
            if (makeLower === 'dodge' && modelLower === 'challenger') {
              isMatch = titleLower.includes('challenger');
            }
            // Reglas especiales para Dodge Charger
            else if (makeLower === 'dodge' && modelLower === 'charger') {
              isMatch = titleLower.includes('charger');
            }
            // Regla general
            else {
              isMatch = titleLower.includes(makeLower) && titleLower.includes(modelLower);
            }
            
            // Si se especificó un año, verificar coincidencia
            if (year && !titleLower.includes(year)) {
              isMatch = false;
            }
            
            return isMatch;
          });
          
          if (relevantVehicles.length > 0) {
            console.log(`✅ Encontrados ${relevantVehicles.length} vehículos relevantes en ${url}`);
            vehicles.push(...relevantVehicles);
            success = true;
          } else {
            console.log(`⚠️ No se encontraron vehículos relevantes para ${make} ${model} en ${url}`);
          }
        } catch (parseError) {
          console.error(`❌ Error al procesar HTML de ${url}: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error al obtener ${url}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  if (success) {
    console.log(`✅ Scraper Dodge: Encontrados ${vehicles.length} vehículos relevantes`);
  } else {
    console.log(`❌ Scraper Dodge: No se pudieron obtener resultados después de intentar ${urls.length} URLs`);
  }
  
  return vehicles;
}

/**
 * Extrae vehículos del HTML de BaT con soporte para diferentes estructuras
 */
function extractVehiclesFromHTML(html: string, make: string, model: string, year?: string): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = load(html);
  
  console.log(`Analizando HTML con selectores múltiples para encontrar subastas de ${make} ${model} ${year || ''}`);
  
  // Buscar todas las tarjetas de listado usando distintos selectores
  let cards = $();
  
  // Estrategia 1: Buscar en el contenedor específico de subastas
  const auctionsContainer = $('.listings-container.auctions-grid#auctions-current-container');
  if (auctionsContainer.length > 0) {
    const cardsInAuctions = auctionsContainer.find('a.listing-card');
    if (cardsInAuctions.length > 0) {
      console.log(`Encontradas ${cardsInAuctions.length} tarjetas en contenedor de subastas activas`);
      cards = cardsInAuctions;
    }
  }
  
  // Estrategia 2: Buscar en cualquier contenedor de listados
  if (cards.length === 0) {
    const cardsInGenericContainer = $('.listings-container a.listing-card');
    if (cardsInGenericContainer.length > 0) {
      console.log(`Encontradas ${cardsInGenericContainer.length} tarjetas en contenedores genéricos`);
      cards = cardsInGenericContainer;
    }
  }
  
  // Estrategia 3: Buscar tarjetas de listado en toda la página
  if (cards.length === 0) {
    console.log('⚠️ No se encontraron tarjetas en los contenedores específicos, buscando en toda la página');
    cards = $('a.listing-card');
  }
  
  // Estrategia 4: Buscar resultados de búsqueda generales
  if (cards.length === 0) {
    console.log('⚠️ No se encontraron tarjetas estándar, buscando resultados generales');
    cards = $('.search-result-items .listing-card, .search-results .auction-item, .search-results-loop a.tile, .search-result-live-listings a');
  }
  
  // Estrategia 5: Buscar cualquier enlace que parezca una tarjeta de auto
  if (cards.length === 0) {
    console.log('⚠️ Buscando cualquier enlace que contenga imágenes y texto');
    cards = $('a').filter(function() {
      return $(this).find('img').length > 0 && 
             ($(this).text().toLowerCase().includes('dodge') || 
              $(this).text().toLowerCase().includes('challenger') || 
              $(this).text().toLowerCase().includes('charger'));
    });
  }
  
  console.log(`Encontradas ${cards.length} tarjetas de listado en total`);
  
  // Procesar cada tarjeta
  cards.each(function(index, element) {
    try {
      const card = $(element);
      
      // Extraer URL del listado
      const url = card.attr('href') || '';
      
      // Extraer título usando diferentes selectores posibles
      let title = '';
      const h3 = card.find('h3');
      if (h3.length > 0) {
        title = h3.text().trim();
      } else {
        const h4 = card.find('h4, .item-title, .listing-title, .auction-title');
        if (h4.length > 0) {
          title = h4.text().trim();
        } else {
          // Última opción: intentar encontrar cualquier elemento que parezca un título
          const possibleTitle = card.find('strong, .title, .name').first();
          if (possibleTitle.length > 0) {
            title = possibleTitle.text().trim();
          }
        }
      }
      
      console.log(`Analizando listado #${index + 1}: "${title}" (${url})`);
      
      if (!title) {
        console.log('  ⚠️ Listado sin título, omitiendo');
        return;
      }
      
      // Verificar si es una subasta activa buscando indicadores específicos
      const hasActiveBidding = card.find('.item-bidding, .bidding-bid, .bid-formatted, .countdown-text, .countdown, .time-left').length > 0;
      const hasCountdown = card.find('.countdown-text, .countdown, progress').length > 0;
      
      // Omitir tarjetas que claramente no son subastas activas
      if (!hasActiveBidding && !hasCountdown) {
        console.log('  ⚠️ No parece ser una subasta activa, omitiendo');
        return;
      }
      
      // Extraer imagen con diferentes selectores posibles
      let imageUrl = '';
      const imgInThumbnail = card.find('.thumbnail img');
      if (imgInThumbnail.length > 0) {
        imageUrl = imgInThumbnail.attr('src') || '';
      } else {
        const anyImg = card.find('img');
        if (anyImg.length > 0) {
          imageUrl = anyImg.attr('src') || '';
        } else {
          const imgContainer = card.find('.image-container, .listing-image, .auction-image');
          if (imgContainer.length > 0) {
            const imgInContainer = imgContainer.find('img');
            if (imgInContainer.length > 0) {
              imageUrl = imgInContainer.attr('src') || '';
            } else {
              // Intentar encontrar un background-image
              const style = imgContainer.attr('style') || '';
              const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
              if (bgMatch) {
                imageUrl = bgMatch[1];
              }
            }
          }
        }
      }
      
      // Extraer descripción con diferentes selectores posibles
      let description = '';
      const excerpt = card.find('.item-excerpt, .description, .auction-excerpt');
      if (excerpt.length > 0) {
        description = excerpt.text().trim();
      }
      
      // Extraer precio actual (oferta) con diferentes selectores posibles
      let bidText = '';
      let currentBid = null;
      
      const bidFormatted = card.find('.bid-formatted, .current-bid, .price, .auction-price');
      if (bidFormatted.length > 0) {
        bidText = bidFormatted.text().trim();
        currentBid = extractPrice(bidText);
      } else {
        // Buscar cualquier texto que parezca un precio
        const possiblePriceElements = card.find('*').filter(function() {
          const text = $(this).text().trim();
          return /\$\d+|\d+\s*USD/i.test(text);
        });
        
        if (possiblePriceElements.length > 0) {
          bidText = possiblePriceElements.first().text().trim();
          currentBid = extractPrice(bidText);
        }
      }
      
      console.log(`  💰 Puja actual: ${bidText} (${currentBid || 'desconocido'})`);
      
      // Extraer tiempo restante con diferentes selectores posibles
      let timeRemaining = '';
      const countdownText = card.find('.countdown-text, .countdown, .time-left, .auction-end-time');
      if (countdownText.length > 0) {
        timeRemaining = countdownText.text().trim();
      } else {
        // Buscar cualquier texto que parezca un tiempo
        const possibleTimeElements = card.find('*').filter(function() {
          const text = $(this).text().trim();
          return /\d+d|\d+h|\d+m|days?|hours?|mins?|ending|ends/i.test(text);
        });
        
        if (possibleTimeElements.length > 0) {
          timeRemaining = possibleTimeElements.first().text().trim();
        }
      }
      
      console.log(`  ⏱️ Tiempo restante: ${timeRemaining}`);
      
      // Verificar si el título es relevante para la búsqueda
      // Para Dodge Challenger, aceptamos tanto "Dodge Challenger" como "Challenger" a secas
      let isRelevant = false;
      
      const titleLower = title.toLowerCase();
      const makeLower = make.toLowerCase();
      const modelLower = model.toLowerCase();
      
      if (makeLower === 'dodge' && modelLower === 'challenger') {
        if (titleLower.includes('dodge') && titleLower.includes('challenger')) {
          isRelevant = true;
        } else if (titleLower.includes('challenger')) {
          isRelevant = true;
        }
      } else if (makeLower === 'dodge' && modelLower === 'charger') {
        if (titleLower.includes('dodge') && titleLower.includes('charger')) {
          isRelevant = true;
        } else if (titleLower.includes('charger')) {
          isRelevant = true;
        }
      } else {
        // Para otros modelos
        isRelevant = titleLower.includes(makeLower) && titleLower.includes(modelLower);
      }
      
      // Si se especificó un año, verificar si el título contiene el año
      if (year && !titleLower.includes(year)) {
        isRelevant = false;
      }
      
      if (isRelevant) {
        // Crear objeto del vehículo
        const vehicle: InsertVehicle = {
          title,
          make,
          model,
          source: 'bringatrailer',
          sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
          imageUrl,
          year: extractYear(title) || (year ? parseInt(year) : null),
          price: currentBid || 0,
          isAuction: true,
          currentBid: currentBid || 0,
          endsIn: timeRemaining || 'En curso',
          transmission: extractTransmission(title) || extractTransmission(description),
          bodyType: extractBodyType(title) || extractBodyType(description),
          location: 'Estados Unidos',
          mileage: null,
          color: null,
          vin: null,
          fuelType: null,
          dealerName: null,
          hasDeals: false
        };
        
        vehicles.push(vehicle);
        console.log(`  ✅ Vehículo relevante añadido: "${title}"`);
      } else {
        console.log(`  ❌ Vehículo no relevante para ${make} ${model} ${year || ''}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error al procesar tarjeta: ${error.message}`);
      } else {
        console.error('Error desconocido al procesar tarjeta');
      }
    }
  });
  
  console.log(`Total: ${vehicles.length} vehículos relevantes encontrados en el HTML`);
  return vehicles;
}

/**
 * Extrae el precio del texto
 */
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Eliminar prefijos de moneda (USD, $, etc.)
  const cleanText = text.replace(/USD|\$|,/g, '').trim();
  
  // Buscar números en el texto
  const match = cleanText.match(/(\d+)/);
  
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  // Buscar años entre 1900 y 2025
  const match = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrae la transmisión del texto
 */
function extractTransmission(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('manual') || lowerText.includes('speed') || lowerText.includes('-speed')) {
    // Intentar extraer el número de velocidades
    const speedMatch = lowerText.match(/(\d)(?:-|\s)?speed/i);
    if (speedMatch) {
      return `Manual ${speedMatch[1]}-Velocidades`;
    }
    return 'Manual';
  }
  
  if (lowerText.includes('automatic') || lowerText.includes('auto') || lowerText.includes('automático') || lowerText.includes('torqueflit')) {
    return 'Automático';
  }
  
  return null;
}

/**
 * Extrae el tipo de carrocería del texto
 */
function extractBodyType(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('coupe')) {
    return 'Coupe';
  }
  
  if (lowerText.includes('sedan')) {
    return 'Sedan';
  }
  
  if (lowerText.includes('convertible')) {
    return 'Convertible';
  }
  
  if (lowerText.includes('fastback')) {
    return 'Fastback';
  }
  
  if (lowerText.includes('wagon') || lowerText.includes('estate')) {
    return 'Wagon';
  }
  
  if (lowerText.includes('suv')) {
    return 'SUV';
  }
  
  if (lowerText.includes('truck') || lowerText.includes('pickup')) {
    return 'Pickup';
  }
  
  return null;
}