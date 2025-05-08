import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de manera eficiente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un precio en dólares
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "N/A";
  
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formatea el kilometraje
 */
export function formatMileage(mileage: number | null | undefined): string {
  if (mileage === null || mileage === undefined) return "N/A";
  return new Intl.NumberFormat("es-ES").format(mileage) + " km";
}

/**
 * Devuelve una clase CSS para un tipo de fuente
 */
export function getSourceClassName(source: string): string {
  if (!source) return "bg-neutral-600";
  
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes("ebay")) return "bg-blue-600";
  if (sourceLower.includes("bring") || sourceLower === "bringatrailer") return "bg-red-600";
  if (sourceLower.includes("hemmings")) return "bg-green-600";
  if (sourceLower.includes("classic")) return "bg-purple-600";
  if (sourceLower.includes("edmunds")) return "bg-orange-600";
  
  return "bg-neutral-600";
}

/**
 * Devuelve una etiqueta para un tipo de fuente
 */
export function getSourceLabel(source: string): string {
  if (!source) return "Desconocido";
  
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes("ebay")) return "eBay Motors";
  if (sourceLower.includes("bring") || sourceLower === "bringatrailer") return "Bring a Trailer";
  if (sourceLower.includes("hemmings")) return "Hemmings";
  if (sourceLower.includes("classic")) return "ClassicCars";
  if (sourceLower.includes("edmunds")) return "Edmunds";
  
  return source;
}

/**
 * Devuelve una URL predeterminada para una imagen según la marca
 */
export function getDefaultImageUrl(make: string): string {
  return "https://via.placeholder.com/300x200?text=No+Image";
}

/**
 * Construye una URL para eBay Motors
 */
export function buildEbayUrl(make: string, model: string, year?: string): string {
  const query = year ? `${year} ${make} ${model}` : `${make} ${model}`;
  return `https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_nkw=${encodeURIComponent(query)}`;
}

/**
 * Construye una URL para Edmunds
 */
export function buildEdmundsUrl(make: string, model: string, year?: string): string {
  return `https://www.edmunds.com/used-${make.toLowerCase()}-${model.toLowerCase()}/${year ? year + '/' : ''}`;
}

/**
 * Construye una URL para Cars.com
 */
export function buildCarsUrl(make: string, model: string, year?: string): string {
  return `https://www.cars.com/shopping/results/?stock_type=used&makes[]=${make.toLowerCase()}&models[]=${model.toLowerCase()}${year ? '&year_min=' + year + '&year_max=' + year : ''}`;
}

/**
 * Construye una URL para Hemmings
 */
export function buildHemmingsUrl(make: string, model: string, year?: string): string {
  const query = year ? `${year} ${make} ${model}` : `${make} ${model}`;
  return `https://www.hemmings.com/classifieds/?q=${encodeURIComponent(query)}`;
}

/**
 * Construye una URL para Bring a Trailer
 */
export function buildBringATrailerUrl(make: string, model: string, year?: string): string {
  const query = year ? `${make} ${model} ${year}` : `${make} ${model}`;
  return `https://bringatrailer.com/auctions/?search=${query.replace(/ /g, '+')}`;
}

/**
 * Construye una URL para ClassicCars.com
 */
export function buildClassicCarsUrl(make: string, model: string, year?: string): string {
  return `https://classiccars.com/listings/find/${year || ''}/${make.toLowerCase()}/${model.toLowerCase()}`;
}

/**
 * Lista de años para vehículos clásicos (1900-1995) 
 */
export const years = [
  { value: "1995", label: "1995" },
  { value: "1994", label: "1994" },
  { value: "1993", label: "1993" },
  { value: "1992", label: "1992" },
  { value: "1991", label: "1991" },
  { value: "1990", label: "1990" },
  { value: "1989", label: "1989" },
  { value: "1988", label: "1988" },
  { value: "1987", label: "1987" },
  { value: "1986", label: "1986" },
  { value: "1985", label: "1985" },
  { value: "1984", label: "1984" },
  { value: "1983", label: "1983" },
  { value: "1982", label: "1982" },
  { value: "1981", label: "1981" },
  { value: "1980", label: "1980" },
  { value: "1979", label: "1979" },
  { value: "1978", label: "1978" },
  { value: "1977", label: "1977" },
  { value: "1976", label: "1976" },
  { value: "1975", label: "1975" },
  { value: "1974", label: "1974" },
  { value: "1973", label: "1973" },
  { value: "1972", label: "1972" },
  { value: "1971", label: "1971" },
  { value: "1970", label: "1970" },
  { value: "1969", label: "1969" },
  { value: "1968", label: "1968" },
  { value: "1967", label: "1967" },
  { value: "1966", label: "1966" },
  { value: "1965", label: "1965" },
  { value: "1964", label: "1964" },
  { value: "1963", label: "1963" },
  { value: "1962", label: "1962" },
  { value: "1961", label: "1961" },
  { value: "1960", label: "1960" },
  { value: "1955", label: "1955" },
  { value: "1950", label: "1950" },
  { value: "1945", label: "1945" },
  { value: "1940", label: "1940" },
  { value: "1935", label: "1935" },
  { value: "1930", label: "1930" },
  { value: "1925", label: "1925" },
  { value: "1920", label: "1920" },
  { value: "1915", label: "1915" },
  { value: "1910", label: "1910" },
  { value: "1905", label: "1905" },
  { value: "1900", label: "1900" },
];

/**
 * Lista de tipos de carrocería
 */
export const bodyTypes = [
  { value: "sedan", label: "Sedán" },
  { value: "coupe", label: "Coupé" },
  { value: "convertible", label: "Convertible" },
  { value: "wagon", label: "Wagon" },
  { value: "hatchback", label: "Hatchback" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup" },
  { value: "van", label: "Van/Minivan" },
];

/**
 * Lista de colores disponibles
 */
export const colors = [
  { value: "black", label: "Negro" },
  { value: "white", label: "Blanco" },
  { value: "gray", label: "Gris" },
  { value: "silver", label: "Plata" },
  { value: "red", label: "Rojo" },
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "yellow", label: "Amarillo" },
  { value: "orange", label: "Naranja" },
  { value: "brown", label: "Marrón" },
  { value: "purple", label: "Púrpura" },
  { value: "gold", label: "Dorado" },
];

/**
 * Lista de transmisiones disponibles
 */
export const transmissions = [
  { value: "automatic", label: "Automática" },
  { value: "manual", label: "Manual" },
  { value: "semi-automatic", label: "Semi-automática" },
  { value: "cvt", label: "CVT" },
  { value: "dual-clutch", label: "Doble embrague" },
];

/**
 * Opciones de ordenación
 */
export const sortOptions = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "year_asc", label: "Año: antiguo a nuevo" },
  { value: "year_desc", label: "Año: nuevo a antiguo" },
];