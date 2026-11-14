'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SearchFilters, AggregatedSearchResults } from '@/types/artifact';
import { searchAllMuseums } from '@/lib/api/search';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

// Results are remembered for the life of the tab so that returning from an
// artifact page (or flipping back a page) is instant and costs no API calls.
const CACHE_LIMIT = 40;
const cache = new Map<string, AggregatedSearchResults>();

function remember(key: string, value: AggregatedSearchResults) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
}

function failed(message: string): AggregatedSearchResults {
  return {
    results: [],
    ranked: [],
    interpretation: { text: '', dateRange: null, dateFromQuery: false, excluded: [] },
    related: [],
    didYouMean: null,
    isLoading: false,
    errors: [{ source: 'met', message }],
  };
}

/**
 * Runs the search described by `filters` + `page`. The inputs are the single
 * source of truth (they come from the URL); the hook only fetches and caches.
 */
export function useSearch(filters: SearchFilters, page: number) {
  const hasQuery = filters.query.trim().length > 0 && filters.sources.length > 0;
  const key = hasQuery ? JSON.stringify([filters, page]) : null;

  const [fetched, setFetched] = useState<{ key: string; data: AggregatedSearchResults } | null>(
    null
  );
  const [attempt, setAttempt] = useState(0);

  const cached = key ? cache.get(key) : undefined;
  const results = key ? cached ?? (fetched?.key === key ? fetched.data : null) : null;

  useEffect(() => {
    if (!key || cache.has(key)) return;
    // Ignore the response if the user has moved on to another search.
    let stale = false;
    searchAllMuseums(filters, page, DEFAULT_PAGE_SIZE)
      .then((data) => {
        if (stale) return;
        // Don't cache a search where nothing answered; let it be retried.
        if (data.results.length > 0) remember(key, data);
        setFetched({ key, data });
      })
      .catch((err: Error) => {
        if (!stale) setFetched({ key, data: failed(err.message || 'Search failed') });
      });
    return () => {
      stale = true;
    };
    // `key` captures filters and page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => {
    if (key) cache.delete(key);
    setFetched(null);
    setAttempt((n) => n + 1);
  }, [key]);

  return { results, isLoading: key !== null && results === null, hasQuery, retry };
}
