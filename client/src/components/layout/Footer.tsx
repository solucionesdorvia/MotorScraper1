import { FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaEnvelope, FaHandshake } from 'react-icons/fa';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EcomexBadge from '@/components/EcomexBadge';

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-300 py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="footer-heading">ClasicAR</h3>
            <p className="text-sm">
              Buscamos, identificamos y cotizamos la importación de todo tipo de vehículos a Argentina:
              clásicos, 0km, eléctricos e híbridos. Hacemos el sourcing y la curaduría — la cotización
              y el trámite los maneja nuestro partner <EcomexBadge variant="inline" />.
            </p>
            <div className="flex mt-4 gap-4">
              <a href="#" className="text-neutral-300 hover:text-primary">
                <FaFacebookF />
              </a>
              <a href="#" className="text-neutral-300 hover:text-primary">
                <FaTwitter />
              </a>
              <a href="#" className="text-neutral-300 hover:text-primary">
                <FaInstagram />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="footer-heading">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/busqueda" className="footer-link">Buscar Vehículos</Link></li>
              <li><Link href="/reconocer" className="footer-link">Reconocer Vehículo</Link></li>
              <li><Link href="/como-trabajamos" className="footer-link">Cómo Trabajamos</Link></li>
              <li><Link href="/guia-importacion" className="footer-link">Guía de Importación</Link></li>
              <li><Link href="/favoritos" className="footer-link">Mis Favoritos</Link></li>
              <li><Link href="/perfil" className="footer-link">Mi Cuenta</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="footer-heading">Información Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/requisitos" className="footer-link">Requisitos Legales</Link></li>
              <li><Link href="/aranceles" className="footer-link">Aranceles y Costos</Link></li>
              <li><Link href="/restricciones" className="footer-link">Restricciones</Link></li>
              <li><Link href="/terminos" className="footer-link">Términos y Condiciones</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="footer-heading">Contacto</h3>
            <div className="space-y-3 text-sm mt-4">
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-primary" />
                <a href="mailto:contacto@clasicar.com.ar" className="hover:text-primary">contacto@clasicar.com.ar</a>
              </div>
              <div className="flex items-center gap-2">
                <FaWhatsapp className="text-primary" />
                <a href="https://wa.me/5491112345678" className="hover:text-primary">+54 9 11 1234-5678</a>
              </div>
              <form className="flex mt-4">
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
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-neutral-700 text-center text-sm">
          <p>© {new Date().getFullYear()} ClasicAR. Todos los derechos reservados. Este es un servicio que busca en otros sitios web.</p>
          <p className="mt-2 text-neutral-500">ClasicAR no está afiliado a eBay Motors o Bring a Trailer.</p>
          <p className="mt-1 text-neutral-500 flex items-center justify-center gap-1.5">
            <FaHandshake className="text-primary" />
            ClasicAR es partner oficial de <EcomexBadge variant="inline" /> para cotizaciones de importación.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
