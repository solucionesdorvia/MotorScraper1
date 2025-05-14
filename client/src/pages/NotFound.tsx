import { FaCarSide, FaHome, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLocation } from 'wouter';

const NotFound = () => {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-grow flex items-center justify-center py-16 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-secondary p-8 text-center">
              <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCarSide className="text-white text-4xl" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-2">404</h1>
              <h2 className="text-xl text-white/90 font-medium">Página no encontrada</h2>
            </div>
            
            <div className="p-8 text-center">
              <h3 className="text-2xl font-semibold mb-4">¡Oops! Parece que nos hemos perdido en el camino</h3>
              <p className="text-neutral-600 mb-8 max-w-lg mx-auto">
                La página que estás buscando no existe o ha sido trasladada a otra ubicación. Disculpa las molestias.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Button 
                  className="bg-secondary hover:bg-secondary/90 text-white font-medium py-3 flex items-center justify-center gap-2"
                  onClick={() => setLocation('/')}
                >
                  <FaHome />
                  <span>Ir al Inicio</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-secondary text-secondary hover:bg-secondary/10 font-medium py-3 flex items-center justify-center gap-2"
                  onClick={() => setLocation('/busqueda')}
                >
                  <FaSearch />
                  <span>Buscar Vehículos</span>
                </Button>
              </div>
              
              <button 
                className="mt-6 text-neutral-500 hover:text-secondary flex items-center gap-2 mx-auto"
                onClick={() => window.history.back()}
              >
                <FaArrowLeft className="text-sm" />
                <span>Volver a la página anterior</span>
              </button>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-neutral-500 text-sm">
              Si crees que esto es un error, por favor <a href="/contact" className="text-secondary hover:underline">contáctanos</a>.
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default NotFound;