'use client';

import { Suspense, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import { paramsToSearch, searchHref } from '@/lib/search/url';
import type { SearchFilters } from '@/types/artifact';

function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const queryString = params.toString();
  const { filters, page } = useMemo(
    () => paramsToSearch(new URLSearchParams(queryString)),
    [queryString]
  );
  const { results, isLoading, hasQuery, retry } = useSearch(filters, page);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Every change is a navigation: the URL is the search state.
  const go = useCallback(
    (update: Partial<SearchFilters>, nextPage = 1) => {
      router.push(searchHref({ ...filters, ...update }, nextPage), { scroll: false });
    },
    [router, filters]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      go({}, newPage);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [go]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Reenactor&apos;s Reference</h1>
        <p className="text-lg text-steel dark:text-steel-light">
          Search historical artifacts across museum collections
        </p>
      </div>

      <div className="mb-6">
        <SearchBar
          key={filters.query}
          initialQuery={filters.query}
          onSearch={(query) => go({ query, literal: false })}
        />
      </div>

      <div className="mb-8">
        <FilterPanel filters={filters} onFilterChange={(update) => go(update)} />
      </div>

      <div ref={resultsRef} className="scroll-mt-20">
        <SearchResults
          results={results}
          filters={filters}
          isLoading={isLoading}
          hasQuery={hasQuery}
          currentPage={page}
          onPageChange={handlePageChange}
          onRetry={retry}
          onSearch={go}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
