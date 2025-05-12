import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-300 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="footer-heading">ImportacionPrueba</h3>
            <p className="text-sm">
              Servicio especializado en importación de vehículos clásicos (1900-1995) a Argentina. 
              Ofrecemos gestión integral de trámites aduaneros, logística y documentación.
            </p>
            <div className="flex mt-4 gap-4">
              <a href="#" className="text-neutral-300 hover:text-white">
                <FaFacebookF />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white">
                <FaTwitter />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white">
                <FaInstagram />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="footer-heading">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-it-works" className="footer-link">¿Cómo Funciona?</Link></li>
              <li><Link href="/about" className="footer-link">Sobre Nosotros</Link></li>
              <li><Link href="/contact" className="footer-link">Contactar al Gestor</Link></li>
              <li><Link href="/requisitos" className="footer-link">Requisitos de Importación</Link></li>
              <li><Link href="/aranceles" className="footer-link">Aranceles y Costos</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="footer-heading">Contacto con el Gestor</h3>
            <p className="text-sm mb-3">Déjanos tu correo y te contactaremos para iniciar tu proceso de importación.</p>
            <form className="flex">
              <Input 
                type="email" 
                placeholder="Tu email" 
                className="px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 text-white rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
              <Button 
                type="submit" 
                className="bg-primary text-white px-4 py-2 text-sm font-medium rounded-r-md hover:bg-primary/90 rounded-l-none"
              >
                Enviar
              </Button>
            </form>
            <p className="text-xs mt-2 text-neutral-500">* Nuestro gestor tiene más de 15 años de experiencia en importación de autos clásicos a Argentina.</p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-700 text-center text-sm">
          <p>© {new Date().getFullYear()} ImportacionPrueba. Todos los derechos reservados. Este es un servicio que busca en otros sitios web.</p>
          <p className="mt-2 text-neutral-500">ImportacionPrueba no está afiliado a eBay Motors o Bring a Trailer.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
