/**
 * Badge reutilizable que comunica el partnership con E-COMEX.
 * Variantes: 'pill' (hero, header), 'inline' (texto chico en footer).
 */

type Variant = 'pill' | 'inline';

interface Props {
  variant?: Variant;
  className?: string;
}

const ECOMEX_URL = 'https://e-comex.com.ar';

export default function EcomexBadge({ variant = 'pill', className = '' }: Props) {
  if (variant === 'inline') {
    return (
      <a
        href={ECOMEX_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-primary hover:underline ${className}`}
      >
        E-COMEX Automotores
      </a>
    );
  }

  return (
    <a
      href={ECOMEX_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs md:text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white/25 transition-colors ${className}`}
    >
      <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full" aria-hidden="true" />
      Partner oficial de E-COMEX · Cotización profesional de importación
    </a>
  );
}
