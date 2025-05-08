import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Página de diagnóstico para el scraper de Bring a Trailer
 */
export default function BatDiagnostic() {
  const [make, setMake] = useState<string>("porsche");
  const [model, setModel] = useState<string>("911");
  const [year, setYear] = useState<string>("1980");

  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("screenshot");
  const [jsonData, setJsonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir URL de búsqueda para referencia - IMPORTANTE: BaT requiere "+" como separador en lugar de "%2B"
      const searchQuery = [make, model, year].filter(Boolean).join('+');
      const searchUrl = `https://bringatrailer.com/auctions/?search=${searchQuery}`;
      setCurrentUrl(searchUrl);
      
      // Construir URL para la captura de pantalla
      const screenshotUrl = `/api/bat/screenshot?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
      const timestamp = new Date().getTime(); // Para evitar caché
      const fullUrl = `${screenshotUrl}${year ? `&year=${encodeURIComponent(year)}` : ''}&t=${timestamp}`;
      
      setScreenshotUrl(fullUrl);
      setActiveTab("screenshot");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getHtml = async () => {
    if (!currentUrl) {
      setError('Primero tome una captura de pantalla');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bat/html?url=${encodeURIComponent(currentUrl)}`);
      if (!response.ok) {
        throw new Error(`Error al obtener HTML: ${response.status}`);
      }
      
      const html = await response.text();
      setHtmlContent(html);
      setActiveTab("html");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir la URL con los parámetros
      let url = `/api/bat/test?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
      if (year) {
        url += `&year=${encodeURIComponent(year)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al extraer datos: ${response.status}`);
      }
      
      const data = await response.json();
      setJsonData(data);
      setActiveTab("json");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Diagnóstico de Scraper de Bring a Trailer</h1>
      <p className="text-gray-700 mb-6">
        Esta herramienta permite diagnosticar el scraper de Bring a Trailer verificando su comportamiento con navegación real.
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Tomar captura de pantalla</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Marca:</Label>
              <Input
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo:</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año (opcional):</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Tomar captura'}
          </Button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="screenshot">Captura de pantalla</TabsTrigger>
          <TabsTrigger 
            value="html" 
            onClick={getHtml}
            disabled={!currentUrl || isLoading}
          >
            HTML renderizado
          </TabsTrigger>
          <TabsTrigger 
            value="json" 
            onClick={getData}
            disabled={isLoading}
          >
            Datos extraídos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="screenshot" className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Captura de Bring a Trailer</h3>
          {currentUrl && (
            <p className="mb-4">
              URL de búsqueda: <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{currentUrl}</a>
            </p>
          )}
          {screenshotUrl && (
            <div className="mt-4 border rounded overflow-hidden">
              <img src={screenshotUrl} alt="Captura de BaT" className="w-full" />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="html" className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">HTML renderizado</h3>
          <Button 
            onClick={getHtml} 
            disabled={!currentUrl || isLoading}
            className="mb-4"
          >
            {isLoading ? 'Obteniendo HTML...' : 'Obtener HTML'}
          </Button>
          {htmlContent && (
            <div className="mt-4">
              <p>HTML de la página (renderizado con JavaScript):</p>
              <pre className="bg-gray-100 p-4 rounded text-xs mt-2 max-h-96 overflow-auto">
                {htmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </pre>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="json" className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Datos extraídos</h3>
          <Button 
            onClick={getData} 
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Extrayendo datos...' : 'Extraer datos'}
          </Button>
          {jsonData && (
            <div className="mt-4">
              <p>Resultados extraídos ({jsonData.count} vehículos):</p>
              <pre className="bg-gray-100 p-4 rounded text-xs mt-2 max-h-96 overflow-auto">
                {JSON.stringify(jsonData, null, 2)}
              </pre>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}