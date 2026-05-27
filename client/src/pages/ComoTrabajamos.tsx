import { useLocation } from 'wouter';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  FaCamera,
  FaSearch,
  FaExchangeAlt,
  FaHandshake,
  FaArrowRight,
  FaCheckCircle,
  FaExternalLinkAlt,
} from 'react-icons/fa';

const ECOMEX_URL = 'https://e-comex.com.ar';

const ComoTrabajamos = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary/95 to-primary text-white py-14">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Cómo trabajamos</h1>
          <p className="text-white/90 text-lg max-w-2xl">
            ClasicAR descubre, identifica y compara vehículos. E-COMEX cotiza y opera la
            importación. Vos no tenés que coordinar entre dos servicios — nosotros lo hacemos.
          </p>
        </div>
      </section>

      {/* 4 etapas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Nuestro proceso, paso a paso</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Stage
              n={1}
              icon={<FaCamera />}
              title="Reconocimiento del vehículo"
              body="Subí una foto, describilo en chat o ingresá el VIN. Te identificamos el modelo, año y variante en segundos usando IA. Si ya sabés qué buscás, salteás este paso."
              cta={{ label: 'Probar reconocimiento', onClick: () => setLocation('/reconocer') }}
            />
            <Stage
              n={2}
              icon={<FaSearch />}
              title="Búsqueda agregada"
              body="Buscamos en simultáneo en eBay Motors, Bring a Trailer, Hemmings, ClassicCars y otros sitios — clásicos, 0km, eléctricos. Filtros por categoría, año y precio."
              cta={{ label: 'Ir a buscar', onClick: () => setLocation('/busqueda') }}
            />
            <Stage
              n={3}
              icon={<FaExchangeAlt />}
              title="Comparación de variantes"
              body="No te quedás con un solo listado: te mostramos otros años, configuraciones, trims y precios del mismo modelo en distintos sitios para que decidas mejor."
            />
            <Stage
              n={4}
              icon={<FaHandshake />}
              title="Cotización e importación con E-COMEX"
              body="Cuando elegís un vehículo, generamos una cotización profesional de importación junto a E-COMEX: FOB, flete marítimo, seguro, impuestos (35% derechos + 21% IVA + 3% estadística), honorarios y total a pagar."
              cta={{
                label: 'Cotizar ahora con E-COMEX',
                onClick: () => window.open(ECOMEX_URL, '_blank', 'noopener,noreferrer'),
                external: true,
              }}
            />
          </div>
        </div>
      </section>

      {/* Partnership */}
      <section className="py-16 bg-neutral-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Nuestro partner: E-COMEX Automotores</h2>
          <p className="text-center text-neutral-600 mb-10">La evolución del comercio exterior automotor en Argentina.</p>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">Qué hace E-COMEX</h3>
                <ul className="space-y-2 text-neutral-700 text-sm">
                  <Bullet>Cotización completa de importación automotor (FOB + flete + impuestos + honorarios).</Bullet>
                  <Bullet>Reportes con desglose claro y validez de 30 días.</Bullet>
                  <Bullet>Cubre clásicos, 0km, eléctricos chinos (BYD), híbridos y comerciales.</Bullet>
                  <Bullet>Trabaja con Gestión Forward para la operación logística puerta a puerta.</Bullet>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Cómo nos dividimos el trabajo</h3>
                <ul className="space-y-2 text-neutral-700 text-sm">
                  <Bullet>
                    <strong>ClasicAR</strong>: descubrimiento, reconocimiento del vehículo,
                    búsqueda agregada, comparación de variantes y recomendación.
                  </Bullet>
                  <Bullet>
                    <strong>E-COMEX</strong>: cotización profesional, intervención de SENASA y AFIP,
                    despacho aduanero, registro automotor.
                  </Bullet>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-wrap gap-3 items-center justify-between">
              <div className="text-sm text-neutral-600">
                <p><strong>Contacto E-COMEX:</strong> info@e-comex.com.ar · (+54) 11 5353 0536</p>
                <p>Av. Pres. Julio Roca 771, 7° piso 12, CABA</p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-md flex items-center gap-2"
                onClick={() => window.open(ECOMEX_URL, '_blank', 'noopener,noreferrer')}
              >
                Visitar e-comex.com.ar
                <FaExternalLinkAlt className="text-xs" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-14 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Empezá ahora</h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Buscá un vehículo o probá el reconocimiento por foto, chat o VIN.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 rounded-md inline-flex items-center gap-2"
              onClick={() => setLocation('/busqueda')}
            >
              Buscar vehículos
              <FaArrowRight />
            </Button>
            <Button
              className="bg-transparent border border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-md inline-flex items-center gap-2"
              onClick={() => setLocation('/reconocer')}
            >
              Reconocer mi vehículo
              <FaCamera />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface StageProps {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void; external?: boolean };
}

const Stage = ({ n, icon, title, body, cta }: StageProps) => (
  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 flex gap-4">
    <div className="flex-shrink-0">
      <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
        {n}
      </div>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary text-xl">{icon}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-neutral-600 text-sm mb-4">{body}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="text-primary font-medium text-sm hover:underline inline-flex items-center gap-1"
        >
          {cta.label}
          {cta.external ? <FaExternalLinkAlt className="text-xs" /> : <FaArrowRight className="text-xs" />}
        </button>
      )}
    </div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2">
    <FaCheckCircle className="text-primary flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </li>
);

export default ComoTrabajamos;
