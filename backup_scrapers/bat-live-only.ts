/**
 * SCRAPER EXCLUSIVO PARA SUBASTAS ACTIVAS (LIVE LISTINGS) DE BRING A TRAILER
 * 
 * Este scraper está diseñado para extraer ÚNICAMENTE los listados de la sección "Live Listings"
 * basándose en la estructura HTML exacta proporcionada por el usuario.
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { InsertVehicle } from "../../shared/schema";

/**
 * Extrae EXCLUSIVAMENTE las subastas activas (Live Listings) de Bring a Trailer
 */
export async function scrapeBringATrailerLiveOnly(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  try {
    console.log(`Buscando SOLO subastas ACTIVAS (Live Listings) para ${make} ${model} ${year || ""}`);
    const url = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0"
      }
    });

    const html = response.data;
    
    // Verificar si tenemos contenido HTML
    if (!html || html.length === 0) {
      console.log("No se pudo obtener HTML de Bring a Trailer");
      return [];
    }

    // Extraer SOLO la sección de Live Listings
    const liveListingsSection = extractLiveListingsSection(html);
    
    if (!liveListingsSection) {
      console.log("No se encontró la sección 'Live Listings' en la página");
      return [];
    }

    console.log("Sección 'Live Listings' encontrada, extrayendo subastas activas...");
    
    // Extraer vehículos de la sección Live Listings
    const liveVehicles = extractLiveVehicles(liveListingsSection, make, model, year);
    
    console.log(`Encontradas ${liveVehicles.length} subastas ACTIVAS para ${make} ${model} ${year || ""}`);
    
    return liveVehicles;
  } catch (error) {
    console.error("Error al obtener subastas activas de Bring a Trailer:", error);
    return [];
  }
}

/**
 * Extrae EXCLUSIVAMENTE la sección "Live Listings" del HTML completo
 * Esta es la sección que contiene SOLO las subastas activas
 */
function extractLiveListingsSection(html: string): string | null {
  try {
    const $ = cheerio.load(html);
    
    console.log("🔍 Buscando sección exclusiva de LIVE LISTINGS (subastas activas)...");
    
    // MÉTODO 1: Buscar por el ID específico que identifica la sección Live Listings
    // Este es el ID que aparece en el HTML proporcionado por el usuario
    const liveListingsSection = $('#search-result-live-listings');
    
    if (liveListingsSection.length > 0) {
      console.log("✅ Encontrada sección Live Listings por ID search-result-live-listings");
      return liveListingsSection.html();
    }
    
    // MÉTODO 2: Buscar por el encabezado "Live Listings" y luego su contenedor padre
    const liveListingsHeader = $('h2:contains("Live Listings")');
    
    if (liveListingsHeader.length > 0) {
      console.log("✅ Encontrado encabezado 'Live Listings', buscando contenedor asociado");
      // Buscar el div más cercano que podría contener las tarjetas de subastas activas
      const parentContainer = liveListingsHeader.closest('.search-results-section');
      
      if (parentContainer.length > 0) {
        console.log("✅ Encontrado contenedor padre para Live Listings");
        return parentContainer.html();
      }
    }
    
    // MÉTODO 3: Buscar directamente las tarjetas con indicadores de subasta activa
    console.log("⚠️ No se encontró contenedor específico, buscando tarjetas con indicadores de subasta activa");
    const activeCards = $('.listing-card:has(.item-bidding[data-bind*="visible: active"])');
    
    if (activeCards.length > 0) {
      console.log(`✅ Encontradas ${activeCards.length} tarjetas con indicadores de subasta activa`);
      // Devolver un div contenedor con todas las tarjetas activas
      return $('<div>').append(activeCards).html();
    }
    
    console.log("❌ No se encontró ninguna sección de Live Listings");
    return null;
  } catch (error) {
    console.error("Error al extraer sección Live Listings:", error);
    return null;
  }
}

/**
 * Extrae vehículos de la sección "Live Listings"
 * SOLO extrae aquellos que están con subastas activas actualmente
 */
function extractLiveVehicles(liveListingsHtml: string, make: string, model: string, year?: string): InsertVehicle[] {
  try {
    const vehicles: InsertVehicle[] = [];
    const $ = cheerio.load(liveListingsHtml);
    
    console.log("🔍 Buscando subastas ACTIVAS en el HTML de Live Listings...");
    
    // Buscar todas las tarjetas de listado dentro de Live Listings
    // Estructura exacta: <a class="listing-card bg-white-transparent" ...>
    const listingCards = $('.listing-card');
    
    console.log(`Encontradas ${listingCards.length} tarjetas de listado en Live Listings`);
    
    // Contador de tarjetas procesadas con 3 criterios de validación
    let cardsActive = 0;
    let cardsInactive = 0;
    
    listingCards.each((_, card) => {
      try {
        // Extraer los datos del vehículo
        const title = $(card).find('h3').text().trim();
        
        // VALIDACIÓN 1: Solo procesar si el título es relevante para la búsqueda
        if (!isRelevant(title, make, model, year)) {
          console.log(`❌ Título no relevante para búsqueda: "${title}"`);
          return;
        }
        
        // VALIDACIÓN 2: CRITERIO 1 - Debe tener sección de bidding ACTIVA
        // Estructura del HTML: <div class="item-bidding" data-bind="visible: active">
        const biddingElement = $(card).find('.item-bidding[data-bind*="visible: active"]');
        const hasBiddingSection = biddingElement.length > 0;
        
        if (!hasBiddingSection) {
          console.log(`❌ CRITERIO 1 fallido - Sin sección bidding activa: "${title}"`);
          cardsInactive++;
          return;
        }
        
        // VALIDACIÓN 3: CRITERIO 2 - Debe tener contador de tiempo restante
        // Estructura del HTML: <span class="countdown-text" data-bind="...">4 days</span>
        const countdownElement = $(card).find('.countdown-text');
        const hasCountdown = countdownElement.length > 0;
        
        if (!hasCountdown) {
          console.log(`❌ CRITERIO 2 fallido - Sin contador de tiempo: "${title}"`);
          cardsInactive++;
          return;
        }
        
        // VALIDACIÓN 4: CRITERIO 3 - NO debe tener texto de sold visible
        // Buscamos un div con clase item-results que NO tenga style="display:none"
        const resultsElement = $(card).find('.item-results[data-bind*="soldText"]');
        // Si tiene style="display: none;" entonces está oculto (lo que queremos)
        const isSoldHidden = resultsElement.length === 0 || 
                           resultsElement.attr('style')?.includes('display: none');
        
        if (!isSoldHidden) {
          console.log(`❌ CRITERIO 3 fallido - Tiene texto sold visible: "${title}"`);
          cardsInactive++;
          return;
        }
        
        // Si pasó todos los criterios, extraer resto de datos
        console.log(`✅ SUBASTA ACTIVA CONFIRMADA: "${title}"`);
        cardsActive++;
        
        // Extraer URL y URL de la imagen
        const url = $(card).attr('href') || '';
        const imageUrl = $(card).find('img').attr('src') || '';
        
        // Extraer precio (oferta actual) - está en el div.bid-formatted
        const priceText = $(card).find('.bid-formatted').text().trim();
        const price = extractPrice(priceText);
        
        // Extraer tiempo restante - está en el span.countdown-text
        const timeText = countdownElement.text().trim();
        
        // Extraer descripción - está en el div.item-excerpt
        const description = $(card).find('.item-excerpt').text().trim();
        
        console.log(`   Precio actual: ${priceText}`);
        console.log(`   Tiempo restante: ${timeText}`);
        
        // Crear objeto de vehículo con todos los datos relevantes
        const vehicle: InsertVehicle = {
          source: "bringatrailer",
          sourceUrl: url,
          imageUrl,
          title,
          price: price || 0,
          year: extractYear(title) || (year ? parseInt(year) : 0),
          make,
          model,
          mileage: null,
          bodyType: extractBodyType(title),
          fuelType: null,
          transmission: extractTransmission(title),
          dealerName: "Bring a Trailer",
          location: "USA",
          auctionData: {
            isAuction: true,
            currentBid: price || 0,
            endsIn: timeText || "En curso"
          }
        };
        
        vehicles.push(vehicle);
        console.log(`Añadido vehículo ACTIVO: ${title} - Precio: ${price || 0} - Tiempo: ${timeText}`);
      } catch (error) {
        console.error("Error al procesar tarjeta de listado:", error);
      }
    });
    
    console.log(`Resumen: Encontrados ${cardsActive} vehículos con subastas ACTIVAS / ${cardsInactive} inactivos de ${listingCards.length} tarjetas totales`);
    
    return vehicles;
  } catch (error) {
    console.error("Error al extraer vehículos de Live Listings:", error);
    return [];
  }
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildUrl(make: string, model: string, year?: string): string {
  let url = "https://bringatrailer.com/search/";
  
  // Normalizar make y model para URL
  const normalizedMake = encodeURIComponent(make.toLowerCase().trim());
  const normalizedModel = encodeURIComponent(model.toLowerCase().trim());
  
  // Agregar make y model a la URL
  url += `${normalizedMake}+${normalizedModel}/`;
  
  // Agregar año si está especificado
  if (year) {
    url += `?year_min=${year}&year_max=${year}`;
  }
  
  return url;
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerMake = make.toLowerCase().trim();
  const lowerModel = model.toLowerCase().trim();
  
  // Comprobar si contiene la marca y el modelo
  const hasMakeAndModel = lowerTitle.includes(lowerMake) && lowerTitle.includes(lowerModel);
  
  // Si se especificó un año, comprobar si también está en el título
  if (year && hasMakeAndModel) {
    return lowerTitle.includes(year);
  }
  
  return hasMakeAndModel;
}

/**
 * Extrae el precio del texto
 */
function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Extraer solo dígitos y puntos del texto
  const digitsOnly = text.replace(/[^0-9.]/g, '');
  const price = parseFloat(digitsOnly);
  
  return isNaN(price) ? null : price;
}

/**
 * Extrae el año del título
 */
function extractYear(text: string): number | null {
  if (!text) return null;
  
  // Buscar un patrón de año (19xx o 20xx)
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  
  if (yearMatch && yearMatch[1]) {
    return parseInt(yearMatch[1]);
  }
  
  return null;
}

/**
 * Extrae el motor del título
 */
function extractEngine(text: string): string | null {
  if (!text) return null;
  
  // Patrones comunes de motores
  const enginePatterns = [
    /\b\d+(\.\d+)?L?\b/i,                  // 5.0L, 5L, 3.5
    /\b\d+\s*[cv]c\b/i,                    // 302cc, 350cc
    /\b\d+\s*[cv][ui]\b/i,                 // 350ci, 302cu
    /\b\d+\s*HP\b/i,                       // 300HP
    /Coyote/i,                             // Coyote
    /EcoBoost/i,                           // EcoBoost
    /V\d+/i,                               // V8, V6
    /\bI\d+\b/i,                           // I4, I6
    /Flat[-\s]?\d+/i,                      // Flat-6, Flat6
    /\b\d+\s*Cylinder\b/i,                 // 8 Cylinder
    /Twin[-\s]?Turbo/i,                    // Twin-Turbo
    /Supercharged/i,                       // Supercharged
    /Turbocharged/i,                       // Turbocharged
    /\d+\s*-\s*Powered/i,                  // 302-Powered, 351-Powered
    /\d+\s*Cobra\s*Jet/i,                  // 428 Cobra Jet
    /\d+\s*Boss/i,                         // 302 Boss
    /\b\d+\s*Stroker\b/i                   // 347 Stroker
  ];
  
  for (const pattern of enginePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Extrae la transmisión del título
 */
function extractTransmission(text: string): string | null {
  if (!text) return null;
  
  // Patrones comunes de transmisiones
  if (text.match(/\b\d+[-\s]?Speed\b/i)) {
    return text.match(/\b\d+[-\s]?Speed\b/i)?.[0] || null;
  }
  
  if (text.includes("Manual")) return "Manual";
  if (text.includes("Automatic")) return "Automatic";
  if (text.includes("Auto")) return "Automatic";
  if (text.includes("CVT")) return "CVT";
  if (text.includes("DCT")) return "DCT";
  
  return null;
}

/**
 * Extrae el tipo de carrocería del título
 */
function extractBodyType(text: string): string | null {
  if (!text) return null;
  
  // Patrones comunes de carrocerías para Ford Mustang
  if (text.match(/\bFastback\b/i)) return "Fastback";
  if (text.match(/\bConvertible\b/i)) return "Convertible";
  if (text.match(/\bCoupe\b/i)) return "Coupe";
  if (text.match(/\bSports\s?Roof\b/i)) return "SportsRoof";
  if (text.match(/\bHardtop\b/i)) return "Hardtop";
  if (text.match(/\bGT\b/i)) return "GT";
  if (text.match(/\bMach\s*1\b/i)) return "Mach 1";
  if (text.match(/\bBoss\b/i)) return "Boss";
  if (text.match(/\bShelby\b/i)) return "Shelby";
  
  return null;
}

/**
 * Extrae el trim del título
 */
function extractTrim(text: string): string | null {
  if (!text) return null;
  
  // Patrones comunes de trims para Ford Mustang
  if (text.match(/\bGT500\b/i)) return "GT500";
  if (text.match(/\bGT350\b/i)) return "GT350";
  if (text.match(/\bGT\b/i)) return "GT";
  if (text.match(/\bMach\s*1\b/i)) return "Mach 1";
  if (text.match(/\bBoss\s*429\b/i)) return "Boss 429";
  if (text.match(/\bBoss\s*351\b/i)) return "Boss 351";
  if (text.match(/\bBoss\s*302\b/i)) return "Boss 302";
  if (text.match(/\bBoss\b/i)) return "Boss";
  if (text.match(/\bCobra\b/i)) return "Cobra";
  if (text.match(/\bShelby\b/i)) return "Shelby";
  if (text.match(/\bGTA\b/i)) return "GTA";
  if (text.match(/\bK-Code\b/i)) return "K-Code";
  if (text.match(/\bS-Code\b/i)) return "S-Code";
  
  return null;
}