import type { MuseumSource, SearchFilters, SortOrder, TimePeriod } from '@/types/artifact';
import { REENACTMENT_ERAS, SEARCH_SOURCE_IDS, TIME_PERIODS } from '@/lib/constants';
import { formatYearRange } from '@/lib/dates';

/**
 * Search state lives in the URL so that results survive the browser's back
 * button, can be bookmarked and can be shared with other members of a group.
 */

const SORTS: SortOrder[] = ['relevance', 'date-asc', 'date-desc', 'title'];

export function periodFor(startYear: number, endYear: number): TimePeriod {
  const preset = [...TIME_PERIODS, ...REENACTMENT_ERAS].find(
    (p) => p.startYear === startYear && p.endYear === endYear
  );
  return preset ?? { label: formatYearRange(startYear, endYear), startYear, endYear };
}

function parseYear(value: string | null): number | null {
  if (value === null || !/^-?\d{1,4}$/.test(value)) return null;
  return parseInt(value, 10);
}

export function paramsToSearch(params: URLSearchParams): { filters: SearchFilters; page: number } {
  const from = parseYear(params.get('from'));
  const to = parseYear(params.get('to'));
  let timePeriod: TimePeriod | null = null;
  if (from !== null || to !== null) {
    const start = from ?? -3000;
    const end = to ?? 2100;
    timePeriod = periodFor(Math.min(start, end), Math.max(start, end));
  }

  const src = params.get('src');
  const sources = src === null
    ? SEARCH_SOURCE_IDS
    : (src.split(',').filter((s) => SEARCH_SOURCE_IDS.includes(s as MuseumSource)) as MuseumSource[]);

  const sort = params.get('sort') as SortOrder | null;
  const page = parseInt(params.get('page') || '1', 10);

  return {
    filters: {
      query: (params.get('q') || '').slice(0, 300),
      timePeriod,
      category: params.get('cat') || null,
      sources,
      hasImage: params.get('img') !== '0',
      sort: sort && SORTS.includes(sort) ? sort : 'relevance',
      literal: params.get('lit') === '1',
    },
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function searchToParams(filters: SearchFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.timePeriod) {
    params.set('from', String(filters.timePeriod.startYear));
    params.set('to', String(filters.timePeriod.endYear));
  }
  if (filters.category) params.set('cat', filters.category);
  const all =
    filters.sources.length === SEARCH_SOURCE_IDS.length &&
    SEARCH_SOURCE_IDS.every((s) => filters.sources.includes(s));
  if (!all) params.set('src', filters.sources.join(','));
  if (!filters.hasImage) params.set('img', '0');
  if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort);
  if (filters.literal) params.set('lit', '1');
  if (page > 1) params.set('page', String(page));
  return params.toString();
}

export function searchHref(filters: SearchFilters, page = 1): string {
  const qs = searchToParams(filters, page);
  return qs ? `/?${qs}` : '/';
}
