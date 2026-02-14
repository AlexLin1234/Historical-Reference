import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | null): string {
  if (!date) return 'Date unknown';
  return date;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '\u2026';
}

export function buildImageUrl(
  source: string,
  baseUrl: string | null,
  size: 'thumb' | 'full' = 'thumb'
): string | null {
  if (!baseUrl) return null;

  if (source === 'va') {
    const dim = size === 'thumb' ? '!400,400' : '!1200,1200';
    return `${baseUrl}/full/${dim}/0/default.jpg`;
  }

  return baseUrl;
}
