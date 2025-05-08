/**
 * Script de diagnóstico para Bring a Trailer usando browserless.io
 * Este script realiza una captura de pantalla del sitio para verificar su renderización
 */
import { type InsertVehicle } from "@shared/schema";
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Toma una captura de pantalla de Bring a Trailer para diagnóstico
 * 
 * @param make - Marca del vehículo
 * @param model - Modelo del vehículo
 * @param year - Año del vehículo (opcional)
 * @returns URL de la captura o null si falla
 */
export async function takeScreenshotOfBaT(make: string, model: string, year?: string): Promise<string | null> {
  try {
    console.log(`📸 Tomando captura de pantalla de BaT para: ${make} ${model} ${year || ''}`);
    
    // Construir URL de búsqueda
    const searchQuery = [make, model, year].filter(Boolean).join('+');
    const searchUrl = `https://bringatrailer.com/auctions/?search=${encodeURIComponent(searchQuery)}`;
    
    console.log(`🔍 URL de búsqueda: ${searchUrl}`);
    
    // Verificar si tenemos una API key para browserless.io
    if (!process.env.BROWSERLESS_API_KEY) {
      console.error(`❌ Error: No se encontró API key para browserless.io`);
      return null;
    }
    
    // URL de la API de browserless.io para captura de pantalla
    const browserlessUrl = `https://chrome.browserless.io/screenshot?token=${process.env.BROWSERLESS_API_KEY}`;
    
    // Configuración de la solicitud
    const requestBody = {
      url: searchUrl,
      options: {
        fullPage: true,
        type: "jpeg",
        quality: 80,
        omitBackground: true
      },
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000
      }
    };
    
    console.log(`🔭 Solicitando captura a browserless.io...`);
    const response = await axios.post(browserlessUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer', 
      timeout: 60000 // 60 segundos
    });
    
    console.log(`✅ Respuesta recibida de browserless.io con status: ${response.status}`);
    
    // Guardar la imagen en un archivo
    const screenshotBuffer = response.data;
    const timestamp = Date.now();
    const filename = `bat_screenshot_${make}_${model}_${year || ''}_${timestamp}.jpg`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, screenshotBuffer);
    console.log(`✅ Captura guardada en: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error(`❌ Error al tomar captura de BaT:`, error);
    return null;
  }
}

/**
 * Función de diagnóstico que utiliza browserless.io para el debug
 * Este método es solo para diagnóstico, no para uso en producción
 */
export async function diagnosticGetHTML(url: string): Promise<string | null> {
  try {
    console.log(`🔍 Obteniendo HTML renderizado de: ${url}`);
    
    // Verificar si tenemos una API key para browserless.io
    if (!process.env.BROWSERLESS_API_KEY) {
      console.error(`❌ Error: No se encontró API key para browserless.io`);
      return null;
    }
    
    // URL de la API de browserless.io
    const browserlessUrl = `https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_API_KEY}`;
    
    // Configuración de la solicitud
    const requestBody = {
      url: url,
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000
      }
    };
    
    console.log(`🔭 Solicitando contenido a browserless.io...`);
    const response = await axios.post(browserlessUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos
    });
    
    console.log(`✅ Respuesta recibida de browserless.io con status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error al obtener HTML:`, error);
    return null;
  }
}