import type { SearchFilters, SearchResults, AggregatedSearchResults, MuseumSource } from '@/types/artifact';
import { searchCleveland } from './cleveland';
import { searchVA } from './va';
import { searchMet, batchFetchMetObjects } from './met';
import { searchSmithsonian } from './smithsonian';
import { normalizeClevelandArtwork } from '@/lib/normalizers/cleveland';
import { normalizeVASearchRecord } from '@/lib/normalizers/va';
import { normalizeMetObject } from '@/lib/normalizers/met';
import { normalizeSmithsonianItem } from '@/lib/normalizers/smithsonian';
import { CATEGORY_MAP, MET_DEPARTMENTS, DEFAULT_PAGE_SIZE } from '@/lib/constants';

async function searchClevelandSource(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<SearchResults> {
  const categoryMapping = filters.category ? CATEGORY_MAP[filters.category]?.cleveland : undefined;
  const resp = await searchCleveland({
    query: filters.query,
    skip: (page - 1) * pageSize,
    limit: pageSize,
    hasImage: filters.hasImage,
    type: categoryMapping,
    created_after: filters.timePeriod?.startYear,
    created_before: filters.timePeriod?.endYear,
  });

  return {
    artifacts: (resp.data || []).map(normalizeClevelandArtwork),
    totalResults: resp.info?.total ?? 0,
    page,
    pageSize,
    source: 'cleveland',
  };
}

async function searchVASource(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<SearchResults> {
  const categoryMapping = filters.category ? CATEGORY_MAP[filters.category]?.va : undefined;
  const resp = await searchVA({
    query: filters.query,
    page,
    pageSize,
    category: categoryMapping,
  });

  let artifacts = (resp.records || []).map(normalizeVASearchRecord);

  if (filters.timePeriod) {
    artifacts = artifacts.filter((a) => {
      if (a.dateEarliest === null && a.dateLatest === null) return true;
      const earliest = a.dateEarliest ?? -Infinity;
      const latest = a.dateLatest ?? Infinity;
      return latest >= filters.timePeriod!.startYear && earliest <= filters.timePeriod!.endYear;
    });
  }

  return {
    artifacts,
    totalResults: resp.info?.record_count ?? 0,
    page,
    pageSize,
    source: 'va',
  };
}

async function searchMetSource(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<SearchResults> {
  const categoryMapping = filters.category ? CATEGORY_MAP[filters.category]?.met : undefined;
  const departmentId = categoryMapping ? MET_DEPARTMENTS[categoryMapping] : undefined;

  const searchResp = await searchMet({
    query: filters.query,
    departmentId,
    dateBegin: filters.timePeriod?.startYear,
    dateEnd: filters.timePeriod?.endYear,
    hasImages: filters.hasImage,
  });

  const allIds = searchResp.objectIDs || [];
  const startIdx = (page - 1) * pageSize;
  const pageIds = allIds.slice(startIdx, startIdx + pageSize);

  if (pageIds.length === 0) {
    return { artifacts: [], totalResults: allIds.length, page, pageSize, source: 'met' };
  }

  const objects = await batchFetchMetObjects(pageIds);
  const artifacts = objects
    .filter((obj) => obj && obj.objectID)
    .map(normalizeMetObject);

  return {
    artifacts,
    totalResults: allIds.length,
    page,
    pageSize,
    source: 'met',
  };
}

async function searchSmithsonianSource(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<SearchResults> {
  // The Smithsonian API's online_media_type filter doesn't reliably exclude
  // items without images, so we over-fetch and filter client-side.
  const fetchMultiplier = filters.hasImage ? 5 : 1;
  const resp = await searchSmithsonian({
    query: filters.query,
    rows: pageSize * fetchMultiplier,
    start: (page - 1) * pageSize * fetchMultiplier,
    online_media_only: filters.hasImage,
  });

  let artifacts = (resp.rows || []).map(normalizeSmithsonianItem);

  // Filter out items without images when hasImage filter is on
  if (filters.hasImage) {
    artifacts = artifacts.filter((a) => a.primaryImage !== null);
  }

  // Client-side date filtering
  if (filters.timePeriod) {
    artifacts = artifacts.filter((a) => {
      if (a.dateEarliest === null && a.dateLatest === null) return true;
      const earliest = a.dateEarliest ?? -Infinity;
      const latest = a.dateLatest ?? Infinity;
      return latest >= filters.timePeriod!.startYear && earliest <= filters.timePeriod!.endYear;
    });
  }

  // Trim to requested page size after filtering
  artifacts = artifacts.slice(0, pageSize);

  return {
    artifacts,
    totalResults: resp.rowCount ?? 0,
    page,
    pageSize,
    source: 'smithsonian',
  };
}

const SOURCE_SEARCHERS: Record<
  MuseumSource,
  ((f: SearchFilters, p: number, ps: number) => Promise<SearchResults>) | null
> = {
  cleveland: searchClevelandSource,
  va: searchVASource,
  met: searchMetSource,
  smithsonian: searchSmithsonianSource,
  harvard: null,
  chicago: null,
  scraped: null,
};

export async function searchAllMuseums(
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<AggregatedSearchResults> {
  const sources = filters.sources.filter((s) => SOURCE_SEARCHERS[s] != null);

  const promises = sources.map(async (source): Promise<{
    source: MuseumSource;
    result?: SearchResults;
    error?: string;
  }> => {
    try {
      const searcher = SOURCE_SEARCHERS[source]!;
      const result = await searcher(filters, page, pageSize);
      return { source, result };
    } catch (err) {
      return { source, error: (err as Error).message };
    }
  });

  const outcomes = await Promise.allSettled(promises);

  const results: SearchResults[] = [];
  const errors: { source: MuseumSource; message: string }[] = [];

  for (const outcome of outcomes) {
    if (outcome.status === 'fulfilled') {
      const { result, error, source } = outcome.value;
      if (result) results.push(result);
      if (error) errors.push({ source, message: error });
    }
  }

  return { results, isLoading: false, errors };
}
