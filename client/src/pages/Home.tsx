import { useLocation } from 'wouter';
import { FaCarSide, FaSearch, FaCheckCircle, FaClock, FaDollarSign, FaArrowRight, FaClipboardCheck, FaFileInvoiceDollar } from 'react-icons/fa';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchForm from '@/components/search/SearchForm';
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
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                El buscador para importar vehículos clásicos a Argentina
              </h1>
              <p className="text-white/90 text-lg mb-8 max-w-xl">
                Encuentra autos clásicos entre 1900-1995 disponibles para importar. Verificamos elegibilidad, costos y trámites aduaneros.
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
                  onClick={() => setLocation('/guia-importacion')}
                >
                  Guía de Importación
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">Encuentra tu auto clásico</h2>
                <SearchForm defaultQuery="ford mustang" defaultYear="1965" />
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
                <FaCheckCircle className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verificación de Elegibilidad</h3>
              <p className="text-neutral-600">Confirmamos si el vehículo cumple con los requisitos para ser importado a Argentina según la normativa vigente.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FaClock className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ahorro de Tiempo</h3>
              <p className="text-neutral-600">Optimizamos tu búsqueda mostrando solo vehículos importables y gestionamos todos los trámites necesarios.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg hover:shadow-md transition-all">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FaDollarSign className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Costos Transparentes</h3>
              <p className="text-neutral-600">Detallamos todos los costos involucrados: precio del vehículo, impuestos, transporte y gestión aduanera.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Cómo Funciona */}
      <section className="py-16 bg-neutral-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">¿Cómo Funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            <div className="relative">
              <div className="bg-white rounded-lg shadow-md p-6 z-10 relative">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto -mt-10 mb-4 border-4 border-white">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Busca</h3>
                <p className="text-neutral-600 text-center">Utiliza nuestros filtros para encontrar el auto de tus sueños entre miles de opciones.</p>
                <div className="flex justify-center mt-4">
                  <FaSearch className="text-primary text-3xl" />
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 left-full w-12 h-2 bg-neutral-300 -translate-y-1/2 z-0"></div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-lg shadow-md p-6 z-10 relative">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto -mt-10 mb-4 border-4 border-white">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Verifica</h3>
                <p className="text-neutral-600 text-center">Analiza los detalles del vehículo, su historial y su elegibilidad para importación.</p>
                <div className="flex justify-center mt-4">
                  <FaClipboardCheck className="text-primary text-3xl" />
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 left-full w-12 h-2 bg-neutral-300 -translate-y-1/2 z-0"></div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-lg shadow-md p-6 z-10 relative">
                <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto -mt-10 mb-4 border-4 border-white">
                  <span className="font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Importa</h3>
                <p className="text-neutral-600 text-center">Sigue nuestra guía paso a paso y gestiona la importación con nuestra ayuda experta.</p>
                <div className="flex justify-center mt-4">
                  <FaFileInvoiceDollar className="text-primary text-3xl" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-md transition-colors text-base flex items-center mx-auto gap-2"
              onClick={() => setLocation('/guia-importacion')}
            >
              Ver Guía Completa
              <FaArrowRight />
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
              { make: 'ford', model: 'mustang', year: '1965', label: 'Ford Mustang 1965' },
              { make: 'volkswagen', model: 'beetle', year: '1970', label: 'Volkswagen Beetle 1970' },
              { make: 'chevrolet', model: 'corvette', year: '1963', label: 'Chevrolet Corvette 1963' },
              { make: 'porsche', model: '911', year: '1980', label: 'Porsche 911 1980' },
              { make: 'mercedes', model: 'sl', year: '1967', label: 'Mercedes SL 1967' },
              { make: 'ferrari', model: '308', year: '1978', label: 'Ferrari 308 1978' },
              { make: 'jaguar', model: 'e-type', year: '1964', label: 'Jaguar E-Type 1964' },
              { make: 'cadillac', model: 'eldorado', year: '1959', label: 'Cadillac Eldorado 1959' },
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
          <h2 className="text-2xl md:text-3xl font-bold mb-6">¿Listo para importar tu auto clásico?</h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Comienza tu búsqueda ahora y descubre cientos de opciones disponibles para importar a Argentina.
          </p>
          <Button 
            className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 rounded-md transition-colors text-base inline-flex items-center gap-2"
            onClick={() => setLocation('/busqueda')}
          >
            Comenzar Búsqueda
            <FaSearch />
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

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
