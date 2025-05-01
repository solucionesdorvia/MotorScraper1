// Aplicación Express para scraping de Bring a Trailer 
// Enfocado únicamente en subastas ACTIVAS

import express from 'express';
import { getActiveBringATrailerListings } from './server/scraper/bat-standalone.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware para CORS y parsing JSON
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Información de uso básica
app.get('/', (req, res) => {
  res.json({
    info: 'Scraper avanzado de Bring a Trailer - SOLO SUBASTAS ACTIVAS',
    descripcion: 'API mejorada que solamente muestra subastas realmente activas',
    endpoints: [
      '/:make - Buscar vehículos por marca (ej. /ford)',
      '/:make/:model - Buscar vehículos por marca y modelo (ej. /ford/mustang)',
      '/search?make=X&model=Y&year=Z - Búsqueda con parámetros'
    ],
    ejemplos: [
      '/ford',
      '/porsche/911',
      '/search?make=bmw&model=m3&year=1995'
    ]
  });
});

// Búsqueda por marca
app.get('/:make', async (req, res) => {
  const { make } = req.params;
  const year = req.query.year;
  
  try {
    console.log(`Ejecutando búsqueda para marca: ${make}`);
    const listings = await getActiveBringATrailerListings(make, '', year);
    
    const results = formatResults(listings, make, '', year);
    res.json(results);
  } catch (error) {
    console.error(`Error al buscar ${make}:`, error);
    res.status(500).json({
      success: false,
      error: `Error al obtener subastas para ${make}`,
      message: error.message
    });
  }
});

// Búsqueda por marca y modelo
app.get('/:make/:model', async (req, res) => {
  const { make, model } = req.params;
  const year = req.query.year;
  
  try {
    console.log(`Ejecutando búsqueda para marca: ${make}, modelo: ${model}`);
    const listings = await getActiveBringATrailerListings(make, model, year);
    
    const results = formatResults(listings, make, model, year);
    res.json(results);
  } catch (error) {
    console.error(`Error al buscar ${make} ${model}:`, error);
    res.status(500).json({
      success: false,
      error: `Error al obtener subastas para ${make} ${model}`,
      message: error.message
    });
  }
});

// Búsqueda con parámetros
app.get('/search', async (req, res) => {
  const { make, model, year } = req.query;
  
  if (!make) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere al menos el parámetro \'make\''
    });
  }
  
  try {
    console.log(`Ejecutando búsqueda con parámetros: make=${make}, model=${model || ''}, year=${year || ''}`);
    const listings = await getActiveBringATrailerListings(make, model || '', year);
    
    const results = formatResults(listings, make, model, year);
    res.json(results);
  } catch (error) {
    console.error(`Error al buscar con parámetros:`, error);
    res.status(500).json({
      success: false,
      error: `Error al obtener subastas con los parámetros proporcionados`,
      message: error.message
    });
  }
});

// Formatear resultados para respuesta JSON
function formatResults(listings, make, model, year) {
  const searchParams = { make };
  if (model) searchParams.model = model;
  if (year) searchParams.year = year;
  
  if (listings.length === 0) {
    return {
      success: true,
      count: 0,
      message: `No se encontraron subastas activas para los criterios especificados`,
      listings: [],
      searchParams
    };
  }
  
  return {
    success: true,
    count: listings.length,
    message: `Se encontraron ${listings.length} subastas ACTIVAS`,
    listings,
    searchParams
  };
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`📡 Scraper de Bring a Trailer (SOLO SUBASTAS ACTIVAS) ejecutándose en puerto ${PORT}`);
  console.log(`👉 Accede a http://localhost:${PORT} para instrucciones de uso`);
});