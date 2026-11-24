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
import { searchMia } from './mia';
import { searchEuropeana } from './europeana';
import { FunctionError } from './invoke';
import { vectorSearch } from './vector-search';
import { normalizeClevelandArtwork } from '@/lib/normalizers/cleveland';
import { normalizeVASearchRecord } from '@/lib/normalizers/va';
import { normalizeMetObject } from '@/lib/normalizers/met';
import { normalizeSmithsonianItem } from '@/lib/normalizers/smithsonian';
import { normalizeHarvardObject } from '@/lib/normalizers/harvard';
import { normalizeChicagoArtwork } from '@/lib/normalizers/chicago';
import { normalizeMiaObject } from '@/lib/normalizers/mia';
import { normalizeEuropeanaItem } from '@/lib/normalizers/europeana';
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
    categoryIds: mapping?.categoryIds,
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
  // A category can map to several Met filters (costume is a department,
  // flat textiles a medium). Each gets a share of the page.
  const variants = mapping && mapping.length > 0 ? mapping : [{}];
  const share = Math.ceil(pageSize / variants.length);

  const searches = await Promise.all(
    variants.map((variant) =>
      searchMet({
        query: q.text,
        ...variant,
        dateBegin: q.dateRange?.startYear,
        dateEnd: q.dateRange?.endYear,
        hasImages: q.hasImage,
        offset: (page - 1) * share,
        limit: share,
      })
    )
  );

  // Interleave the variants' IDs, keeping each one's relevance order.
  const pageIds: number[] = [];
  for (let i = 0; i < share; i++) {
    for (const resp of searches) {
      const id = resp.objectIDs?.[i];
      if (id !== undefined && !pageIds.includes(id)) pageIds.push(id);
    }
  }
  // Paging advances every variant together, so the largest sets the length.
  const total = Math.max(...searches.map((r) => r.total ?? 0)) * variants.length;
  if (pageIds.length === 0) {
    return { artifacts: [], totalResults: total, page, pageSize, source: 'met' };
  }

  // The search returns object IDs only; details are fetched separately.
  const objects = await batchFetchMetObjects(pageIds.slice(0, 20));
  // Keep the Met's relevance order (the batch may drop withdrawn records).
  const byId = new Map(objects.filter((o) => o && o.objectID).map((o) => [o.objectID, o]));
  const artifacts = pageIds
    .map((id) => byId.get(id))
    .filter((o) => o !== undefined)
    .map(normalizeMetObject);
  return {
    artifacts: clientFilter(artifacts, q, { date: true, category: !!mapping, image: true }),
    totalResults: total,
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
    // Many records flagged online_media_type:Images carry no image URLs
    // (National Museum of American History records, as of 2026-11), so the
    // image filter is also checked here against what was actually returned.
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

const searchMiaSource: Searcher = async (q, page, pageSize) => {
  const mapping = q.category ? CATEGORY_MAP[q.category]?.mia : undefined;
  const resp = await searchMia({
    query: q.text,
    size: pageSize,
    from: (page - 1) * pageSize,
    hasImage: q.hasImage,
    classifications: mapping?.classifications,
  });
  const artifacts = (resp.records || []).map(normalizeMiaObject);
  return {
    artifacts: clientFilter(artifacts, q, { category: !!mapping }),
    totalResults: resp.total ?? 0,
    page,
    pageSize,
    source: 'mia',
  };
};

const searchEuropeanaSource: Searcher = async (q, page, pageSize) => {
  // Europeana can only filter CE years; BCE ranges are filtered here instead.
  const serverDates = !!q.dateRange && q.dateRange.startYear >= 1;
  const resp = await searchEuropeana({
    query: q.text,
    rows: pageSize,
    start: (page - 1) * pageSize + 1,
    hasImage: q.hasImage,
    yearFrom: serverDates ? q.dateRange!.startYear : undefined,
    yearTo: serverDates ? q.dateRange!.endYear : undefined,
  });
  const artifacts = (resp.items || []).map(normalizeEuropeanaItem);
  return {
    artifacts: clientFilter(artifacts, q, { date: serverDates, image: true }),
    totalResults: resp.totalResults ?? 0,
    page,
    pageSize,
    source: 'europeana',
  };
};

const SOURCE_SEARCHERS: Partial<Record<MuseumSource, Searcher>> = {
  met: searchMetSource,
  va: searchVASource,
  cleveland: searchClevelandSource,
  smithsonian: searchSmithsonianSource,
  harvard: searchHarvardSource,
  chicago: searchChicagoSource,
  mia: searchMiaSource,
  europeana: searchEuropeanaSource,
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
      return {
        source,
        error: (err as Error).message,
        notConfigured: err instanceof FunctionError && err.code === 'not_configured',
      };
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
  const errors: AggregatedSearchResults['errors'] = [];
  for (const outcome of outcomes) {
    if (outcome.result) results.push(outcome.result);
    else {
      errors.push({
        source: outcome.source,
        message: outcome.error ?? 'Search failed',
        notConfigured: outcome.notConfigured,
      });
    }
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
