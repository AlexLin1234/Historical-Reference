'use client';

import { useState, useCallback } from 'react';
import type { SearchFilters, AggregatedSearchResults, NormalizedArtifact } from '@/types/artifact';
import { searchAllMuseums } from '@/lib/api/search';
import { semanticRerank } from '@/lib/search/semantic';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  timePeriod: null,
  category: null,
  sources: ['met', 'va', 'cleveland', 'smithsonian', 'harvard', 'chicago'],
  hasImage: true,
};

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<AggregatedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReranking, setIsReranking] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback(
    async (overrideFilters?: Partial<SearchFilters>, overridePage?: number) => {
      const activeFilters = { ...filters, ...overrideFilters };
      const activePage = overridePage ?? page;

      if (!activeFilters.query.trim()) return;

      setIsLoading(true);
      setIsReranking(false);

      let data: AggregatedSearchResults;
      try {
        data = await searchAllMuseums(activeFilters, activePage, DEFAULT_PAGE_SIZE);
        setResults(data);
      } catch {
        setResults({
          results: [],
          isLoading: false,
          errors: [{ source: 'met', message: 'Search failed' }],
        });
        setIsLoading(false);
        return;
      }
      setIsLoading(false);

      // Phase 2: semantic re-ranking runs after keyword results are already shown.
      // All artifacts are ranked globally (across sources) then re-distributed back
      // so the within-source ordering reflects true semantic relevance.
      const allArtifacts = data.results.flatMap((r) => r.artifacts);
      if (allArtifacts.length === 0) return;

      setIsReranking(true);
      try {
        const reranked = await semanticRerank(allArtifacts, activeFilters.query);

        // Re-distribute back to per-source buckets in global semantic order
        const bySource = new Map(
          data.results.map((r) => [r.source, [] as NormalizedArtifact[]])
        );
        for (const artifact of reranked) {
          bySource.get(artifact.source)?.push(artifact);
        }

        const rerankedResults = data.results.map((r) => ({
          ...r,
          artifacts: bySource.get(r.source) ?? r.artifacts,
        }));

        setResults({ ...data, results: rerankedResults });
      } catch {
        // Keyword-ranked results remain — semantic re-ranking is best-effort
      } finally {
        setIsReranking(false);
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
    isReranking,
    page,
    setPage,
    search,
  };
}
