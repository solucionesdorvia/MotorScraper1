import express from 'express'
import axios from 'axios'
import * as cheerio from 'cheerio'

const PORT = process.env.PORT || 8000
const app = express()

// Middleware para CORS y parsing JSON
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

// Información de uso básica
app.get('/', (req, res) => {
  res.json({
    info: 'Scraper avanzado de Bring a Trailer - SOLO SUBASTAS ACTIVAS',
    usage: [
      '/search/:make/:model - Buscar vehículos por marca y modelo',
      '/search/:make - Buscar vehículos solo por marca',
      '/advanced/:query - Búsqueda avanzada con cualquier término'
    ],
    examples: [
      '/search/ford/mustang',
      '/search/porsche/911',
      '/advanced/bmw%20m3%20e30'
    ]
  })
})

// Búsqueda por marca y modelo
app.get('/search/:make/:model', async (req, res) => {
  const { make, model } = req.params
  const year = req.query.year
  
  try {
    const listings = await getActiveBringATrailerListings(make, model, year)
    
    if (listings.length > 0) {
      res.json({
        success: true, 
        count: listings.length,
        message: `Encontradas ${listings.length} subastas ACTIVAS de ${make} ${model}${year ? ' ' + year : ''}`,
        listings
      })
    } else {
      res.json({
        success: true,
        count: 0,
        message: `No se encontraron subastas activas para ${make} ${model}${year ? ' ' + year : ''}`,
        listings: []
      })
    }
  } catch (error) {
    console.error(`Error al buscar ${make} ${model}:`, error)
    res.status(500).json({
      success: false,
      error: `Error al obtener subastas para ${make} ${model}`,
      message: error.message
    })
  }
})

// Búsqueda solo por marca
app.get('/search/:make', async (req, res) => {
  const { make } = req.params
  const year = req.query.year
  
  try {
    const listings = await getActiveBringATrailerListings(make, "", year)
    
    if (listings.length > 0) {
      res.json({
        success: true,
        count: listings.length,
        message: `Encontradas ${listings.length} subastas ACTIVAS de ${make}${year ? ' ' + year : ''}`,
        listings
      })
    } else {
      res.json({
        success: true,
        count: 0,
        message: `No se encontraron subastas activas para ${make}${year ? ' ' + year : ''}`,
        listings: []
      })
    }
  } catch (error) {
    console.error(`Error al buscar ${make}:`, error)
    res.status(500).json({
      success: false,
      error: `Error al obtener subastas para ${make}`,
      message: error.message
    })
  }
})

// Búsqueda avanzada con cualquier término
app.get('/advanced/:query', async (req, res) => {
  const { query } = req.params
  const decodedQuery = decodeURIComponent(query)
  
  try {
    // Para búsqueda avanzada, pasamos todo como "make" y dejamos model vacío
    const listings = await getActiveBringATrailerListings(decodedQuery, "")
    
    if (listings.length > 0) {
      res.json({
        success: true,
        count: listings.length,
        message: `Encontradas ${listings.length} subastas ACTIVAS para "${decodedQuery}"`,
        listings
      })
    } else {
      res.json({
        success: true,
        count: 0,
        message: `No se encontraron subastas activas para "${decodedQuery}"`,
        listings: []
      })
    }
  } catch (error) {
    console.error(`Error en búsqueda avanzada "${decodedQuery}":`, error)
    res.status(500).json({
      success: false,
      error: `Error al realizar búsqueda avanzada`,
      message: error.message
    })
  }
})

/**
 * Función principal que extrae SOLO subastas activas de Bring a Trailer
 * Basada en el scraper de emergencia que detecta elementos específicos de subastas activas
 */
async function getActiveBringATrailerListings(make, model, year) {
  console.log(`🔍 Buscando subastas ACTIVAS para: ${make} ${model} ${year || ''}`)
  
  // Construir URL de búsqueda
  const terms = model ? `${make} ${model}` : make
  const search = year ? `${terms} ${year}` : terms
  const searchUrl = `https://bringatrailer.com/search/?view=all&s=${search.replace(/ /g, '%20')}`
  
  console.log(`📡 URL de búsqueda: ${searchUrl}`)
  
  try {
    // Obtener HTML completo
    const response = await axios.get(searchUrl)
    const html = response.data
    
    console.log(`✅ HTML obtenido: ${html.length} caracteres`)
    
    // Buscar la sección "Live Listings"
    const liveListingsSectionStart = html.indexOf('<div class="search-result-live-listings"')
    
    if (liveListingsSectionStart === -1) {
      console.log('❌ No se encontró la sección de Live Listings, usando método de respaldo')
      return extractWithFallbackMethod(html, make, model, year)
    }
    
    console.log('✅ ENCONTRADA SECCIÓN LIVE LISTINGS!')
    
    // Extraer sección Live Listings
    // Este método busca el div de apertura y cierre correspondiente
    let openDivs = 1
    let currentPos = liveListingsSectionStart + 10
    let sectionEndPos = -1
    
    while (openDivs > 0 && currentPos < html.length) {
      const nextOpenDiv = html.indexOf('<div', currentPos)
      const nextCloseDiv = html.indexOf('</div>', currentPos)
      
      if (nextCloseDiv === -1) break
      
      if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
        openDivs++
        currentPos = nextOpenDiv + 4
      } else {
        openDivs--
        currentPos = nextCloseDiv + 6
        if (openDivs === 0) {
          sectionEndPos = nextCloseDiv + 6
          break
        }
      }
    }
    
    if (sectionEndPos === -1) {
      console.log('❌ No se pudo extraer completamente la sección Live Listings, usando método de respaldo')
      return extractWithFallbackMethod(html, make, model, year)
    }
    
    // Extraer HTML de la sección Live Listings
    const liveListingsHtml = html.substring(liveListingsSectionStart, sectionEndPos)
    
    // Cargar el HTML en Cheerio para facilitar la extracción
    const $ = cheerio.load(liveListingsHtml)
    const listings = []
    
    // Buscar todas las tarjetas de subastas activas
    // Formato: <a class="listing-card bg-white-transparent" ... href="URL">
    $('a.listing-card').each(function() {
      // Extraer datos básicos
      const url = $(this).attr('href')
      const title = $(this).find('h3').text().trim()
      
      // Verificar si es relevante para la búsqueda
      if (!isRelevant(title, make, model, year)) {
        return
      }
      
      // Extraer imagen
      const imageUrl = $(this).find('img').first().attr('src') || ''
      
      // Extraer precio actual (oferta)
      let price = null
      const priceText = $(this).find('.bid-formatted').text().trim()
      if (priceText) {
        const numericMatch = priceText.match(/[\d,]+/)
        if (numericMatch) {
          price = parseInt(numericMatch[0].replace(/,/g, ''), 10)
        }
      }
      
      // Extraer tiempo restante
      const timeText = $(this).find('.countdown-text').text().trim() || 'En curso'
      
      // Extraer año
      const yearMatch = title.match(/(19\d{2}|20\d{2})/) 
      const extractedYear = yearMatch ? yearMatch[0] : (year || '')
      
      console.log(`✅ Subasta ACTIVA encontrada: ${title}`)
      
      // Crear objeto de subasta con formato coherente
      const listing = {
        title,
        price: price || null,
        currentBid: price || null,
        ending: timeText,
        endsIn: timeText,
        link: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
        sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
        imageUrl,
        year: extractedYear,
        source: 'bringatrailer',
        isAuction: true
      }
      
      listings.push(listing)
    })
    
    if (listings.length > 0) {
      console.log(`✅ ÉXITO: se encontraron ${listings.length} subastas REALMENTE ACTIVAS`)
      return listings
    }
    
    // Si no encontramos resultados, probamos con el método de respaldo
    console.log('No se encontraron subastas activas en la sección Live Listings')
    return extractWithFallbackMethod(html, make, model, year)
    
  } catch (error) {
    console.error('Error en scraper:', error)
    throw error
  }
}

/**
 * Método de respaldo que busca elementos específicos de subastas activas
 * en toda la página HTML cuando el método principal falla
 */
function extractWithFallbackMethod(html, make, model, year) {
  console.log('Ejecutando método de RESPALDO para encontrar subastas activas...')
  
  const $ = cheerio.load(html)
  const listings = []
  
  // Buscar elementos con atributos que indican subastas activas
  // como "progress-counting" o "data-progress-percent"
  $('[class*="progress"], [data-progress-percent], [class*="countdown"]').each(function() {
    // Encontrar el contenedor padre que sea un enlace <a>
    const container = $(this).closest('a')
    if (!container.length) return
    
    // Extraer URL y título
    const url = container.attr('href')
    let title = container.find('h3').text().trim() || container.find('img').attr('alt') || ''
    
    // Si no hay título o URL, ignorar
    if (!title || !url) return
    
    // Verificar relevancia
    if (!isRelevant(title, make, model, year)) return
    
    // Extraer imagen
    const imageUrl = container.find('img').attr('src') || ''
    
    // Extraer precio
    let price = null
    const priceText = container.find('.bid-formatted, [class*="bid"], [class*="price"]').text().trim()
    if (priceText) {
      const numericMatch = priceText.match(/[\d,]+/)
      if (numericMatch) {
        price = parseInt(numericMatch[0].replace(/,/g, ''), 10)
      }
    }
    
    // Extraer tiempo
    const timeText = container.find('.countdown-text, [class*="countdown"]').text().trim() || 'En curso'
    
    // Extraer año
    const yearMatch = title.match(/(19\d{2}|20\d{2})/)
    const extractedYear = yearMatch ? yearMatch[0] : (year || '')
    
    console.log(`✅ (RESPALDO) Subasta ACTIVA encontrada: ${title}`)
    
    // Crear objeto con la información de la subasta
    const listing = {
      title,
      price: price || null,
      currentBid: price || null,
      ending: timeText,
      endsIn: timeText,
      link: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
      sourceUrl: url.startsWith('http') ? url : `https://bringatrailer.com${url}`,
      imageUrl,
      year: extractedYear,
      source: 'bringatrailer',
      isAuction: true
    }
    
    listings.push(listing)
  })
  
  console.log(`Método de respaldo encontró ${listings.length} subastas activas`)
  return listings
}

/**
 * Determina si un título es relevante para los criterios de búsqueda
 */
function isRelevant(title, make, model, year) {
  if (!title) return false
  
  // Normalizar a minúsculas
  const t = title.toLowerCase()
  const m = make.toLowerCase()
  const mod = model ? model.toLowerCase() : ''
  
  // Caso especial para Ford Mustang
  if ((m === 'ford' && mod === 'mustang') || mod === 'mustang') {
    if (!t.includes('mustang')) return false
    if (year && !t.includes(year)) return false
    return true
  }
  
  // Para búsquedas generales
  let hasModel = true
  if (mod) {
    hasModel = t.includes(mod)
  }
  
  // Verificar make
  const hasMake = t.includes(m)
  
  // Verificar año
  let hasYear = true
  if (year) {
    hasYear = t.includes(year)
    
    // Probar con año corto (ej. '67' para '1967')
    if (!hasYear && year.length === 4 && year.startsWith('19')) {
      const shortYear = year.substring(2)
      hasYear = t.includes(shortYear)
    }
  }
  
  return hasMake && hasModel && hasYear
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`📡 Scraper de Bring a Trailer (SOLO SUBASTAS ACTIVAS) ejecutándose en puerto ${PORT}`)
  console.log(`👉 Accede a http://localhost:${PORT} para instrucciones`)
})

export default app