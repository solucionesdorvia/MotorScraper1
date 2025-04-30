import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | undefined): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number | undefined): string {
  if (!mileage) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(mileage) + ' mi';
}

export function getDefaultImageUrl(make: string): string {
  // Crear una URL que dependa de la marca para tener diferentes placeholders por marca
  let brandColor = "#4f46e5"; // Color predeterminado (Indigo)
  
  // Asignar colores según la marca
  if (make.toLowerCase() === 'ford') brandColor = "#0052cc";
  if (make.toLowerCase() === 'chevrolet') brandColor = "#d62828";
  if (make.toLowerCase() === 'toyota') brandColor = "#ce181e";
  if (make.toLowerCase() === 'honda') brandColor = "#047857";
  if (make.toLowerCase() === 'bmw') brandColor = "#0369a1";
  if (make.toLowerCase() === 'mercedes-benz') brandColor = "#27272a";
  
  // Usar una imagen base64 pre-codificada según la marca
  if (make.toLowerCase() === 'ford') {
    return "data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='600' fill='%23f8fafc'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='%230052cc' opacity='0.1'/%3E%3Cpath d='M400 175 L500 300 L450 300 L450 400 L350 400 L350 300 L300 300 Z' fill='%230052cc'/%3E%3Ctext x='400' y='500' font-family='Arial' font-size='24' text-anchor='middle' fill='%230052cc'%3EFORD%3C/text%3E%3Ctext x='400' y='530' font-family='Arial' font-size='16' text-anchor='middle' fill='%2364748b'%3EImagen no disponible%3C/text%3E%3C/svg%3E";
  }
  
  if (make.toLowerCase() === 'chevrolet') {
    return "data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='600' fill='%23f8fafc'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='%23d62828' opacity='0.1'/%3E%3Cpath d='M400 175 L500 300 L450 300 L450 400 L350 400 L350 300 L300 300 Z' fill='%23d62828'/%3E%3Ctext x='400' y='500' font-family='Arial' font-size='24' text-anchor='middle' fill='%23d62828'%3ECHEVROLET%3C/text%3E%3Ctext x='400' y='530' font-family='Arial' font-size='16' text-anchor='middle' fill='%2364748b'%3EImagen no disponible%3C/text%3E%3C/svg%3E";
  }
  
  // Imagen predeterminada para cualquier otra marca
  return "data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='600' fill='%23f8fafc'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='%234f46e5' opacity='0.1'/%3E%3Cpath d='M400 175 L500 300 L450 300 L450 400 L350 400 L350 300 L300 300 Z' fill='%234f46e5'/%3E%3Ctext x='400' y='500' font-family='Arial' font-size='24' text-anchor='middle' fill='%234f46e5'%3E" + make.toUpperCase() + "%3C/text%3E%3Ctext x='400' y='530' font-family='Arial' font-size='16' text-anchor='middle' fill='%2364748b'%3EImagen no disponible%3C/text%3E%3C/svg%3E";
}

export function getSourceLabel(source: string): string {
  if (source === 'ebay') return 'eBay Motors';
  if (source === 'edmunds') return 'Edmunds';
  if (source === 'cars.com') return 'Cars.com';
  if (source === 'hemmings.com') return 'Hemmings';
  if (source === 'bringatrailer' || source === 'bringatrailer.com') return 'Bring a Trailer';
  if (source === 'classiccars.com') return 'Classic Cars';
  return source;
}

export function getSourceClassName(source: string): string {
  if (source === 'ebay') return 'bg-label-ebay';
  if (source === 'edmunds') return 'bg-label-edmunds';
  if (source === 'cars.com') return 'bg-label-cars';
  if (source === 'hemmings.com') return 'bg-label-hemmings';
  if (source === 'bringatrailer.com') return 'bg-label-bat';
  if (source === 'classiccars.com') return 'bg-label-classiccars';
  return 'bg-gray-500';
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function buildSearchUrl(
  make: string | undefined, 
  model: string | undefined, 
  year: string | undefined,
  ebay: boolean = true,
  edmunds: boolean = true,
  hemmings: boolean = true,
  bringatrailer: boolean = true,
  classiccars: boolean = true
): string {
  const params = new URLSearchParams();
  
  if (make) params.append('make', make);
  if (model) params.append('model', model);
  if (year) params.append('year', year);
  if (!ebay) params.append('ebay', 'false');
  if (!edmunds) params.append('edmunds', 'false');
  if (!hemmings) params.append('hemmings', 'false');
  if (!bringatrailer) params.append('bringatrailer', 'false');
  if (!classiccars) params.append('classiccars', 'false');
  
  return `/search?${params.toString()}`;
}

export function buildEbayUrl(make: string, model: string, year?: string): string {
  const query = `${make} ${model} ${year || ''}`.trim();
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&_from=R40&_trksid=m570.l1313`;
}

export function buildEdmundsUrl(make: string, model: string, year?: string): string {
  const yearParam = year ? `${year}-${year}` : '';
  return `https://www.edmunds.com/inventory/srp.html?inventorytype=cpo%2Cused&year=${yearParam}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(make)}%7C${encodeURIComponent(model)}&radius=100`;
}

export function buildCarsUrl(make: string, model: string, year?: string): string {
  const yearParam = year ? `&year_min=${year}&year_max=${year}` : '';
  return `https://www.cars.com/shopping/results/?dealer_id=&keyword=${encodeURIComponent(make)}+${encodeURIComponent(model)}&list_price_max=&list_price_min=&makes[]=${encodeURIComponent(make)}&maximum_distance=all&mileage_max=&models[]=${encodeURIComponent(model)}${yearParam}&page_size=20&sort=best_match_desc&stock_type=all&year_max=&year_min=&zip=`;
}

export function buildHemmingsUrl(make: string, model: string, year?: string): string {
  return `https://www.hemmings.com/classifieds/cars-for-sale`;
}

export function buildBringATrailerUrl(make: string, model: string, year?: string): string {
  const yearParam = year ? `&q=${year}` : '';
  return `https://bringatrailer.com/search/?s=${encodeURIComponent(make)}+${encodeURIComponent(model)}${yearParam}`;
}

export function buildClassicCarsUrl(make: string, model: string, year?: string): string {
  const yearParam = year ? `&year=${year}-${year}` : '';
  return `https://classiccars.com/listings?term=${encodeURIComponent(make)}+${encodeURIComponent(model)}${yearParam}`;
}

export const carMakes = [
  { value: "ford", label: "Ford" },
  { value: "chevrolet", label: "Chevrolet" },
  { value: "toyota", label: "Toyota" },
  { value: "honda", label: "Honda" },
  { value: "dodge", label: "Dodge" },
  { value: "bmw", label: "BMW" },
  { value: "mercedes-benz", label: "Mercedes-Benz" },
  { value: "audi", label: "Audi" },
  { value: "nissan", label: "Nissan" },
  { value: "jeep", label: "Jeep" },
  { value: "lexus", label: "Lexus" },
  { value: "subaru", label: "Subaru" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "kia", label: "Kia" },
  { value: "hyundai", label: "Hyundai" },
];

export const fordModels = [
  { value: "mustang", label: "Mustang" },
  { value: "f-150", label: "F-150" },
  { value: "explorer", label: "Explorer" },
  { value: "escape", label: "Escape" },
  { value: "edge", label: "Edge" },
  { value: "bronco", label: "Bronco" },
  { value: "ranger", label: "Ranger" },
  { value: "expedition", label: "Expedition" },
  { value: "fusion", label: "Fusion" },
  { value: "focus", label: "Focus" },
];

export const years = [
  // Años 1995-1900
  ...Array.from({ length: 96 }, (_, i) => {
    const year = 1995 - i;
    return { value: year.toString(), label: year.toString() };
  })
];

export const bodyTypes = [
  { value: "coupe", label: "Coupe" },
  { value: "convertible", label: "Convertible" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "wagon", label: "Wagon" },
  { value: "hatchback", label: "Hatchback" },
  { value: "fastback", label: "Fastback" },
];

export const transmissions = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
  { value: "cvt", label: "CVT" },
  { value: "dual_clutch", label: "Dual Clutch" },
];

export const colors = [
  { value: "black", label: "Black", bg: "bg-black" },
  { value: "white", label: "White", bg: "bg-white" },
  { value: "silver", label: "Silver", bg: "bg-gray-300" },
  { value: "gray", label: "Gray", bg: "bg-gray-500" },
  { value: "red", label: "Red", bg: "bg-red-600" },
  { value: "blue", label: "Blue", bg: "bg-blue-600" },
  { value: "green", label: "Green", bg: "bg-green-600" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-600" },
];

export const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "mileage_asc", label: "Mileage: Low to High" },
  { value: "year_desc", label: "Newest Listings" },
];
