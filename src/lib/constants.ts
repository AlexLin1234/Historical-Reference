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

export const CATEGORY_MAP: Record<string, { met?: string; va?: string; cleveland?: string; smithsonian?: string; harvard?: string; chicago?: string }> = {
  'arms-armor': { met: 'Arms and Armor', va: 'Metalwork', cleveland: 'Arms and Armor', smithsonian: 'Arms and Armor' },
  'textiles': { met: 'Textiles', va: 'Textiles and Fashion', cleveland: 'Textiles', smithsonian: 'Textiles' },
  'ceramics': { met: 'Ceramics', va: 'Ceramics', cleveland: 'Ceramics', smithsonian: 'Ceramics' },
  'metalwork': { met: 'Metalwork', va: 'Metalwork', cleveland: 'Metalwork', smithsonian: 'Metalwork' },
  'furniture': { met: 'Furniture', va: 'Furniture', cleveland: 'Furniture', smithsonian: 'Furniture' },
  'paintings': { met: 'Paintings', va: 'Paintings', cleveland: 'Paintings', chicago: 'Paintings', harvard: 'Paintings' },
  'sculpture': { met: 'Sculpture', va: 'Sculpture', cleveland: 'Sculpture', harvard: 'Sculpture', chicago: 'Sculpture' },
  'prints': { met: 'Prints', va: 'Prints & Drawings', cleveland: 'Prints', harvard: 'Prints', chicago: 'Prints' },
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
  smithsonian: 'Smithsonian Institution',
  harvard: 'Harvard Art Museums',
  chicago: 'Art Institute of Chicago',
  europeana: 'Europeana',
  rijksmuseum: 'Rijksmuseum',
  scraped: 'Web Scrape',
};

// Famous museums for web scraping (no public API)
export const SCRAPABLE_MUSEUMS = [
  {
    name: 'British Museum',
    baseUrl: 'https://www.britishmuseum.org',
    searchUrl: 'https://www.britishmuseum.org/collection/search?keyword=',
    description: '8 million works - Ancient Egypt, Greece, Rome, Medieval Europe',
  },
  {
    name: 'Louvre Museum',
    baseUrl: 'https://collections.louvre.fr',
    searchUrl: 'https://collections.louvre.fr/en/recherche?q=',
    description: '615,000+ works including ancient civilizations',
  },
  {
    name: 'Smithsonian National Museum',
    baseUrl: 'https://americanhistory.si.edu',
    searchUrl: 'https://americanhistory.si.edu/search?edan_q=',
    description: 'American cultural artifacts, military items, textiles',
  },
  {
    name: 'National Gallery (UK)',
    baseUrl: 'https://www.nationalgallery.org.uk',
    searchUrl: 'https://www.nationalgallery.org.uk/paintings/search?q=',
    description: '2,300 paintings from 13th-19th century',
  },
  {
    name: 'Rijksmuseum',
    baseUrl: 'https://www.rijksmuseum.nl',
    searchUrl: 'https://www.rijksmuseum.nl/en/search?q=',
    description: 'Dutch Golden Age art, Rembrandt, decorative arts',
  },
  {
    name: 'Museum of Fine Arts Boston',
    baseUrl: 'https://collections.mfa.org',
    searchUrl: 'https://collections.mfa.org/search/Collections?keyword=',
    description: '500,000+ works - ancient world, textiles, arms & armor',
  },
  {
    name: 'The Wallace Collection',
    baseUrl: 'https://wallacelive.wallacecollection.org',
    searchUrl: 'https://wallacelive.wallacecollection.org/eMP/eMuseumPlus',
    description: 'European arms & armor, medieval to 19th century',
  },
  {
    name: 'Royal Armouries (UK)',
    baseUrl: 'https://collections.royalarmouries.org',
    searchUrl: 'https://collections.royalarmouries.org/search?query=',
    description: 'World-class arms & armor, medieval weapons',
  },
];

export const DEFAULT_PAGE_SIZE = 20;
