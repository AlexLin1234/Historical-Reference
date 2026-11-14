import type {
  SearchFilters,
  SearchResults,
  AggregatedSearchResults,
  MuseumSource,
  NormalizedArtifact,
} from '@/types/artifact';
import { searchCleveland } from './cleveland';
import { searchVA } from './va';
import { searchMet, batchFetchMetObjects } from './met';
import { searchSmithsonian } from './smithsonian';
import { searchHarvard } from './harvard';
import { searchChicago } from './chicago';
import { vectorSearch } from './vector-search';
import { normalizeClevelandArtwork } from '@/lib/normalizers/cleveland';
import { normalizeVASearchRecord } from '@/lib/normalizers/va';
import { normalizeMetObject } from '@/lib/normalizers/met';
import { normalizeSmithsonianItem } from '@/lib/normalizers/smithsonian';
import { normalizeHarvardObject } from '@/lib/normalizers/harvard';
import { normalizeChicagoArtwork } from '@/lib/normalizers/chicago';
import { DEFAULT_PAGE_SIZE, SEARCH_SOURCES } from '@/lib/constants';
import { parseQuery } from '@/lib/search/query';
import { relatedSearches, suggestCorrection, toDialect } from '@/lib/search/lexicon';
import { rankArtifacts } from '@/lib/search/ranking';
import { CATEGORY_MAP, matchesCategory } from '@/lib/search/categories';

/** What a per-museum searcher receives: filters already interpreted. */
export interface SourceQuery {
  /** Query text in the museum's own spelling convention. */
  text: string;
  dateRange: { startYear: number; endYear: number } | null;
  category: string | null;
  hasImage: boolean;
}

type Searcher = (q: SourceQuery, page: number, pageSize: number) => Promise<SearchResults>;

/** Keep artifacts whose date overlaps the range. Undated pieces are kept. */
function withinRange(a: NormalizedArtifact, range: SourceQuery['dateRange']): boolean {
  if (!range) return true;
  if (a.dateEarliest === null && a.dateLatest === null) return true;
  const earliest = a.dateEarliest ?? a.dateLatest!;
  const latest = a.dateLatest ?? a.dateEarliest!;
  return latest >= range.startYear && earliest <= range.endYear;
}

/**
 * Filters a museum could not apply itself are applied here, so every source
 * honours every filter (at the cost of a shorter page for that source).
 */
function clientFilter(
  artifacts: NormalizedArtifact[],
  q: SourceQuery,
  applied: { date?: boolean; category?: boolean; image?: boolean }
): NormalizedArtifact[] {
  return artifacts.filter(
    (a) =>
      (applied.date || withinRange(a, q.dateRange)) &&
      (applied.category || !q.category || matchesCategory(a, q.category)) &&
      (applied.image || !q.hasImage || a.primaryImage !== null || a.primaryImageSmall !== null)
  );
}

const searchClevelandSource: Searcher = async (q, page, pageSize) => {
  const mapping = q.category ? CATEGORY_MAP[q.category]?.cleveland : undefined;
  const resp = await searchCleveland({
    query: q.text,
    skip: (page - 1) * pageSize,
    limit: pageSize,
    hasImage: q.hasImage,
    type: mapping?.type,
    created_after: q.dateRange?.startYear,
    created_before: q.dateRange?.endYear,
  });
  const artifacts = (resp.data || []).map(normalizeClevelandArtwork);
  return {
    artifacts: clientFilter(artifacts, q, { date: true, category: !!mapping, image: true }),
    totalResults: resp.info?.total ?? 0,
    page,
    pageSize,
    source: 'cleveland',
  };
};

const searchVASource: Searcher = async (q, page, pageSize) => {
  const mapping = q.category ? CATEGORY_MAP[q.category]?.va : undefined;
  const resp = await searchVA({
    query: q.text,
    page,
    pageSize,
    hasImage: q.hasImage,
    categoryId: mapping?.categoryId,
    yearFrom: q.dateRange?.startYear,
    yearTo: q.dateRange?.endYear,
  });
  const artifacts = (resp.records || []).map(normalizeVASearchRecord);
  return {
    // The V&A applied the date range against the full record; the summary's
    // date text is too loose to second-guess it.
    artifacts: clientFilter(artifacts, q, { date: true, category: !!mapping, image: true }),
    totalResults: resp.info?.record_count ?? 0,
    page,
    pageSize,
    source: 'va',
  };
};

const searchMetSource: Searcher = async (q, page, pageSize) => {
  const mapping = q.category ? CATEGORY_MAP[q.category]?.met : undefined;
  const searchResp = await searchMet({
    query: q.text,
    departmentId: mapping?.departmentId,
    medium: mapping?.medium,
    dateBegin: q.dateRange?.startYear,
    dateEnd: q.dateRange?.endYear,
    hasImages: q.hasImage,
  });

  const allIds = searchResp.objectIDs || [];
  const startIdx = (page - 1) * pageSize;
  const pageIds = allIds.slice(startIdx, startIdx + pageSize);
  if (pageIds.length === 0) {
    return { artifacts: [], totalResults: allIds.length, page, pageSize, source: 'met' };
  }

  const objects = await batchFetchMetObjects(pageIds);
  const artifacts = objects.filter((obj) => obj && obj.objectID).map(normalizeMetObject);
  return {
    artifacts: clientFilter(artifacts, q, { date: true, category: !!mapping, image: true }),
    totalResults: allIds.length,
    page,
    pageSize,
    source: 'met',
  };
};

const searchSmithsonianSource: Searcher = async (q, page, pageSize) => {
  const resp = await searchSmithsonian({
    query: q.text,
    rows: pageSize,
    start: (page - 1) * pageSize,
    online_media_only: q.hasImage,
  });
  const artifacts = (resp.rows || []).map(normalizeSmithsonianItem);
  return {
    artifacts: clientFilter(artifacts, q, {}),
    totalResults: resp.rowCount ?? 0,
    page,
    pageSize,
    source: 'smithsonian',
  };
};

const searchHarvardSource: Searcher = async (q, page, pageSize) => {
  const mapping = q.category ? CATEGORY_MAP[q.category]?.harvard : undefined;
  const resp = await searchHarvard({
    query: q.text,
    size: pageSize,
    page,
    hasImage: q.hasImage ? true : undefined,
    classification: mapping?.classification,
  });
  const artifacts = (resp.records || []).map(normalizeHarvardObject);
  return {
    artifacts: clientFilter(artifacts, q, { category: !!mapping }),
    totalResults: resp.info?.totalrecords ?? 0,
    page,
    pageSize,
    source: 'harvard',
  };
};

const searchChicagoSource: Searcher = async (q, page, pageSize) => {
  const mapping = q.category ? CATEGORY_MAP[q.category]?.chicago : undefined;
  const resp = await searchChicago({
    query: q.text,
    limit: pageSize,
    page,
    hasImage: q.hasImage,
    dateFrom: q.dateRange?.startYear,
    dateTo: q.dateRange?.endYear,
    artworkTypes: mapping?.artworkTypes,
  });
  const iiifUrl = resp.config?.iiif_url || 'https://www.artic.edu/iiif/2';
  const artifacts = (resp.data || []).map((item) => normalizeChicagoArtwork(item, iiifUrl));
  return {
    artifacts: clientFilter(artifacts, q, { category: !!mapping }),
    totalResults: resp.pagination?.total ?? 0,
    page,
    pageSize,
    source: 'chicago',
  };
};

const SOURCE_SEARCHERS: Partial<Record<MuseumSource, Searcher>> = {
  met: searchMetSource,
  va: searchVASource,
  cleveland: searchClevelandSource,
  smithsonian: searchSmithsonianSource,
  harvard: searchHarvardSource,
  chicago: searchChicagoSource,
};

export function registerSourceSearcher(source: MuseumSource, searcher: Searcher) {
  SOURCE_SEARCHERS[source] = searcher;
}

const DIALECTS = new Map(SEARCH_SOURCES.map((s) => [s.id, s.dialect]));

/** Resolve after `ms` with `fallback` if the promise has not settled. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

const SEMANTIC_MIN_SIMILARITY = 0.82;
const SEMANTIC_MAX_EXTRA = 10;

export async function searchAllMuseums(
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<AggregatedSearchResults> {
  const parsed = parseQuery(filters.query, { literal: filters.literal });

  // An explicit date filter wins over a date typed into the query.
  const dateFromQuery = !filters.timePeriod && parsed.dateRange !== null;
  const dateRange = filters.timePeriod
    ? {
        startYear: filters.timePeriod.startYear,
        endYear: filters.timePeriod.endYear,
        label: filters.timePeriod.label,
      }
    : parsed.dateRange;

  const sources = filters.sources.filter((s) => SOURCE_SEARCHERS[s]);

  const keywordSearches = sources.map(async (source) => {
    try {
      const result = await SOURCE_SEARCHERS[source]!(
        {
          text: toDialect(parsed.text, DIALECTS.get(source) ?? 'us'),
          dateRange,
          category: filters.category,
          hasImage: filters.hasImage,
        },
        page,
        pageSize
      );
      return { source, result };
    } catch (err) {
      return { source, error: (err as Error).message };
    }
  });

  // Semantic matches from the optional vector index. Best-effort and bounded:
  // it must never hold up or break a keyword search.
  const semanticSearch =
    page === 1 && sources.length > 0
      ? withTimeout(
          vectorSearch({
            query: parsed.text,
            limit: 40,
            source: sources.length === 1 ? sources[0] : null,
            dateFrom: dateRange?.startYear ?? null,
            dateTo: dateRange?.endYear ?? null,
            hasImage: filters.hasImage,
          }),
          2500,
          []
        )
      : Promise.resolve([]);

  const [outcomes, semanticMatches] = await Promise.all([
    Promise.all(keywordSearches),
    semanticSearch,
  ]);

  const results: SearchResults[] = [];
  const errors: { source: MuseumSource; message: string }[] = [];
  for (const outcome of outcomes) {
    if (outcome.result) results.push(outcome.result);
    else errors.push({ source: outcome.source, message: outcome.error ?? 'Search failed' });
  }

  const semantic = new Map<string, number>();
  const keywordIds = new Set(results.flatMap((r) => r.artifacts.map((a) => a.id)));
  const semanticOnly: NormalizedArtifact[] = [];
  for (const match of semanticMatches) {
    if (!sources.includes(match.artifact.source)) continue;
    semantic.set(match.artifact.id, match.similarity);
    if (
      !keywordIds.has(match.artifact.id) &&
      match.similarity >= SEMANTIC_MIN_SIMILARITY &&
      semanticOnly.length < SEMANTIC_MAX_EXTRA &&
      (!filters.category || matchesCategory(match.artifact, filters.category))
    ) {
      semanticOnly.push(match.artifact);
    }
  }

  const ranked = rankArtifacts(
    [...results.map((r) => r.artifacts), semanticOnly],
    parsed,
    { dateRange, semantic, sort: filters.sort }
  );

  const total = results.reduce((sum, r) => sum + r.totalResults, 0);

  return {
    results,
    ranked,
    interpretation: {
      text: parsed.text,
      dateRange,
      dateFromQuery,
      excluded: parsed.excluded,
    },
    related: relatedSearches(parsed.text, 8),
    didYouMean: total < 10 ? suggestCorrection(parsed.text) : null,
    isLoading: false,
    errors,
  };
}
