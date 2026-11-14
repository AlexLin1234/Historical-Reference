export type MuseumSource =
  | 'met'
  | 'va'
  | 'cleveland'
  | 'smithsonian'
  | 'harvard'
  | 'chicago'
  | 'europeana'
  | 'rijksmuseum'
  | 'scraped';

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

  /** Museum accession / inventory number, used in citations. */
  accessionNumber?: string | null;
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

export type SortOrder = 'relevance' | 'date-asc' | 'date-desc' | 'title';

export interface SearchFilters {
  query: string;
  timePeriod: TimePeriod | null;
  category: string | null;
  sources: MuseumSource[];
  hasImage: boolean;
  sort?: SortOrder;
  /** When true the query is sent as typed: no date extraction from the text. */
  literal?: boolean;
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
  /** All artifacts from every source, globally ranked and de-duplicated. */
  ranked: NormalizedArtifact[];
  /** How the raw query was interpreted (date extraction, exclusions, ...). */
  interpretation: {
    text: string;
    dateRange: { startYear: number; endYear: number; label: string } | null;
    dateFromQuery: boolean;
    excluded: string[];
  };
  related: string[];
  didYouMean: string | null;
  isLoading: boolean;
  errors: { source: MuseumSource; message: string }[];
}
