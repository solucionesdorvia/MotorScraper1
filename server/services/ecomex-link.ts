/**
 * Construye la URL al cotizador de E-COMEX con datos del vehículo prefijados.
 *
 * v1: la app de ecomex podría o no soportar querystring de prefill. Si no lo soporta,
 * el usuario aterriza en el home y tipea los datos manualmente — el copy del CTA del
 * cliente debería repetir make/model/year para que el usuario los copie.
 *
 * Querystring usado:
 *   - make, model, year: identificación del vehículo
 *   - source=clasicar: para que ecomex pueda atribuir el lead
 */

const ECOMEX_BASE = 'https://e-comex.com.ar';

interface QuoteLinkParams {
  make?: string;
  model?: string;
  year?: string | number;
}

export function buildEcomexQuoteLink(params: QuoteLinkParams): string {
  const qs = new URLSearchParams();
  if (params.make) qs.set('make', String(params.make));
  if (params.model) qs.set('model', String(params.model));
  if (params.year) qs.set('year', String(params.year));
  qs.set('source', 'clasicar');
  return `${ECOMEX_BASE}/?${qs.toString()}`;
}
