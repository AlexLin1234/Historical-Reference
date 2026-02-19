export type MuseumSource = 'met' | 'va' | 'cleveland' | 'smithsonian' | 'harvard' | 'chicago' | 'europeana' | 'rijksmuseum' | 'scraped';

export interface NormalizedArtifact {
  id: string;
  sourceId: string;
  source: MuseumSource;

  title: string;
  date: string;
  dateEarliest: number | null;
  dateLatest: number | null;
  period: string | null;
  culture: string | null;
  classification: string | null;
  objectType: string | null;
  medium: string | null;
  dimensions: string | null;

  artist: string | null;
  artistBio: string | null;

  description: string | null;

  primaryImage: string | null;
  primaryImageSmall: string | null;
  additionalImages: string[];

  department: string | null;
  gallery: string | null;
  country: string | null;
  region: string | null;
  creditLine: string | null;

  sourceUrl: string;

  isPublicDomain: boolean;
}

export interface TimePeriod {
  label: string;
  startYear: number;
  endYear: number;
}

export interface Category {
  value: string;
  label: string;
}

export interface SearchFilters {
  query: string;
  timePeriod: TimePeriod | null;
  category: string | null;
  sources: MuseumSource[];
  hasImage: boolean;
}

export interface SearchResults {
  artifacts: NormalizedArtifact[];
  totalResults: number;
  page: number;
  pageSize: number;
  source: MuseumSource;
}

export interface AggregatedSearchResults {
  results: SearchResults[];
  isLoading: boolean;
  errors: { source: MuseumSource; message: string }[];
}
