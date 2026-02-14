import type { TimePeriod, Category } from '@/types/artifact';

export const TIME_PERIODS: TimePeriod[] = [
  { label: 'Ancient (before 500 CE)', startYear: -3000, endYear: 500 },
  { label: 'Medieval (500–1400)', startYear: 500, endYear: 1400 },
  { label: 'Renaissance (1400–1600)', startYear: 1400, endYear: 1600 },
  { label: 'Early Modern (1600–1800)', startYear: 1600, endYear: 1800 },
  { label: '19th Century (1800–1900)', startYear: 1800, endYear: 1900 },
  { label: 'Modern (1900–present)', startYear: 1900, endYear: 2100 },
];

export const CATEGORIES: Category[] = [
  { value: 'arms-armor', label: 'Arms & Armor' },
  { value: 'textiles', label: 'Textiles & Costume' },
  { value: 'ceramics', label: 'Ceramics' },
  { value: 'metalwork', label: 'Metalwork' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'paintings', label: 'Paintings' },
  { value: 'sculpture', label: 'Sculpture' },
  { value: 'prints', label: 'Prints & Drawings' },
];

export const CATEGORY_MAP: Record<string, { met?: string; va?: string; cleveland?: string }> = {
  'arms-armor': { met: 'Arms and Armor', va: 'Metalwork', cleveland: 'Arms and Armor' },
  'textiles': { met: 'Textiles', va: 'Textiles and Fashion', cleveland: 'Textiles' },
  'ceramics': { met: 'Ceramics', va: 'Ceramics', cleveland: 'Ceramics' },
  'metalwork': { met: 'Metalwork', va: 'Metalwork', cleveland: 'Metalwork' },
  'furniture': { met: 'Furniture', va: 'Furniture', cleveland: 'Furniture' },
  'paintings': { met: 'Paintings', va: 'Paintings', cleveland: 'Paintings' },
  'sculpture': { met: 'Sculpture', va: 'Sculpture', cleveland: 'Sculpture' },
  'prints': { met: 'Prints', va: 'Prints & Drawings', cleveland: 'Prints' },
};

export const MET_DEPARTMENTS: Record<string, number> = {
  'American Decorative Arts': 1,
  'Ancient Near Eastern Art': 3,
  'Arms and Armor': 4,
  'Arts of Africa, Oceania, and the Americas': 5,
  'Asian Art': 6,
  'The Cloisters': 7,
  'Costume Institute': 8,
  'Drawings and Prints': 9,
  'Egyptian Art': 10,
  'European Paintings': 11,
  'European Sculpture and Decorative Arts': 12,
  'Greek and Roman Art': 13,
  'Islamic Art': 14,
  'The Robert Lehman Collection': 15,
  'The Libraries': 16,
  'Medieval Art': 17,
  'Musical Instruments': 18,
  'Photographs': 19,
  'Modern Art': 21,
};

export const MUSEUM_LABELS: Record<string, string> = {
  met: 'Metropolitan Museum',
  va: 'Victoria & Albert',
  cleveland: 'Cleveland Museum',
  scraped: 'Web Scrape',
};

export const DEFAULT_PAGE_SIZE = 20;
