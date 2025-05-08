/**
 * Scraper con navegación real para Bring a Trailer utilizando Playwright
 * 
 * IMPORTANTE: Este scraper utiliza Playwright para simular un navegador real y extraer datos
 * dinámicos que solo están disponibles después de ejecutar JavaScript en el cliente.
 */
import { type InsertVehicle } from "@shared/schema";
import { chromium } from 'playwright';

/**
 * Extrae subastas activas de Bring a Trailer en tiempo real
 * 
 * @param make - Marca del vehículo (ej: 'ford')
 * @param model - Modelo del vehículo (ej: 'mustang')
 * @param year - Año del vehículo (opcional)
 * @returns Array de vehículos encontrados
 */
export async function scrapeBringATrailerWithPlaywright(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  let browser = null;
  
  try {
    console.log(`🔍 Iniciando scraper con Playwright para Bring a Trailer - Búsqueda: ${make} ${model} ${year || ''}`);
    
    // Array para almacenar los vehículos encontrados
    const vehicles: InsertVehicle[] = [];
    
    // Construir URL de búsqueda
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
    
    console.log(`📡 Accediendo a URL: ${searchUrl}`);
    
    // Lanzar navegador headless con Playwright (sin instalar)
    console.log(`🌐 Iniciando Playwright sin navegador instalado...`);
    
    // Intentamos conectarnos a un navegador remoto (ya que no podemos instalar localmente)
    const browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;
    if (!browserWSEndpoint) {
      console.log(`⚠️ No hay endpoint de navegador remoto configurado, usando navegador simulado`);
      
      // En este punto podríamos intentar simular algunas respuestas, pero no lo haremos
      // ya que necesitamos datos reales y actuales
      console.log(`⚠️ Cancelando extracción ya que necesitamos un navegador real`);
      return [];
    }
    
    // Conectarnos al navegador remoto
    console.log(`🔗 Conectando a navegador remoto: ${browserWSEndpoint}`);
    browser = await chromium.connect(browserWSEndpoint);
    
    // Crear una nueva página
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    // Configurar timeout más largo para dar tiempo a que la página cargue
    page.setDefaultTimeout(60000);
    
    // Navegar a la URL de búsqueda
    console.log(`⏳ Navegando a Bring a Trailer...`);
    await page.goto(searchUrl);
    
    // Esperar a que la página se cargue
    console.log(`⏳ Esperando a que la página cargue completamente...`);
    await page.waitForLoadState('networkidle');
    
    // Esperar tiempo adicional para que se ejecute Knockout.js
    console.log(`⏳ Esperando a que se ejecute JavaScript en la página...`);
    await page.waitForTimeout(5000);
    
    // Extraer títulos de las subastas
    console.log(`🔎 Buscando contenedor de subastas actuales...`);
    
    const auctionsContainerHandle = await page.$('#auctions-current-container');
    if (!auctionsContainerHandle) {
      console.log(`⚠️ No se encontró el contenedor de subastas actuales`);
      return [];
    }
    
    // Extraer tarjetas de listado
    const listingCardsHandles = await auctionsContainerHandle.$$('.listing-card');
    if (!listingCardsHandles || listingCardsHandles.length === 0) {
      console.log(`⚠️ No se encontraron tarjetas de listado`);
      return [];
    }
    
    console.log(`✅ Encontradas ${listingCardsHandles.length} tarjetas de listado`);
    
    // Procesar cada tarjeta de listado
    for (const cardHandle of listingCardsHandles) {
      // Extraer título
      const titleHandle = await cardHandle.$('h3');
      let title = "";
      if (titleHandle) {
        title = await titleHandle.textContent() || "";
      }
      
      // Verificar relevancia
      if (!isRelevant(title, make, model, year)) {
        console.log(`⚠️ Listado no relevante: ${title}`);
        continue;
      }
      
      console.log(`✅ Listado relevante encontrado: ${title}`);
      
      // URL
      let href = await cardHandle.getAttribute('href') || "";
      
      // Imagen
      const imgHandle = await cardHandle.$('.thumbnail img');
      let imageUrl = "";
      if (imgHandle) {
        imageUrl = await imgHandle.getAttribute('src') || "";
      }
      
      // Puja actual
      const bidHandle = await cardHandle.$('.bidding-bid .bid-formatted');
      let currentBid: number | null = null;
      if (bidHandle) {
        const bidText = await bidHandle.textContent() || "";
        const bidMatch = bidText.match(/\$([0-9,]+)/);
        if (bidMatch && bidMatch[1]) {
          currentBid = parseInt(bidMatch[1].replace(/,/g, ''), 10);
        }
      }
      
      // Tiempo restante
      const countdownHandle = await cardHandle.$('.bidding-countdown .countdown-text');
      let endsIn: string | null = null;
      if (countdownHandle) {
        endsIn = await countdownHandle.textContent() || null;
      }
      
      // Estado "No Reserve"
      const noReserveHandle = await cardHandle.$('.item-tag-noreserve');
      const hasNoReserve = !!noReserveHandle;
      
      // Extraer información adicional del título
      const { extractedYear, transmission, bodyType } = extractInfoFromTitle(title);
      
      // Crear objeto de vehículo
      const vehicle: InsertVehicle = {
        title: title,
        make: make,
        model: model,
        price: currentBid,
        year: extractedYear || (year ? parseInt(year, 10) : null),
        mileage: null,
        transmission: transmission,
        bodyType: bodyType,
        color: null,
        fuelType: null,
        location: "Estados Unidos",
        vin: null,
        dealerName: null,
        source: "bringatrailer",
        sourceUrl: href || `https://bringatrailer.com/search/${searchQuery}`,
        imageUrl: imageUrl,
        hasDeals: hasNoReserve,
        isAuction: true,
        currentBid: currentBid,
        endsIn: endsIn
      };
      
      console.log(`✅ Vehículo procesado: ${vehicle.title} (Puja: $${vehicle.price}, Tiempo: ${vehicle.endsIn})`);
      vehicles.push(vehicle);
    }
    
    console.log(`✅ Procesamiento completado: Encontrados ${vehicles.length} vehículos relevantes`);
    return vehicles;
    
  } catch (error) {
    console.error(`❌ Error al extraer datos de Bring a Trailer con Playwright:`, error);
    return [];
  } finally {
    // Cerrar navegador si existe
    if (browser) {
      console.log(`🔒 Cerrando navegador...`);
      await browser.close();
    }
  }
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