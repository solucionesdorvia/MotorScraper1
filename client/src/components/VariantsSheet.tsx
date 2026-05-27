/**
 * Panel lateral (Sheet) que muestra variantes/alternativas de un vehículo:
 * mismo make+model, distintos años, precios y fuentes.
 *
 * Se abre desde VehicleCard cuando el usuario clickea "Ver variantes".
 * Lazy-fetch: solo pega a /api/variants cuando se abre por primera vez.
 */
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Vehicle } from '@shared/schema';
import { formatPrice, getDefaultImageUrl, getSourceLabel, getSourceClassName } from '@/lib/utils';
import { FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  make: string;
  model: string;
  /** vehículo de origen para excluirlo de la lista de variantes (opcional) */
  excludeId?: number;
}

interface ApiResult {
  vehicles: Vehicle[];
  totalResults: number;
  totalPages: number;
}

const VariantsSheet = ({ open, onOpenChange, make, model, excludeId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const key = `${make}|${model}`;
    if (key === fetchedKey) return;
    setLoading(true);
    setResult(null);
    fetch(`/api/variants?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then(r => r.json())
      .then((d: ApiResult) => {
        setResult(d);
        setFetchedKey(key);
      })
      .catch(() => setResult({ vehicles: [], totalResults: 0, totalPages: 0 }))
      .finally(() => setLoading(false));
  }, [open, make, model, fetchedKey]);

  const variants = (result?.vehicles || []).filter(v => v.id !== excludeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Variantes de {make} {model}</SheetTitle>
          <SheetDescription>
            Otros años, configuraciones y precios disponibles en nuestros sitios fuente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center text-neutral-600 py-12 gap-2">
              <FaSpinner className="animate-spin" /> Buscando variantes…
            </div>
          )}

          {!loading && variants.length === 0 && (
            <div className="text-center text-neutral-600 py-12 text-sm">
              No encontramos otras variantes ahora mismo. Probá ampliar la búsqueda desde la página principal.
            </div>
          )}

          {!loading && variants.length > 0 && (
            <ul className="space-y-3">
              {variants.map(v => (
                <li key={v.id} className="bg-white border border-neutral-200 rounded-lg p-3 flex gap-3 hover:shadow-md transition-shadow">
                  <img
                    src={v.imageUrl || getDefaultImageUrl(v.make)}
                    alt={v.title}
                    className="w-24 h-20 object-cover rounded bg-neutral-100 flex-shrink-0"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = getDefaultImageUrl(v.make); }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">{v.title}</p>
                    <p className="text-primary font-semibold text-sm mt-1">
                      {v.isAuction
                        ? `${formatPrice(v.currentBid ?? undefined)} (oferta)`
                        : formatPrice(v.price ?? undefined)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] text-white px-1.5 py-0.5 rounded ${getSourceClassName(v.source)}`}>
                        {getSourceLabel(v.source)}
                      </span>
                      {v.sourceUrl && (
                        <a
                          href={v.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs hover:underline flex items-center gap-1"
                        >
                          Ver <FaExternalLinkAlt className="text-[10px]" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VariantsSheet;
