/**
 * Scraper con navegación real para Bring a Trailer
 * Utiliza Puppeteer para navegar por el sitio y extraer datos de subastas activas
 * 
 * IMPORTANTE: Este scraper utiliza un navegador headless real para acceder
 * a Bring a Trailer y extraer datos de subastas activas en tiempo real.
 */
import { type InsertVehicle } from "@shared/schema";
import puppeteer from 'puppeteer';

/**
 * Extrae subastas activas de Bring a Trailer en tiempo real usando navegación real
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailerRealTime(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`🔍 Iniciando scraper en tiempo real para Bring a Trailer - Búsqueda: ${make} ${model} ${year || ''}`);
  
  // Array para almacenar los vehículos encontrados
  const vehicles: InsertVehicle[] = [];
  
  // Construir URL de búsqueda
  const searchQuery = [make, model, year].filter(Boolean).join('+');
  const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
  
  console.log(`📡 Accediendo a URL: ${searchUrl}`);
  
  let browser;
  try {
    // Lanzar navegador headless
    console.log(`🌐 Iniciando navegador headless...`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Crear una nueva página
    const page = await browser.newPage();
    
    // Configurar timeout más largo para dar tiempo a que la página cargue
    page.setDefaultNavigationTimeout(60000);
    
    // Navegar a la URL de búsqueda
    console.log(`⏳ Navegando a Bring a Trailer y esperando a que la página cargue...`);
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2'
    });
    
    // Esperar a que los elementos de listado se carguen
    console.log(`⏳ Esperando a que se carguen los listados de subastas...`);
    await page.waitForSelector('.listings-container', { timeout: 30000 }).catch(() => {
      console.log(`⚠️ Tiempo de espera agotado al buscar contenedor de listados`);
    });
    
    // Esperar tiempo adicional para asegurar que Knockout.js haya cargado los datos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extraer contenedor de subastas actuales
    console.log(`🔎 Buscando contenedor de subastas actuales...`);
    const auctionsContainer = await page.$('#auctions-current-container');
    
    if (!auctionsContainer) {
      console.log(`⚠️ No se encontró el contenedor de subastas actuales`);
      return [];
    }
    
    // Extraer listados de autos
    console.log(`🔎 Extrayendo listados de subastas activas...`);
    const listingCards = await auctionsContainer.$$('.listing-card');
    
    if (!listingCards || listingCards.length === 0) {
      console.log(`⚠️ No se encontraron tarjetas de listado`);
      return [];
    }
    
    console.log(`✅ Encontradas ${listingCards.length} tarjetas de listado`);
    
    // Procesar cada tarjeta de listado
    for (let i = 0; i < listingCards.length; i++) {
      const card = listingCards[i];
      
      // Extraer título
      const titleElement = await card.$('h3');
      let title = "";
      if (titleElement) {
        const titleText = await page.evaluate(el => el.textContent, titleElement);
        if (titleText) {
          title = titleText;
        }
      }
      
      // Verificar si el título es relevante para la búsqueda
      if (!isRelevant(title, make, model, year)) {
        console.log(`⚠️ Listado no relevante: ${title}`);
        continue;
      }
      
      console.log(`✅ Listado relevante encontrado: ${title}`);
      
      // Extraer URL de la página de subasta
      const href = await page.evaluate(el => el.getAttribute('href'), card);
      
      // Extraer imagen
      const imgElement = await card.$('.thumbnail img');
      let imageUrl = "";
      if (imgElement) {
        const imgSrc = await page.evaluate(el => el.getAttribute('src'), imgElement);
        if (imgSrc) {
          imageUrl = imgSrc;
        }
      }
      
      // Extraer puja actual
      const bidElement = await card.$('.bidding-bid .bid-formatted');
      let bidText = "";
      let currentBid: number | null = null;
      if (bidElement) {
        const bidTextContent = await page.evaluate(el => el.textContent, bidElement);
        if (bidTextContent) {
          bidText = bidTextContent;
        }
        // Extraer valor numérico de la puja
        const bidMatch = bidText.match(/\$([0-9,]+)/);
        if (bidMatch && bidMatch[1]) {
          currentBid = parseInt(bidMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      // Extraer tiempo restante
      const countdownElement = await card.$('.bidding-countdown .countdown-text');
      let endsIn: string | null = null;
      if (countdownElement) {
        endsIn = await page.evaluate(el => el.textContent, countdownElement);
      }
      
      // Extraer estado 'No Reserve'
      const noReserveElement = await card.$('.item-tag-noreserve');
      const hasNoReserve = !!noReserveElement;
      
      // Extraer información adicional del título
      const { extractedYear, transmission, bodyType } = extractInfoFromTitle(title);
      
      // Crear objeto de vehículo
      const vehicle: InsertVehicle = {
        title: title,
        make: make,
        model: model,
        source: "bringatrailer",
        sourceUrl: href || `https://bringatrailer.com/search/${searchQuery}`,
        imageUrl: imageUrl,
        location: "Estados Unidos", // BaT es principalmente de EE.UU.
        price: currentBid, // El precio es la puja actual
        year: extractedYear || (year ? parseInt(year, 10) : null),
        mileage: null, // No disponible en la tarjeta de listado
        transmission: transmission,
        bodyType: bodyType,
        color: null, // No disponible en la tarjeta de listado
        fuelType: null, // No disponible en la tarjeta de listado
        vin: null, // No disponible en la tarjeta de listado
        dealerName: null, // No disponible en la tarjeta de listado
        hasDeals: hasNoReserve, // Usar "No Reserve" como indicador de ofertas
        isAuction: true, // BaT siempre es una subasta
        currentBid: currentBid,
        endsIn: endsIn
      };
      
      vehicles.push(vehicle);
    }
    
    console.log(`✅ Procesamiento completado: Encontrados ${vehicles.length} vehículos relevantes`);
    
  } catch (error) {
    console.error(`❌ Error al extraer datos de Bring a Trailer:`, error);
  } finally {
    // Cerrar navegador
    if (browser) {
      console.log(`🔒 Cerrando navegador...`);
      await browser.close();
    }
  }
  
  return vehicles;
}

/**
 * Determina si un título de subasta es relevante para los criterios de búsqueda
 */
function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  if (!title) return false;
  
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  // Verificar marca
  if (!titleLower.includes(makeLower)) {
    return false;
  }
  
  // Verificar modelo con más flexibilidad
  // Para modelos como "911", verificamos que esté presente como palabra completa
  if (modelLower.length <= 3) {
    // Para modelos cortos, buscar como palabra completa
    const modelRegex = new RegExp(`\\b${modelLower}\\b`);
    if (!modelRegex.test(titleLower)) {
      return false;
    }
  } else {
    // Para modelos más largos, es suficiente con que esté incluido
    if (!titleLower.includes(modelLower)) {
      return false;
    }
  }
  
  // Verificar año si se proporciona
  if (year) {
    return titleLower.includes(year);
  }
  
  return true;
}

/**
 * Extrae información adicional del título (año, transmisión, tipo de carrocería)
 */
function extractInfoFromTitle(
  title: string
): { extractedYear: number | null; transmission: string | null; bodyType: string | null } {
  const result = {
    extractedYear: null as number | null,
    transmission: null as string | null,
    bodyType: null as string | null
  };
  
  // Extraer año
  const yearMatch = title.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    result.extractedYear = parseInt(yearMatch[0], 10);
  }
  
  // Extraer tipo de transmisión
  if (title.includes('4-Speed') || title.includes('4-speed') || title.includes('Four-Speed')) {
    result.transmission = 'Manual 4-Velocidades';
  } else if (title.includes('5-Speed') || title.includes('5-speed') || title.includes('Five-Speed')) {
    result.transmission = 'Manual 5-Velocidades';
  } else if (title.includes('6-Speed') || title.includes('6-speed') || title.includes('Six-Speed')) {
    result.transmission = 'Manual 6-Velocidades';
  } else if (title.includes('Manual')) {
    result.transmission = 'Manual';
  } else if (title.includes('Automatic')) {
    result.transmission = 'Automático';
  }
  
  // Extraer tipo de carrocería
  const bodyTypes = [
    { keywords: ['convertible', 'cabriolet', 'roadster', 'spyder', 'spider'], type: 'Convertible' },
    { keywords: ['coupe', 'coupé'], type: 'Coupe' },
    { keywords: ['sedan'], type: 'Sedan' },
    { keywords: ['hatchback'], type: 'Hatchback' },
    { keywords: ['wagon', 'estate', 'avant', 'touring'], type: 'Wagon' },
    { keywords: ['suv', 'crossover'], type: 'SUV' },
    { keywords: ['pickup', 'truck'], type: 'Pickup' },
    { keywords: ['fastback'], type: 'Fastback' },
    { keywords: ['targa'], type: 'Targa' }
  ];
  
  const titleLower = title.toLowerCase();
  for (const body of bodyTypes) {
    for (const keyword of body.keywords) {
      if (titleLower.includes(keyword)) {
        result.bodyType = body.type;
        break;
      }
    }
    if (result.bodyType) break;
  }
  
  return result;
}