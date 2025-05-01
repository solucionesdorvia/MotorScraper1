/**
 * Scraper especializado para Bring a Trailer - enfocado en Live Listings
 * Diseñado para extraer SOLO listados de vehículos ACTIVOS
 * Basado en el formato específico proporcionado por el usuario
 */

import { load } from 'cheerio';
import { InsertVehicle } from '../../shared/schema';

// Función principal para scraping de BaT concentrada en subastas activas
export async function scrapeBringATrailerFocused(make: string, model: string, year?: string): Promise<InsertVehicle[]> {
  console.log(`Iniciando scraping ENFOCADO de Bring a Trailer para ${make} ${model} ${year || ''}`);
  
  try {
    // Construye URL para buscar en Bring a Trailer con formato correcto
    const searchUrl = buildUrl(make, model, year);
    console.log(`URL de búsqueda: ${searchUrl}`);
    
    // Obtiene HTML de la página de resultados
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`Error al obtener la página: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`HTML obtenido: ${html.length} caracteres`);
    
    // Extraer listados de vehículos usando Cheerio
    const $ = load(html);
    const vehicles: InsertVehicle[] = [];
    
    // EXTRACCIÓN ENFOCADA: Solo apuntar a la sección "Live Listings"
    console.log('Buscando específicamente sección LIVE LISTINGS...');
    
    // Buscar la sección exacta con id="search-result-live-listings"
    const liveListingsSection = $('#search-result-live-listings');
    
    if (liveListingsSection.length > 0) {
      console.log('✅ SECCIÓN LIVE LISTINGS ENCONTRADA');
      
      // Encontrar todas las tarjetas de listing dentro de la sección
      const listingCards = liveListingsSection.find('a.listing-card');
      console.log(`Encontradas ${listingCards.length} tarjetas en la sección Live Listings`);
      
      // Procesar cada tarjeta de listing
      listingCards.each((i, card) => {
        try {
          const $card = $(card);
          
          // Datos básicos de la subasta
          const url = $card.attr('href') || '';
          const title = $card.find('h3').text().trim();
          const imageUrl = $card.find('img').attr('src') || '';
          
          // Verificar si es relevante para la búsqueda
          if (!isRelevant(title, make, model, year)) {
            console.log(`Omitiendo listado no relevante: ${title}`);
            return; // Continuar con el siguiente
          }
          
          // Extraer precio/oferta actual
          const bidText = $card.find('.bid-formatted').text().trim();
          let price = null;
          if (bidText) {
            // Limpiar formato de precio (quitar $, USD, comas, etc.)
            const priceMatch = bidText.match(/[\d,]+/);
            if (priceMatch) {
              price = parseInt(priceMatch[0].replace(/,/g, ''), 10);
            }
          }
          
          // Extraer tiempo restante - elemento clave para confirmar que está activo
          let timeText = $card.find('.countdown-text').text().trim();
          if (!timeText) {
            // Si no encontramos texto de cuenta atrás, buscar otros indicadores
            if ($card.find('progress').length > 0) {
              timeText = 'En curso'; // Tiene barra de progreso = activo
            } else {
              // Buscar cualquier texto relacionado con tiempo
              const timePattern = /\d+[dhms]|\d+:\d+|days?|hours?|minutes?|ending/i;
              const cardText = $card.text();
              const timeMatch = cardText.match(timePattern);
              if (timeMatch) {
                timeText = timeMatch[0];
              } else {
                timeText = 'En curso'; // Por defecto para Live Listings
              }
            }
          }
          
          // Extraer año del título
          const yearMatch = title.match(/(19\d{2}|20\d{2})/);
          const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
          
          // Crear objeto de vehículo
          const vehicle: InsertVehicle = {
            title,
            make,
            model,
            source: 'bringatrailer',
            sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
            imageUrl,
            year: extractedYear,
            price,
            isAuction: true,
            currentBid: price,
            endsIn: timeText,
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
          
          // Añadir vehículo a la lista
          vehicles.push(vehicle);
          console.log(`✅ Añadido listing ACTIVO: ${title} - ${price || 'sin precio'} - ${timeText}`);
          
        } catch (err) {
          console.error('Error procesando tarjeta de listing:', err);
        }
      });
    } else {
      console.log('❌ No se encontró la sección Live Listings');
    }
    
    // Si no encontramos listados en la sección Live, buscar alternativas
    if (vehicles.length === 0) {
      console.log('Buscando sección alternativa de Live Listings...');
      
      // Buscar por clase en lugar de ID
      const liveListingsAlt = $('.search-result-live-listings');
      if (liveListingsAlt.length > 0) {
        console.log('✅ Encontrada sección alternativa de Live Listings');
        
        // Procesar similar a la sección anterior
        const listingCardsAlt = liveListingsAlt.find('a.listing-card');
        console.log(`Encontradas ${listingCardsAlt.length} tarjetas en sección alternativa`);
        
        // Mismo procesamiento que antes...
        listingCardsAlt.each((i, card) => {
          try {
            // Similar al procesamiento anterior...
            const $card = $(card);
            const url = $card.attr('href') || '';
            const title = $card.find('h3').text().trim();
            
            // Si ya está en la lista, omitirlo
            if (vehicles.some(v => v.title === title)) {
              return;
            }
            
            // Resto del procesamiento similar...
            // [Código similar al bloque anterior]
            
            const imageUrl = $card.find('img').attr('src') || '';
            if (!isRelevant(title, make, model, year)) return;
            
            const bidText = $card.find('.bid-formatted').text().trim();
            let price = null;
            if (bidText) {
              const priceMatch = bidText.match(/[\d,]+/);
              if (priceMatch) {
                price = parseInt(priceMatch[0].replace(/,/g, ''), 10);
              }
            }
            
            let timeText = $card.find('.countdown-text').text().trim() || 'En curso';
            
            const yearMatch = title.match(/(19\d{2}|20\d{2})/);
            const extractedYear = yearMatch ? parseInt(yearMatch[0], 10) : (year ? parseInt(year, 10) : null);
            
            const vehicle: InsertVehicle = {
              title,
              make,
              model,
              source: 'bringatrailer',
              sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
              imageUrl,
              year: extractedYear,
              price,
              isAuction: true,
              currentBid: price,
              endsIn: timeText,
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
            console.log(`✅ Añadido listing ACTIVO (alternativo): ${title}`);
            
          } catch (err) {
            console.error('Error procesando tarjeta alternativa:', err);
          }
        });
      }
    }
    
    // Verificación final
    console.log(`Total de vehículos ACTIVOS encontrados: ${vehicles.length}`);
    return vehicles;
    
  } catch (error) {
    console.error('Error en scraper BaT ENFOCADO:', error);
    return [];
  }
}

// Funciones auxiliares
function buildUrl(make: string, model: string, year?: string): string {
  const terms = make === model ? make : `${make} ${model}`;
  const search = year ? `${terms} ${year}` : terms;
  // Parámetro view=all para obtener todos los resultados
  return `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`;
}

function isRelevant(title: string, make: string, model: string, year?: string): boolean {
  // Normalizar a minúsculas
  const t = title.toLowerCase();
  const m = make.toLowerCase();
  const mod = model.toLowerCase();
  
  // Casos especiales para modelos populares
  
  // Ford Mustang
  if ((m === 'ford' && mod === 'mustang') || mod === 'mustang') {
    if (!t.includes('mustang')) return false;
    if (year && !title.includes(year)) return false;
    return true;
  }
  
  // Comprobar modelo y año
  const hasModel = t.includes(mod);
  let hasYear = true;
  
  if (year) {
    hasYear = t.includes(year);
    
    // También probar con año corto (ej. '67' para '1967')
    if (!hasYear && year.length === 4 && year.startsWith('19')) {
      const shortYear = year.substring(2);
      hasYear = t.includes(shortYear);
    }
  }
  
  return hasModel && hasYear;
}