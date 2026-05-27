import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FaCamera, FaComments, FaBarcode, FaSearch, FaUpload, FaArrowRight, FaSpinner } from 'react-icons/fa';

const Reconocer = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="bg-gradient-to-r from-primary/95 to-primary text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Reconocé tu vehículo</h1>
          <p className="text-white/90 max-w-2xl">
            Tres formas de identificar lo que buscás: subí una foto, contanos en chat o
            ingresá el VIN. Después te llevamos a la búsqueda con los datos prefijados.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white flex-grow">
        <div className="container mx-auto px-4 max-w-3xl">
          <Tabs defaultValue="foto" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="foto" className="flex items-center gap-2">
                <FaCamera /> <span className="hidden sm:inline">Foto</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <FaComments /> <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="vin" className="flex items-center gap-2">
                <FaBarcode /> <span className="hidden sm:inline">VIN / Patente</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="foto"><PhotoTab /></TabsContent>
            <TabsContent value="chat"><ChatTab /></TabsContent>
            <TabsContent value="vin"><VinTab /></TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// =================== FOTO ===================

interface PhotoResult {
  make: string | null;
  model: string | null;
  year: number | null;
  variant: string | null;
  category: string | null;
  confidence: number;
  rawNotes?: string;
}

const PhotoTab = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Archivo inválido', description: 'Subí una imagen (JPG/PNG).' });
      return;
    }
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/recognize/photo', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'No se pudo identificar la foto.' });
    } finally {
      setLoading(false);
    }
  };

  const goToSearch = () => {
    if (!result?.make && !result?.model) return;
    const q = [result.make, result.model].filter(Boolean).join(' ');
    const url = `/busqueda?query=${encodeURIComponent(q)}${result.year ? `&year=${result.year}` : ''}`;
    setLocation(url);
  };

  return (
    <div>
      <div
        className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary cursor-pointer transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-md" />
        ) : (
          <>
            <FaUpload className="mx-auto text-4xl text-neutral-400 mb-3" />
            <p className="text-neutral-600 font-medium">Arrastrá una foto acá o hacé click para elegir</p>
            <p className="text-neutral-500 text-sm mt-1">JPG / PNG hasta 8MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {loading && (
        <div className="mt-6 text-center text-neutral-600 flex items-center justify-center gap-2">
          <FaSpinner className="animate-spin" /> Analizando la imagen…
        </div>
      )}

      {result && !loading && (
        <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3">Identificación</h3>
          {result.make || result.model ? (
            <>
              <Field label="Marca" value={result.make} />
              <Field label="Modelo" value={result.model} />
              <Field label="Año estimado" value={result.year ? String(result.year) : null} />
              <Field label="Variante" value={result.variant} />
              <Field label="Categoría" value={result.category} />
              <Field label="Confianza" value={`${Math.round(result.confidence * 100)}%`} />
              {result.rawNotes && (
                <p className="text-sm text-neutral-600 italic mt-3">"{result.rawNotes}"</p>
              )}
              <Button className="mt-5 w-full bg-primary hover:bg-primary/90 text-white" onClick={goToSearch}>
                Buscar este vehículo <FaArrowRight className="ml-2" />
              </Button>
            </>
          ) : (
            <p className="text-neutral-600">No pudimos identificar un vehículo en esta imagen. Probá con otra foto o usá los otros métodos.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string | null }) => (
  <div className="flex justify-between py-1 text-sm border-b border-neutral-200 last:border-b-0">
    <span className="text-neutral-500">{label}</span>
    <span className="font-medium">{value || '—'}</span>
  </div>
);

// =================== CHAT ===================

interface ChatTurn { role: 'user' | 'assistant'; content: string; }
interface ChatResp { reply: string; recommendations: Array<{ make: string; model: string; year?: number; reasoning: string }>; }

const ChatTab = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [history, setHistory] = useState<ChatTurn[]>([
    { role: 'assistant', content: 'Hola! Contame qué buscás: uso (familiar, ciudad, off-road…), presupuesto, gustos, y te recomiendo opciones para importar.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<ChatResp['recommendations']>([]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setHistory(h => [...h, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/recognize/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data: ChatResp = await res.json();
      setHistory(h => [...h, { role: 'assistant', content: data.reply || '...' }]);
      setRecs(data.recommendations || []);
    } catch (err) {
      toast({ title: 'Error', description: 'El asesor no respondió. Intentá de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="border border-neutral-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-neutral-50">
        {history.map((m, i) => (
          <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-white border border-neutral-200'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-neutral-500 text-sm flex items-center gap-2"><FaSpinner className="animate-spin" /> Pensando…</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ej: Quiero un eléctrico chino bajo USD 30k para uso urbano"
          className="flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()}>Enviar</Button>
      </div>

      {recs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Recomendaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recs.map((r, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="font-semibold">{r.make} {r.model} {r.year ? `· ${r.year}` : ''}</p>
                <p className="text-sm text-neutral-600 mt-1">{r.reasoning}</p>
                <button
                  className="text-primary text-sm font-medium mt-2 hover:underline flex items-center gap-1"
                  onClick={() => {
                    const q = `${r.make} ${r.model}`.trim();
                    setLocation(`/busqueda?query=${encodeURIComponent(q)}${r.year ? `&year=${r.year}` : ''}`);
                  }}
                >
                  Buscar este modelo <FaSearch className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =================== VIN / PATENTE ===================

interface VinResp {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  bodyType: string | null;
  fuelType: string | null;
  engine: string | null;
  manufacturer: string | null;
  category: string | null;
  errorMessage?: string;
}

const VinTab = () => {
  const [, setLocation] = useLocation();
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VinResp | null>(null);

  const decode = async () => {
    if (vin.length !== 17 || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/recognize/vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const goToSearch = () => {
    if (!result?.make && !result?.model) return;
    const q = [result?.make, result?.model].filter(Boolean).join(' ');
    setLocation(`/busqueda?query=${encodeURIComponent(q)}${result?.year ? `&year=${result?.year}` : ''}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">VIN (17 caracteres)</label>
        <div className="flex gap-2">
          <Input
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="1FAFP42X43F123456"
            maxLength={17}
            className="font-mono uppercase"
          />
          <Button onClick={decode} disabled={vin.length !== 17 || loading}>
            {loading ? <FaSpinner className="animate-spin" /> : 'Decodificar'}
          </Button>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Funciona con vehículos vendidos en US (incluso importados con VIN US). Cobertura limitada para mercados europeos/asiáticos.
        </p>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <label className="block text-sm font-medium mb-2 text-neutral-500">Patente argentina</label>
        <div className="flex gap-2">
          <Input disabled placeholder="AB123CD" className="bg-neutral-100" />
          <Button disabled title="Próximamente — sin API pública gratuita disponible">
            Próximamente
          </Button>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          La decodificación de patentes argentinas requiere una API paga (InfoAuto). Por ahora usá VIN o las otras pestañas.
        </p>
      </div>

      {result && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
          {result.errorMessage ? (
            <p className="text-amber-700">{result.errorMessage}</p>
          ) : (
            <>
              <h3 className="font-semibold text-lg mb-3">Ficha técnica</h3>
              <Field label="VIN" value={result.vin} />
              <Field label="Fabricante" value={result.manufacturer} />
              <Field label="Marca" value={result.make} />
              <Field label="Modelo" value={result.model} />
              <Field label="Año" value={result.year ? String(result.year) : null} />
              <Field label="Carrocería" value={result.bodyType} />
              <Field label="Combustible" value={result.fuelType} />
              <Field label="Motor" value={result.engine} />
              <Field label="Categoría" value={result.category} />
              {(result.make || result.model) && (
                <Button className="mt-5 w-full bg-primary hover:bg-primary/90 text-white" onClick={goToSearch}>
                  Buscar este modelo <FaArrowRight className="ml-2" />
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reconocer;
