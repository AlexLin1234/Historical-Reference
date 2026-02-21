'use client';

import { useState, useCallback } from 'react';
import type { SearchFilters, AggregatedSearchResults, NormalizedArtifact } from '@/types/artifact';
import { searchAllMuseums } from '@/lib/api/search';
import { vectorSearch, filtersToVectorOptions } from '@/lib/api/vector-search';
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

      // Phase 2: server-side vector search re-ranks and supplements keyword results.
      // The vector-search Edge Function embeds the query with gte-small, queries
      // pgvector, and returns artifacts ordered by cosine similarity.
      //
      // Strategy:
      //  1. Vector results surface semantically relevant artifacts (even if they
      //     didn't match keywords) and go to the front of the list.
      //  2. Keyword-only results that weren't in the vector results fill in after.
      //  3. If the vector index is empty (not yet seeded), this is a no-op and
      //     keyword-ranked results are kept as-is.
      const allKeywordArtifacts = data.results.flatMap((r) => r.artifacts);
      if (allKeywordArtifacts.length === 0) return;

      setIsReranking(true);
      try {
        const vectorMatches = await vectorSearch(
          filtersToVectorOptions(activeFilters, 50)
        );

        if (vectorMatches.length === 0) return; // index not seeded — keep keyword order

        // Only keep vector matches whose source is currently selected
        const selectedSources = new Set(activeFilters.sources);
        const filteredMatches = vectorMatches.filter((a) =>
          selectedSources.has(a.source)
        );

        if (filteredMatches.length === 0) return;

        // Merge: vector results first, then keyword-only results not already included
        const vectorIds = new Set(filteredMatches.map((a) => a.id));
        const keywordOnly = allKeywordArtifacts.filter((a) => !vectorIds.has(a.id));
        const merged = [...filteredMatches, ...keywordOnly];

        // Re-distribute back to per-source buckets, preserving the merged order
        const bySource = new Map(
          data.results.map((r) => [r.source, [] as NormalizedArtifact[]])
        );
        for (const artifact of merged) {
          bySource.get(artifact.source)?.push(artifact);
        }

        const rerankedResults = data.results.map((r) => ({
          ...r,
          artifacts: bySource.get(r.source) ?? r.artifacts,
        }));

        setResults({ ...data, results: rerankedResults });
      } catch {
        // Vector search is best-effort: keyword-ranked results remain on failure
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
