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
            <h3 className="footer-heading">AutoScout</h3>
            <p className="text-sm">
              Find your next car by comparing listings from eBay Motors and Edmunds in one place. 
              Save time and make better decisions with our comprehensive search.
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
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-it-works" className="footer-link">How It Works</Link></li>
              <li><Link href="/about" className="footer-link">About Us</Link></li>
              <li><Link href="/contact" className="footer-link">Contact Support</Link></li>
              <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/terms" className="footer-link">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="footer-heading">Newsletter</h3>
            <p className="text-sm mb-3">Subscribe to get updates on new features and car deals.</p>
            <form className="flex">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 text-white rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
              <Button 
                type="submit" 
                className="bg-primary text-white px-4 py-2 text-sm font-medium rounded-r-md hover:bg-primary/90 rounded-l-none"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-700 text-center text-sm">
          <p>© {new Date().getFullYear()} AutoScout. All rights reserved. This is a service that searches other websites.</p>
          <p className="mt-2 text-neutral-500">AutoScout is not affiliated with eBay Motors or Edmunds.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
