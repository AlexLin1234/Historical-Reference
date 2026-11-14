import type { TimePeriod, Category, MuseumSource } from '@/types/artifact';

export const TIME_PERIODS: TimePeriod[] = [
  { label: 'Ancient (before 500 CE)', startYear: -3000, endYear: 500 },
  { label: 'Medieval (500–1400)', startYear: 500, endYear: 1400 },
  { label: 'Renaissance (1400–1600)', startYear: 1400, endYear: 1600 },
  { label: 'Early Modern (1600–1800)', startYear: 1600, endYear: 1800 },
  { label: '19th Century (1800–1900)', startYear: 1800, endYear: 1900 },
  { label: 'Modern (1900–present)', startYear: 1900, endYear: 2100 },
];

/** Narrower eras that match common reenactment periods. */
export const REENACTMENT_ERAS: TimePeriod[] = [
  { label: 'Roman Republic (509–27 BCE)', startYear: -509, endYear: -27 },
  { label: 'Roman Empire (27 BCE–284 CE)', startYear: -27, endYear: 284 },
  { label: 'Late Roman & Migration (284–600)', startYear: 284, endYear: 600 },
  { label: 'Anglo-Saxon & Early Medieval (600–793)', startYear: 600, endYear: 793 },
  { label: 'Viking Age (793–1066)', startYear: 793, endYear: 1066 },
  { label: 'Norman & Crusades (1066–1300)', startYear: 1066, endYear: 1300 },
  { label: 'Hundred Years War (1337–1453)', startYear: 1337, endYear: 1453 },
  { label: 'Wars of the Roses (1455–1487)', startYear: 1455, endYear: 1487 },
  { label: 'Tudor (1485–1603)', startYear: 1485, endYear: 1603 },
  { label: 'Thirty Years War / English Civil War (1618–1660)', startYear: 1618, endYear: 1660 },
  { label: 'Jacobite & Seven Years War (1688–1763)', startYear: 1688, endYear: 1763 },
  { label: 'American Revolution (1765–1783)', startYear: 1765, endYear: 1783 },
  { label: 'Napoleonic & Regency (1792–1820)', startYear: 1792, endYear: 1820 },
  { label: 'American Civil War (1861–1865)', startYear: 1861, endYear: 1865 },
  { label: 'Victorian (1837–1901)', startYear: 1837, endYear: 1901 },
  { label: 'First World War (1914–1918)', startYear: 1914, endYear: 1918 },
  { label: 'Second World War (1939–1945)', startYear: 1939, endYear: 1945 },
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

export interface SourceInfo {
  id: MuseumSource;
  label: string;
  shortLabel: string;
  /** Spelling convention of the catalogue, used to rewrite queries. */
  dialect: 'us' | 'uk';
  /** Used in citations: "Institution, City". */
  citation: string;
}

/** Museums with a live search integration, in display order. */
export const SEARCH_SOURCES: SourceInfo[] = [
  { id: 'met', label: 'Metropolitan Museum', shortLabel: 'Met', dialect: 'us', citation: 'The Metropolitan Museum of Art, New York' },
  { id: 'va', label: 'Victoria & Albert', shortLabel: 'V&A', dialect: 'uk', citation: 'Victoria and Albert Museum, London' },
  { id: 'cleveland', label: 'Cleveland Museum', shortLabel: 'Cleveland', dialect: 'us', citation: 'The Cleveland Museum of Art' },
  { id: 'smithsonian', label: 'Smithsonian Institution', shortLabel: 'Smithsonian', dialect: 'us', citation: 'Smithsonian Institution, Washington, DC' },
  { id: 'harvard', label: 'Harvard Art Museums', shortLabel: 'Harvard', dialect: 'us', citation: 'Harvard Art Museums, Cambridge, MA' },
  { id: 'chicago', label: 'Art Institute of Chicago', shortLabel: 'Chicago', dialect: 'us', citation: 'The Art Institute of Chicago' },
];

export const SEARCH_SOURCE_IDS: MuseumSource[] = SEARCH_SOURCES.map((s) => s.id);

export const MUSEUM_LABELS: Record<string, string> = {
  ...Object.fromEntries(SEARCH_SOURCES.map((s) => [s.id, s.label])),
  europeana: 'Europeana',
  rijksmuseum: 'Rijksmuseum',
  scraped: 'Web Scrape',
};

export const MUSEUM_CITATIONS: Record<string, string> = Object.fromEntries(
  SEARCH_SOURCES.map((s) => [s.id, s.citation])
);

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

/** Results requested from each museum per page. */
export const DEFAULT_PAGE_SIZE = 15;

/** Deep paging is unreliable on several museum APIs; stop here. */
export const MAX_PAGES = 60;
