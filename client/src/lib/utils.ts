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
  // Base64 encoded SVG placeholder of a car silhouette
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzZjRmNiIvPjxwYXRoIGQ9Ik0yMDkuNiAzNjIuN2MtNS42IDAtMTAuMS00LjUtMTAuMS0xMC4xIDAtNS42IDQuNS0xMC4xIDEwLjEtMTAuMSA1LjYgMCAxMC4xIDQuNSAxMC4xIDEwLjEgMCA1LjYtNC41IDEwLjEtMTAuMSAxMC4xek01OTAuNCAzNjIuN2MtNS42IDAtMTAuMS00LjUtMTAuMS0xMC4xIDAtNS42IDQuNS0xMC4xIDEwLjEtMTAuMSA1LjYgMCAxMC4xIDQuNSAxMC4xIDEwLjEgMCA1LjYtNC41IDEwLjEtMTAuMSAxMC4xeiIgZmlsbD0iIzllYTNiMCIvPjxwYXRoIGQ9Ik02NDAuNyAzMzZjMCAzLjgtLjUgNi42LTEuNiA4LjQtMS4xIDEuOC0zIDMuNC01LjcgNC44LTIuNyAxLjQtNi4yIDIuMy0xMC41IDIuOC00LjMuNS05LjcuNy0xNi4xLjdIMTkzLjJjLTYuNSAwLTExLjgtLjItMTYuMS0uNy00LjMtLjUtNy44LTEuNC0xMC41LTIuOC0yLjctMS40LTQuNi0zLTUuNy00LjgtMS4xLTEuOC0xLjYtNC42LTEuNi04LjR2LTcuM2MwLTcuOC43LTE0LjcgMi4yLTIwLjggMS41LTYuMSAzLjUtMTEuMyA2LjItMTUuNiAyLjctNC4zIDYtNy44IDkuOS0xMC42IDMuOS0yLjggOC4xLTUuMiAxMi44LTcuMyA0LjctMi4xIDkuOC0zLjkgMTUuNC01LjYgNS42LTEuNiAxMS41LTMuMSAxNy43LTQuNSA2LjItMS40IDEyLjYtMi43IDE5LjMtMy45IDYuNy0xLjIgMTMuNi0yLjQgMjAuOC0zLjVsNjAuOS05LjZjMTcuNi0yLjggMzIuMS01LjEgNDMuNS02LjkgMTEuNC0xLjggMjEuNC0zLjEgMzAuMS00IDguNy0uOSAxNi42LTEuMyAyMy44LTEuM3MxNS4xLjQgMjMuOCAxLjNjOC43LjkgMTguNyAyLjIgMzAuMSA0IDExLjQgMS44IDI1LjkgNC4xIDQzLjUgNi45bDYwLjkgOS42YzcuMiAxLjEgMTQuMSAyLjMgMjAuOCAzLjUgNi43IDEuMiAxMy4xIDIuNSAxOS4zIDMuOXM5uyB1LjYgMTEuNSAzLjF2OS44aC00MHoiIGZpbGw9IiM5ZWEzYjAiLz48L3N2Zz4=";
}

export function getSourceLabel(source: string): string {
  if (source === 'ebay') return 'eBay Motors';
  if (source === 'edmunds') return 'Edmunds';
  return source;
}

export function getSourceClassName(source: string): string {
  if (source === 'ebay') return 'bg-label-ebay';
  if (source === 'edmunds') return 'bg-label-edmunds';
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
  edmunds: boolean = true
): string {
  const params = new URLSearchParams();
  
  if (make) params.append('make', make);
  if (model) params.append('model', model);
  if (year) params.append('year', year);
  if (!ebay) params.append('ebay', 'false');
  if (!edmunds) params.append('edmunds', 'false');
  
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
  // Años recientes (2024-2002)
  ...Array.from({ length: 23 }, (_, i) => {
    const year = 2024 - i;
    return { value: year.toString(), label: year.toString() };
  }),
  // Años 2001-1996
  ...Array.from({ length: 6 }, (_, i) => {
    const year = 2001 - i;
    return { value: year.toString(), label: year.toString() };
  }),
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
