import { useLocation } from 'wouter';
import { FaCarSide, FaSearch, FaCheckCircle, FaClock, FaDollarSign, FaArrowRight, FaClipboardCheck, FaFileInvoiceDollar, FaCamera, FaExchangeAlt, FaHandshake } from 'react-icons/fa';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchForm from '@/components/search/SearchForm';
import EcomexBadge from '@/components/EcomexBadge';
import { Button } from '@/components/ui/button';

const Home = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="hero-section bg-gradient-to-r from-primary/95 to-primary py-16 md:py-24 flex-grow">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-white mb-10 md:mb-0">
              <EcomexBadge variant="pill" className="mb-6" />
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Encontrá y cotizá la importación de tu próximo vehículo
              </h1>
              <p className="text-white/90 text-lg mb-8 max-w-xl">
                Clásicos, 0km, eléctricos chinos e híbridos. Identificá tu vehículo, descubrí variantes y cotizá la importación a Argentina junto a E-COMEX.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-6 rounded-md transition-colors text-base"
                  onClick={() => setLocation('/busqueda')}
                >
                  Buscar Vehículos
                </Button>
                <Button
                  className="bg-transparent text-white hover:bg-white/10 border border-white font-semibold py-3 px-6 rounded-md transition-colors text-base"
                  onClick={() => setLocation('/reconocer')}
                >
                  Reconocer Vehículo
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">Buscá tu próximo vehículo</h2>
                <SearchForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por qué usar ClasicAR */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">¿Por qué usar ClasicAR?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FaCamera className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reconocimiento con IA</h3>
              <p className="text-neutral-600">Subí una foto, descríbelo en chat o ingresá el VIN. Te identificamos el modelo, año y variante en segundos.</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FaClock className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Búsqueda + Variantes</h3>
              <p className="text-neutral-600">Buscamos en múltiples sitios y te mostramos variantes (otros años, configuraciones, precios) para que elijas la mejor.</p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FaDollarSign className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cotización con E-COMEX</h3>
              <p className="text-neutral-600">Cotización completa de importación con FOB, flete, impuestos y honorarios. Hecha por nuestro partner E-COMEX.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="py-16 bg-neutral-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">¿Cómo Funciona?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
            <Step n={1} title="Reconocé" icon={<FaCamera className="text-primary text-3xl" />}>
              Foto, chat o VIN — identificá tu próximo vehículo en segundos.
            </Step>
            <Step n={2} title="Buscá" icon={<FaSearch className="text-primary text-3xl" />}>
              Filtrá miles de listados de eBay, Bring a Trailer, Hemmings y más.
            </Step>
            <Step n={3} title="Compará variantes" icon={<FaExchangeAlt className="text-primary text-3xl" />}>
              Vemos otros años, configuraciones y opciones para que decidas mejor.
            </Step>
            <Step n={4} title="Importá con E-COMEX" icon={<FaHandshake className="text-primary text-3xl" />} last>
              Cotización profesional de importación con nuestro partner oficial.
            </Step>
          </div>

          <div className="text-center mt-12 flex flex-wrap justify-center gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-md transition-colors text-base flex items-center gap-2"
              onClick={() => setLocation('/como-trabajamos')}
            >
              Ver cómo trabajamos
              <FaArrowRight />
            </Button>
            <Button
              className="bg-white text-primary hover:bg-gray-100 border border-primary font-semibold py-3 px-6 rounded-md transition-colors text-base flex items-center gap-2"
              onClick={() => setLocation('/guia-importacion')}
            >
              Guía de importación
            </Button>
          </div>
        </div>
      </section>

      {/* Búsquedas Populares */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Búsquedas Populares</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 staggered-grid">
            {[
              // Mix v1.1: 50% clásicos icónicos + 50% modernos / eléctricos / 0km
              { make: 'ford', model: 'mustang', year: '1965', label: 'Ford Mustang 1965' },
              { make: 'chevrolet', model: 'corvette', year: '1963', label: 'Chevrolet Corvette 1963' },
              { make: 'porsche', model: '911', year: '1980', label: 'Porsche 911 1980' },
              { make: 'jaguar', model: 'e-type', year: '1964', label: 'Jaguar E-Type 1964' },
              { make: 'byd', model: 'dolphin', year: '2024', label: 'BYD Dolphin 2024' },
              { make: 'tesla', model: 'model 3', year: '2022', label: 'Tesla Model 3 2022' },
              { make: 'toyota', model: 'hilux', year: '2023', label: 'Toyota Hilux 2023' },
              { make: 'porsche', model: 'taycan', year: '2023', label: 'Porsche Taycan 2023' },
            ].map((item, index) => (
              <PopularSearchCard
                key={index}
                make={item.make}
                model={item.model}
                year={item.year}
                label={item.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/90 to-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">¿Listo para importar?</h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Encontramos el vehículo, mostramos las variantes y cotizamos la importación con E-COMEX. Vos elegís.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 rounded-md transition-colors text-base inline-flex items-center gap-2"
              onClick={() => setLocation('/busqueda')}
            >
              Comenzar búsqueda
              <FaSearch />
            </Button>
            <Button
              className="bg-transparent text-white hover:bg-white/10 border border-white font-semibold py-3 px-8 rounded-md transition-colors text-base inline-flex items-center gap-2"
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

type StepProps = {
  n: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
};

const Step = ({ n, title, icon, children, last }: StepProps) => (
  <div className="relative">
    <div className="bg-white rounded-lg shadow-md p-6 z-10 relative">
      <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto -mt-10 mb-4 border-4 border-white">
        <span className="font-bold">{n}</span>
      </div>
      <h3 className="text-xl font-semibold text-center mb-3">{title}</h3>
      <p className="text-neutral-600 text-center">{children}</p>
      <div className="flex justify-center mt-4">{icon}</div>
    </div>
    {!last && <div className="hidden lg:block absolute top-1/2 left-full w-12 h-2 bg-neutral-300 -translate-y-1/2 z-0"></div>}
  </div>
);

type PopularSearchCardProps = {
  make: string;
  model: string;
  year: string;
  label: string;
};

const PopularSearchCard = ({ make, model, year, label }: PopularSearchCardProps) => {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/busqueda?query=${make} ${model}&year=${year}`);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-5 cursor-pointer hover:shadow-lg transition-all border border-neutral-200 staggered-item"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 rounded-full p-3">
          <FaCarSide className="text-primary text-xl" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-800">{label}</h3>
          <p className="text-neutral-500 text-sm">Ver listados disponibles</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
