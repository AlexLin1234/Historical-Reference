'use client';

import { useState, useCallback } from 'react';
import type { SearchFilters, AggregatedSearchResults } from '@/types/artifact';
import { searchAllMuseums } from '@/lib/api/search';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  timePeriod: null,
  category: null,
  sources: ['met', 'va', 'cleveland'],
  hasImage: true,
};

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<AggregatedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback(
    async (overrideFilters?: Partial<SearchFilters>, overridePage?: number) => {
      const activeFilters = { ...filters, ...overrideFilters };
      const activePage = overridePage ?? page;

      if (!activeFilters.query.trim()) return;

      setIsLoading(true);
      try {
        const data = await searchAllMuseums(activeFilters, activePage, DEFAULT_PAGE_SIZE);
        setResults(data);
      } catch {
        setResults({
          results: [],
          isLoading: false,
          errors: [{ source: 'met', message: 'Search failed' }],
        });
      } finally {
        setIsLoading(false);
      }
    },
    [filters, page]
  );

  const updateFilters = useCallback((update: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setPage(1);
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  return {
    filters,
    setFilters: updateFilters,
    setQuery,
    results,
    isLoading,
    page,
    setPage,
    search,
  };
}
