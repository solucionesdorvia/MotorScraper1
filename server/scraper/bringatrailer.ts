/**
 * Scraper para Bring a Trailer - sitio premium de subastas para vehículos de colección
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

// Ya no usamos generador de muestras
// La siguiente función está comentada y no se usa más
/*
function generateSampleVehicles(make: string, model: string, year?: string): InsertVehicle[] | null {
  // Normalizar marca y modelo para comparación
  const normalizedMake = make.toLowerCase();
  const normalizedModel = model.toLowerCase();
  const yearNum = year ? parseInt(year) : null;
  
  // Ford Mustang - verificamos cualquier petición de Mustang
  if (normalizedMake === 'mustang' || 
      (normalizedMake === 'ford' && normalizedModel === 'mustang')) {
    
    // Para cada año popular de Mustang generamos resultados específicos
    // pero si el año no está en nuestro catálogo, generamos resultados genéricos
    
    // Determinamos el año que mostraremos - el año solicitado o un año por defecto
    let mustangYear = yearNum || 1967; // Default a 1967 si no hay año especificado
    let yearLabel = yearNum ? yearNum.toString() : "Clásico";
    
    // Configuraciones para diferentes años de Mustang
    let mustangTitle1, mustangTitle2, mustangSubtitle1, mustangSubtitle2;
    let mustangPrice1, mustangPrice2, mustangEndTime1, mustangEndTime2;
    let mustangBody1, mustangBody2;
    let mustangColor1, mustangColor2;
    
    if (mustangYear >= 1964 && mustangYear <= 1968) {
      // Primera generación
      mustangTitle1 = `${yearLabel} Ford Mustang Fastback V8`;  
      mustangTitle2 = `${yearLabel} Ford Mustang Convertible 289`;
      mustangSubtitle1 = "Restaurado";
      mustangSubtitle2 = "Original";
      mustangBody1 = "Fastback";
      mustangBody2 = "Convertible";
      mustangColor1 = "Red";
      mustangColor2 = "Blue";
    } else if (mustangYear >= 1969 && mustangYear <= 1973) {
      // Segunda generación
      mustangTitle1 = `${yearLabel} Ford Mustang Boss 429`;  
      mustangTitle2 = `${yearLabel} Ford Mustang Mach 1 428 Cobra Jet`;  
      mustangSubtitle1 = "Muscle Car de Colección";
      mustangSubtitle2 = "Deportivo Clásico";
      mustangBody1 = "Fastback";
      mustangBody2 = "Fastback";
      mustangColor1 = "Black";
      mustangColor2 = "Red";
    } else {
      // Otros años - código genérico
      mustangTitle1 = `${yearLabel} Ford Mustang GT`;  
      mustangTitle2 = `${yearLabel} Ford Mustang Premium`;  
      mustangSubtitle1 = "Excelente Estado";
      mustangSubtitle2 = "Completamente Restaurado";
      mustangBody1 = "Coupe";
      mustangBody2 = "Coupe";
      mustangColor1 = "Black";
      mustangColor2 = "Silver";
    }
    
    // Generamos precios y tiempos aleatorios pero realistas
    mustangPrice1 = Math.floor(65000 + Math.random() * 35000);
    mustangPrice2 = Math.floor(45000 + Math.random() * 35000);
    
    // Tiempos de finalización de subasta
    const timeOptions = ["12 hours", "1:55:33", "2 days", "3 days", "4 days"];
    mustangEndTime1 = timeOptions[Math.floor(Math.random() * 3)];
    mustangEndTime2 = timeOptions[Math.floor(Math.random() * 3) + 2];
    
    // URL base de Bring a Trailer para Mustang
    const baseUrl = "https://bringatrailer.com/ford/mustang/";
    
    console.log(`Generando resultados de Mustang para el año ${yearLabel}`);
    
    const vehicles: InsertVehicle[] = [
      {
        title: mustangTitle1,
        make: "Ford",
        model: "Mustang",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+ford+mustang`,
        imageUrl: "https://static1.hotcarsimages.com/wordpress/wp-content/uploads/2020/06/600hp-1967-Mustang.jpg",
        year: mustangYear,
        price: mustangPrice1,
        isAuction: true,
        currentBid: mustangPrice1,
        endsIn: mustangEndTime1,
        transmission: "Manual",
        bodyType: mustangBody1,
        location: "Estados Unidos",
        mileage: Math.floor(10000 + Math.random() * 50000),
        color: mustangColor1,
        vin: `${mustangYear.toString().substring(2)}F02Z${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      },
      {
        title: mustangTitle2,
        make: "Ford",
        model: "Mustang",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+ford+mustang+${mustangSubtitle2.toLowerCase()}`,
        imageUrl: "https://cdn1.mecum.com/auctions/fl0121/fl0121-445506/images/01-1609173173248@2x.jpg",
        year: mustangYear,
        price: mustangPrice2,
        isAuction: true,
        currentBid: mustangPrice2,
        endsIn: mustangEndTime2,
        transmission: "Manual",
        bodyType: mustangBody2,
        location: "Estados Unidos",
        mileage: Math.floor(20000 + Math.random() * 40000),
        color: mustangColor2,
        vin: `${mustangYear.toString().substring(2)}F07R${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      }
    ];

    console.log(`Generados ${vehicles.length} vehículos Mustang ${yearLabel}`);
    return vehicles;
  }
  
  // Dodge Challenger
  if (normalizedMake === 'challenger' || 
      (normalizedMake === 'dodge' && normalizedModel === 'challenger')) {
      
    // Determinamos el año que mostraremos
    let challengerYear = yearNum || 1970; // Default a 1970 si no hay año
    let yearLabel = yearNum ? yearNum.toString() : "Clásico";
    
    // URL base de Bring a Trailer para Challenger
    const baseUrl = "https://bringatrailer.com/dodge/challenger/";
    
    console.log(`Generando resultados de Challenger para el año ${yearLabel}`);
    
    const vehicles: InsertVehicle[] = [
      {
        title: `${yearLabel} Dodge Challenger R/T Hemi`,
        make: "Dodge",
        model: "Challenger",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+dodge+challenger+rt`,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/1970_Hemi_Dodge_Challenger_RT.jpg",
        year: challengerYear,
        price: 85000 + Math.floor(Math.random() * 20000),
        isAuction: true,
        currentBid: 85000 + Math.floor(Math.random() * 20000),
        endsIn: "2 days",
        transmission: "Manual",
        bodyType: "Coupe",
        location: "Estados Unidos",
        mileage: 35000 + Math.floor(Math.random() * 15000),
        color: "Orange",
        vin: `JS23R0B${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      },
      {
        title: `${yearLabel} Dodge Challenger T/A 340 Six Pack`,
        make: "Dodge",
        model: "Challenger",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+dodge+challenger+ta`,
        imageUrl: "https://hips.hearstapps.com/hmg-prod/images/1970-dodge-challenger-r-t-front-6-1595951270.jpg",
        year: challengerYear,
        price: 90000 + Math.floor(Math.random() * 15000),
        isAuction: true,
        currentBid: 90000 + Math.floor(Math.random() * 15000),
        endsIn: "8 hours",
        transmission: "Manual",
        bodyType: "Coupe",
        location: "Estados Unidos",
        mileage: 40000 + Math.floor(Math.random() * 10000),
        color: "Yellow",
        vin: `JH23J0B${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      }
    ];

    console.log(`Generados ${vehicles.length} vehículos Challenger ${yearLabel}`);
    return vehicles;
  }
  
  // Chevrolet Camaro
  if (normalizedMake === 'camaro' || 
      (normalizedMake === 'chevrolet' && normalizedModel === 'camaro')) {
      
    // Determinamos el año que mostraremos
    let camaroYear = yearNum || 1969; // Default a 1969 si no hay año
    let yearLabel = yearNum ? yearNum.toString() : "Clásico";
    
    // URL base de Bring a Trailer para Camaro
    const baseUrl = "https://bringatrailer.com/chevrolet/camaro/";
    
    console.log(`Generando resultados de Camaro para el año ${yearLabel}`);
    
    const vehicles: InsertVehicle[] = [
      {
        title: `${yearLabel} Chevrolet Camaro Z/28`,
        make: "Chevrolet",
        model: "Camaro",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+chevrolet+camaro+z28`,
        imageUrl: "https://static1.hotcarsimages.com/wordpress/wp-content/uploads/2022/03/2013-Camaro-Z28.jpg",
        year: camaroYear,
        price: 78000 + Math.floor(Math.random() * 22000),
        isAuction: true,
        currentBid: 78000 + Math.floor(Math.random() * 22000),
        endsIn: "3 days",
        transmission: "Manual",
        bodyType: "Coupe",
        location: "Estados Unidos",
        mileage: 28000 + Math.floor(Math.random() * 10000),
        color: "Blue",
        vin: `12437N${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      },
      {
        title: `${yearLabel} Chevrolet Camaro SS 396`,
        make: "Chevrolet",
        model: "Camaro",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+chevrolet+camaro+ss`,
        imageUrl: "https://static.wikia.nocookie.net/hotwheels/images/2/27/68_COPO_Camaro_-_21_Muscle_6_-_2.jpg",
        year: camaroYear,
        price: 72000 + Math.floor(Math.random() * 18000),
        isAuction: true,
        currentBid: 72000 + Math.floor(Math.random() * 18000),
        endsIn: "10 hours",
        transmission: "Manual",
        bodyType: "Coupe",
        location: "Estados Unidos",
        mileage: 32000 + Math.floor(Math.random() * 15000),
        color: "Red",
        vin: `12437L${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      }
    ];

    console.log(`Generados ${vehicles.length} vehículos Camaro ${yearLabel}`);
    return vehicles;
  }
  
  // Chevrolet Corvette
  if (normalizedMake === 'corvette' || 
      (normalizedMake === 'chevrolet' && normalizedModel === 'corvette')) {
      
    // Determinamos el año que mostraremos
    let corvetteYear = yearNum || 1963; // Default a 1963 si no hay año (Stingray clásico)
    let yearLabel = yearNum ? yearNum.toString() : "Clásico";
    
    // URL base de Bring a Trailer para Corvette
    const baseUrl = "https://bringatrailer.com/chevrolet/corvette/";
    
    console.log(`Generando resultados de Corvette para el año ${yearLabel}`);
    
    // Diferentes modelos según las épocas
    let corvetteModel1, corvetteModel2;
    if (corvetteYear >= 1963 && corvetteYear <= 1967) {
      corvetteModel1 = "Stingray Split Window";
      corvetteModel2 = "Stingray Convertible";
    } else if (corvetteYear >= 1968 && corvetteYear <= 1982) {
      corvetteModel1 = "Stingray Coupe";
      corvetteModel2 = "Convertible";
    } else {
      corvetteModel1 = "Coupe";
      corvetteModel2 = "Convertible";
    }
    
    const vehicles: InsertVehicle[] = [
      {
        title: `${yearLabel} Chevrolet Corvette ${corvetteModel1}`,
        make: "Chevrolet",
        model: "Corvette",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+chevrolet+corvette`,
        imageUrl: "https://www.corvsport.com/wp-content/uploads/2017/11/1963-Chevrolet-Corvette-C2-Stingray-Split-Window-Coupe.jpg",
        year: corvetteYear,
        price: 95000 + Math.floor(Math.random() * 30000),
        isAuction: true,
        currentBid: 95000 + Math.floor(Math.random() * 30000),
        endsIn: "1 day",
        transmission: "Manual",
        bodyType: "Coupe",
        location: "Estados Unidos",
        mileage: 15000 + Math.floor(Math.random() * 20000),
        color: "Blue",
        vin: `30837S${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      },
      {
        title: `${yearLabel} Chevrolet Corvette ${corvetteModel2}`,
        make: "Chevrolet",
        model: "Corvette",
        source: "bringatrailer",
        sourceUrl: `${baseUrl}?s=${yearLabel}+chevrolet+corvette+convertible`,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Chevrolet_Corvette_C3_Convertible_%28cropped%29.jpg/800px-Chevrolet_Corvette_C3_Convertible_%28cropped%29.jpg",
        year: corvetteYear,
        price: 105000 + Math.floor(Math.random() * 25000),
        isAuction: true,
        currentBid: 105000 + Math.floor(Math.random() * 25000),
        endsIn: "4 days",
        transmission: "Manual",
        bodyType: "Convertible",
        location: "Estados Unidos",
        mileage: 22000 + Math.floor(Math.random() * 18000),
        color: "Red",
        vin: `30837S${Math.floor(100000 + Math.random() * 900000)}`,
        fuelType: "Gasoline",
        dealerName: null,
        hasDeals: false
      }
    ];

    console.log(`Generados ${vehicles.length} vehículos Corvette ${yearLabel}`);
    return vehicles;
  }
  
  return null; // No tenemos datos de ejemplo para esta combinación
}

// Definimos y exportamos la función principal
export async function scrapeBringATrailer(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Iniciando scraping de Bring a Trailer para ${make} ${model} ${year || ''}`);
  
  try {
    // Construye la URL para la búsqueda
    const searchUrl = buildBringATrailerUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Realiza la solicitud HTTP para obtener los resultados de búsqueda
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error(`Error al obtener resultados de Bring a Trailer: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`HTML obtenido de Bring a Trailer: ${html.length} caracteres`);
    
    // Extrae vehículos del HTML
    const vehicles = extractVehicleListings(html, make, model, year);
    
    if (vehicles.length === 0) {
      console.log('No se encontraron vehículos en Bring a Trailer');
      return [];
    }
    
    return vehicles;
  } catch (error) {
    console.error('Error en el scraper de Bring a Trailer:', error);
    return [];
  }
}

/**
 * Extrae listados de vehículos del HTML de Bring a Trailer
 */
function extractVehicleListings(
  html: string,
  make: string,
  model: string,
  year?: string
): InsertVehicle[] {
  const vehicles: InsertVehicle[] = [];
  const $ = load(html);
  
  console.log('Analizando HTML de Bring a Trailer...');
  
  // Selecciona los elementos que contienen listados de vehículos activos
  // Buscamos primero en #search-result-live-listings que contiene SOLO las subastas activas
  const liveListings = $('#search-result-live-listings a.listing-card');
  console.log(`Encontradas ${liveListings.length} enlaces activos en #search-result-live-listings`);
  
  // Por si no encontramos todos los listados activos con el primer selector
  const liveListingsAlt = $('#search-result-listings a.listing-card');
  console.log(`Encontradas ${liveListingsAlt.length} enlaces activos en #search-result-listings`);
  
  // Combinamos todos los selectores para asegurar que encontramos todos los listados
  const searchResultListings = liveListings.length > 0 ? liveListings : liveListingsAlt;
  console.log(`Total de listados a procesar: ${searchResultListings.length}`);

  
  if (searchResultListings.length > 0) {
    searchResultListings.each(function(index: number, element: any) {
      try {
        // Extrae el título
        const title = $(element).find('h3').text().trim();
        if (!title) return; // Salta si no hay título
        
        console.log(`Encontrado título ${index + 1}: "${title}"`);
        
        // Solo procesa si el título es relevante para la búsqueda
        if (isRelevantListing(title, make, model, year)) {
          console.log(`Título relevante: "${title}"`);
          
          // Procesa la URL
          let sourceUrl = $(element).attr('href') || '';
          if (sourceUrl && !sourceUrl.startsWith('http')) {
            sourceUrl = `https://bringatrailer.com${sourceUrl}`;
          }
          
          // Procesa la imagen
          const imageUrl = $(element).find('.thumbnail img').attr('src') || '';
          
          // Procesa la oferta
          const bidDiv = $(element).find('.content-secondary .item-bidding');
          const currentBidText = bidDiv.find('.bid-formatted').text().trim();
          console.log(`Texto de oferta: "${currentBidText}"`);
          
          let currentBid = null;
          if (currentBidText) {
            // Busca patrones de precio: $69,500 o USD $69,500
            const priceMatch = currentBidText.match(/[\$]?\s*(\d[\d,\.]+)/);
            if (priceMatch && priceMatch[1]) {
              const cleanPrice = priceMatch[1].replace(/[^\d]/g, '');
              currentBid = parseInt(cleanPrice, 10);
              console.log(`Precio extraído: ${currentBid}`);
            }
          }
          
          // Procesa el tiempo restante
          const countdownSpan = bidDiv.find('.countdown-text');
          const endsInText = countdownSpan.text().trim();
          console.log(`Tiempo restante: "${endsInText}"`);
          const endsIn = endsInText || null;
          
          // Procesa el año
          const extractedYear = extractYear(title);
          
          // Procesa la descripción
          const description = $(element).find('.item-excerpt').text().trim() || null;
          
          // Procesa la ubicación
          let locationText = 'Estados Unidos';
          const countryName = $(element).find('.show-country-name').text().trim();
          if (countryName) {
            locationText = countryName === 'USA' ? 'Estados Unidos' : countryName;
          }
          
          // Procesa el tipo de carrocería
          let bodyType = null;
          const fullText = `${title} ${description || ''}`;
          
          if (fullText.toLowerCase().includes('fastback')) {
            bodyType = 'Fastback';
          } else if (fullText.toLowerCase().includes('coupe')) {
            bodyType = 'Coupe';
          } else if (fullText.toLowerCase().includes('convertible') || fullText.toLowerCase().includes('cabrio')) {
            bodyType = 'Convertible';
          } else if (fullText.toLowerCase().includes('sedan')) {
            bodyType = 'Sedan';
          }
          
          // Procesa la transmisión
          let transmission = null;
          if (fullText.toLowerCase().includes('manual') || fullText.toLowerCase().includes('speed')) {
            transmission = 'Manual';
          } else if (fullText.toLowerCase().includes('automatic') || fullText.toLowerCase().includes('auto')) {
            transmission = 'Automática';
          }
          
          // Verifica si la subasta está activa - criterio más estricto
          const isActiveAuction = !!endsIn && 
                                endsIn !== 'No disponible' &&
                                endsIn !== 'Terminado' && 
                                endsIn !== 'Completed' && 
                                !endsIn.toLowerCase().includes('sold') &&
                                !endsIn.toLowerCase().includes('ended') &&
                                (endsIn.includes('days') || 
                                 endsIn.includes('hours') || 
                                 endsIn.includes('mins') || 
                                 endsIn.includes(':') || 
                                 endsIn.includes('day') || 
                                 endsIn.includes('hour'));
          
          // Solo agregar si la subasta está activa
          if (isActiveAuction) {
            const vehicle: InsertVehicle = {
              title,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl,
              imageUrl,
              year: extractedYear,
              price: currentBid,
              isAuction: true,
              currentBid,
              endsIn,
              transmission,
              bodyType,
              location: locationText,
              mileage: null,
              color: null,
              vin: null,
              fuelType: null,
              dealerName: null,
              hasDeals: false
            };
            
            vehicles.push(vehicle);
            console.log(`Vehículo añadido: ${title} - ${currentBid}`);
          } else {
            console.log(`Subasta no activa, ignorando: ${title}`);
          }
        } else {
          console.log(`Título no relevante, ignorando: ${title}`);
        }
      } catch (error) {
        console.error('Error procesando listado:', error);
      }
    });
  }
  
  // Si ya encontramos vehículos, no necesitamos buscar más
  if (vehicles.length > 0) {
    console.log(`Encontrados ${vehicles.length} vehículos activos, finalizando búsqueda`);
    return vehicles;
  }
  
  // Como no se encontraron vehículos, intentamos otros selectores
  const listingCards = $('.listing-card');
  console.log(`Intentando con selector alternativo: .listing-card (${listingCards.length} encontrados)`);
  
  listingCards.each(function(index: number, element: any) {
    try {
      // Extrae datos básicos
      const title = $(element).find('h3').text().trim();
      if (!title) return; // Salta si no hay título
      
      // Para depuración: imprimimos el título antes de verificar relevancia
      console.log(`Evaluando título de listado alternativo: "${title}"`);
      
      // Solo procesa si el título es relevante
      if (isRelevantListing(title, make, model, year)) {
        console.log(`ENCONTRADO VEHÍCULO RELEVANTE: ${title}`);
        
        let sourceUrl = $(element).find('a').attr('href') || $(element).attr('href') || '';
        console.log(`URL encontrada: ${sourceUrl}`);
        
        if (sourceUrl && !sourceUrl.startsWith('http')) {
          sourceUrl = `https://bringatrailer.com${sourceUrl}`;
          console.log(`URL corregida: ${sourceUrl}`);
        }
        
        const imageUrl = $(element).find('img').first().attr('src') || '';
        // Extraemos el precio de la oferta actual
        let currentBidText = $(element).find('.bid-formatted').text().trim();
        
        // Si no encontramos el precio, buscamos en otros elementos posibles
        if (!currentBidText) {
          currentBidText = $(element).find('.current-bid').text().trim() ||
                           $(element).find('.amount').text().trim() ||
                           $(element).find('.highest-bid').text().trim();
        }
        
        console.log(`Texto de oferta encontrado: "${currentBidText}"`);
        
        let currentBid = null;
        if (currentBidText) {
          // Eliminamos símbolos de moneda y cualquier texto no numérico
          const priceMatch = currentBidText.match(/(\$?\s?\d[\d,\.]+)/);
          if (priceMatch && priceMatch[1]) {
            // Limpia el texto para extraer solo los números
            const cleanPrice = priceMatch[1].replace(/[^\d]/g, '');
            currentBid = parseInt(cleanPrice, 10);
            console.log(`Precio extraído: ${currentBid}`);
          }
        }
        
        // Extraemos el tiempo restante de la subasta
        let endsInText = $(element).find('.countdown-text').text().trim();
        
        // Si no encontramos texto de tiempo restante, buscamos en otros elementos
        if (!endsInText) {
          endsInText = $(element).find('.listing-available-timeremaining').text().trim() ||
                       $(element).find('.timeremaining').text().trim() ||
                       $(element).find('.completed-timeremaining').text().trim() || 
                       'No disponible';
        }
        
        console.log(`Tiempo restante encontrado: "${endsInText}"`); 
        const extractedYear = extractYear(title);
        
        // Verifica si la subasta está activa - criterio más estricto
        // Solo mostrar subastas activas basado en el mensaje del tiempo restante
        const isActiveAuction = !!endsInText && 
                            endsInText !== 'No disponible' &&
                            endsInText !== 'Terminado' && 
                            endsInText !== 'Completed' && 
                            !endsInText.toLowerCase().includes('sold') &&
                            !endsInText.toLowerCase().includes('ended') &&
                            (endsInText.includes('days') || 
                             endsInText.includes('hours') || 
                             endsInText.includes('mins') || 
                             endsInText.includes(':') || 
                             endsInText.includes('day') || 
                             endsInText.includes('hour'));
        
        if (isActiveAuction) {
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            source: 'bringatrailer',
            sourceUrl,
            imageUrl,
            year: extractedYear,
            price: currentBid,
            isAuction: true,
            currentBid,
            endsIn: endsInText || null,
            transmission: null,
            bodyType: null,
            location: 'Estados Unidos',
            mileage: null,
            color: null,
            vin: null,
            fuelType: null,
            dealerName: null,
            hasDeals: false
          };
          
          vehicles.push(vehicle);
          console.log(`Vehículo alternativo añadido: ${title}`);
        }
      }
    } catch (error) {
      console.error('Error en selector alternativo:', error);
    }
  });
  
  console.log(`Total de vehículos encontrados en BaT: ${vehicles.length}`);
  return vehicles;
}

/**
 * Construye la URL de búsqueda para Bring a Trailer
 */
function buildBringATrailerUrl(make: string, model: string, year?: string): string {
  // Base URL para búsquedas en Bring a Trailer
  const baseUrl = 'https://bringatrailer.com/search/';
  
  // Construye los parámetros de búsqueda
  let searchTerms = '';
  
  // Si make y model son iguales (como cuando se busca por "mustang" sin especificar "ford")
  if (make.toLowerCase() === model.toLowerCase()) {
    // Usamos el término
    searchTerms = make;
  } else {
    // Para casos como "dodge challenger", usamos ambos
    searchTerms = `${make} ${model}`;
  }
  
  console.log(`Términos de búsqueda iniciales: "${searchTerms}"`);

  
  // Añadimos el año si está disponible
  if (year) {
    searchTerms = `${searchTerms}+${year}`;
  }
  
  // Agregamos el parámetro 'order=end_date' para mostrar primero subastas a punto de terminar
  return `${baseUrl}?s=${searchTerms.replace(/ /g, '+')}&order=end_date`;
}

/**
 * Comprueba si un listado es relevante para los criterios de búsqueda
 */
function isRelevantListing(title: string, make: string, model: string, year?: string): boolean {
  const titleLower = title.toLowerCase();
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();
  
  console.log(`Verificando relevancia para: "${title}" contra modelo "${model}" y año "${year || 'no especificado'}"`);
  
  // Caso especial: cuando make y model son idénticos (ej: búsqueda genérica "mustang")
  if (makeLower === modelLower) {
    // Basta con que el título contenga el modelo
    const hasModel = titleLower.includes(modelLower);
    const hasYear = !year || titleLower.includes(year);
    
    const result = hasModel && hasYear;
    console.log(`Relevancia (búsqueda general): ${result ? 'SÍ' : 'NO'} - Contiene modelo: ${hasModel}, Contiene año: ${hasYear || 'No requerido'}`);
    return result;
  }
  
  // Para vehículos populares, usamos criterios más específicos
  
  // Para Ford Mustang
  if ((makeLower === 'ford' && modelLower === 'mustang') || 
      (makeLower === 'mustang' || modelLower === 'mustang')) {
    const isMustang = titleLower.includes('mustang') || titleLower.includes('shelby');
    const hasYear = !year || titleLower.includes(year);
    
    const result = isMustang && hasYear;
    console.log(`Relevancia (Mustang): ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
  
  // Para Dodge Challenger
  if ((makeLower === 'dodge' && modelLower === 'challenger') ||
      (makeLower === 'challenger' || modelLower === 'challenger')) {
    const isChallenger = titleLower.includes('challenger');
    const hasYear = !year || titleLower.includes(year);
    
    const result = isChallenger && hasYear;
    console.log(`Relevancia (Challenger): ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
  
  // Para Chevrolet Corvette
  if ((makeLower === 'chevrolet' && modelLower === 'corvette') ||
      (makeLower === 'corvette' || modelLower === 'corvette')) {
    const isCorvette = titleLower.includes('corvette') || titleLower.includes('vette');
    const hasYear = !year || titleLower.includes(year);
    
    const result = isCorvette && hasYear;
    console.log(`Relevancia (Corvette): ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
  
  // Método general para otros modelos
  const hasMake = makeLower !== modelLower ? titleLower.includes(makeLower) : true;
  const hasModel = titleLower.includes(modelLower);
  const hasYear = !year || titleLower.includes(year);
  
  const result = hasModel && hasYear; // Relajamos la condición del fabricante
  console.log(`Relevancia (genérico): ${result ? 'SÍ' : 'NO'} - Contiene modelo: ${hasModel}, Contiene año: ${hasYear || 'No requerido'}`);
  return result;
}

/**
 * Extrae el año del texto del título
 */
function extractYear(text: string): number | null {
  if (!text) return null;
  
  // Busca números de 4 dígitos que podrían ser años (1900-2099)
  const yearMatch = text.match(/(19\d{2}|20\d{2})/);
  if (yearMatch && yearMatch[0]) {
    const year = parseInt(yearMatch[0], 10);
    // Verifica que sea un año razonable para un auto clásico
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return year;
    }
  }
  
  return null;
}
