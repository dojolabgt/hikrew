import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Remove leading slash to prevent double slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${cleanBaseUrl}/${cleanPath}`;
}

export function formatCurrency(amount: number, currency: string = 'GTQ', locale: string = 'es-GT') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
