import { invokeFunction } from './invoke';

type LangMap = Record<string, string[]>;

export interface EuropeanaItem {
  id: string;
  title?: string[];
  type?: string;
  year?: string[];
  country?: string[];
  dataProvider?: string[];
  provider?: string[];
  rights?: string[];
  guid?: string;
  edmPreview?: string[];
  edmIsShownBy?: string[];
  edmIsShownAt?: string[];
  dcCreator?: string[];
  dcDescription?: string[];
  dcTitleLangAware?: LangMap;
  dcDescriptionLangAware?: LangMap;
  dcTypeLangAware?: LangMap;
  dcCreatorLangAware?: LangMap;
  edmConceptPrefLabelLangAware?: LangMap;
  edmPlaceLabelLangAware?: LangMap;
}

export interface EuropeanaSearchResponse {
  totalResults: number;
  items: EuropeanaItem[];
}

interface EuropeanaSearchParams {
  query: string;
  rows?: number;
  start?: number;
  hasImage?: boolean;
  yearFrom?: number;
  yearTo?: number;
  /** Place names (OR-ed). */
  places?: string[];
}

export async function searchEuropeana(params: EuropeanaSearchParams): Promise<EuropeanaSearchResponse> {
  return invokeFunction('europeana', { action: 'search', ...params }, 'Europeana');
}

export async function getEuropeanaItem(recordId: string): Promise<EuropeanaItem> {
  return invokeFunction('europeana', { action: 'object', recordId }, 'Europeana');
}
