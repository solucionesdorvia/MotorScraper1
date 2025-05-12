import { useLocation } from 'wouter';
import { FaCarSide } from 'react-icons/fa';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchForm from '@/components/search/SearchForm';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="bg-gradient-primary py-12 md:py-20 flex-grow">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-6">
            ImportacionPrueba: Importa Tu Auto a Argentina
          </h1>
          <p className="text-white/80 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Busca vehículos clásicos (1900-1995) en eBay Motors y Bring a Trailer. Servicio de gestión para importar tu auto a Argentina con facilidad.
          </p>
          
          <SearchForm defaultQuery="ford mustang" defaultYear="1965" />
        </div>
      </section>
      
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">¿Cómo Funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Busca</h3>
              <p className="text-neutral-600">Ingresa la marca, modelo y año del vehículo clásico que deseas importar.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Compara</h3>
              <p className="text-neutral-600">Visualiza anuncios de eBay Motors y Bring a Trailer en tiempo real para comparar precios.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Contacta</h3>
              <p className="text-neutral-600">Elige el mejor vehículo y contacta con nuestro gestor para importarlo a Argentina.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-neutral-200">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Búsquedas Populares</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { make: 'ford', model: 'mustang', year: '1965', label: 'Ford Mustang 1965' },
              { make: 'volkswagen', model: 'beetle', year: '1970', label: 'Volkswagen Beetle 1970' },
              { make: 'chevrolet', model: 'corvette', year: '1963', label: 'Chevrolet Corvette 1963' },
              { make: 'porsche', model: '911', year: '1980', label: 'Porsche 911 1980' },
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
    setLocation(`/search?query=${make} ${model}&year=${year}`);
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-all"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <FaCarSide className="text-primary text-2xl" />
        <h3 className="font-medium">{label}</h3>
      </div>
    </div>
  );
};



export default Home;
